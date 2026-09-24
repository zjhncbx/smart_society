import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { RiskAlert } from './RiskAlert';
import { Project } from './Project';
import { Member } from './Member';
import { DataQualitySnapshot } from './DataQualitySnapshot';
import { WorkItem } from './WorkItem';
import { UserOrganization } from './UserOrganization';
import { AutomationRunLog } from './AutomationRunLog';

// 兼容多种入参形态：event.body 字符串/对象、SDK 额外包裹 data、双层编码
function parseParams(event: any): any {
  let body: any = event && event.body !== undefined ? event.body : event;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return {}; }
  }
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return {}; }
  }
  if (body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 1 && 'data' in body) {
    body = body.data;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return {}; }
    }
  }
  return body ?? {};
}

const ZONE_NAME = 'default';
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

async function queryAllByOrg<T>(col: CloudDBCollection<T>, orgId: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

/** 项目状态 → 展示名（与移动端 org_labels 默认文案一致） */
const PROJECT_STATUS_LABELS: Record<number, string> = {
  0: '筹备中',
  1: '进行中',
  2: '已暂停',
  3: '已完成',
};

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-report-stats called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = String(params?.userId || '');
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 参数' } });
      return;
    }
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 参数' } });
      return;
    }

    // 成员校验：非本组织成员拒绝
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    // ---- 收支月度趋势（已批准单据按月聚合） ----
    const financeCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const finances = await queryAllByOrg(financeCol, orgId);
    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const r of finances) {
      if (r.status !== 'approved') continue;
      const month = r.date ? r.date.toISOString().slice(0, 7) : '';
      if (!month) continue;
      const cur = byMonth.get(month) ?? { income: 0, expense: 0 };
      if (r.type === 'income') cur.income += Number(r.amount || 0);
      if (r.type === 'expense') cur.expense += Number(r.amount || 0);
      byMonth.set(month, cur);
    }
    const financeTrend = Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, v]) => ({ month, income: v.income, expense: v.expense }));

    // ---- 风险分布（未关闭风险/预警按 kind 计数） ----
    const riskCol: CloudDBCollection<RiskAlert> = db.collection(RiskAlert);
    const risks = await queryAllByOrg(riskCol, orgId);
    const openRisks = risks.filter((r) => r.status === 'open');
    const riskDistribution = [
      { name: '风险', value: openRisks.filter((r) => r.kind === 'risk').length },
      { name: '预警', value: openRisks.filter((r) => r.kind === 'warning').length },
    ];

    // ---- 数据质量维度（最新快照维度分） ----
    const dqCol: CloudDBCollection<DataQualitySnapshot> = db.collection(DataQualitySnapshot);
    const snapshotRows = await dqCol.query().equalTo('orgId', orgId).orderByDesc('checkedAt').limit(1).get();
    let dqScore = 100;
    let dqDimensions: Array<{ name: string; value: number }> = [];
    if (snapshotRows.length > 0) {
      const snapshot = snapshotRows[0];
      dqScore = Number(snapshot.score ?? 100);
      try {
        const dims = JSON.parse(snapshot.dimensions || '{}');
        if (dims && typeof dims === 'object' && !Array.isArray(dims)) {
          dqDimensions = Object.entries(dims).map(([name, value]) => ({
            name,
            value: Number(value) || 0,
          }));
        }
      } catch {
        dqDimensions = [];
      }
    }

    // ---- 项目状态计数 ----
    const projectCol: CloudDBCollection<Project> = db.collection(Project);
    const projects = await queryAllByOrg(projectCol, orgId);
    const statusCount = new Map<string, number>();
    for (const p of projects) {
      const label = PROJECT_STATUS_LABELS[p.status] ?? `状态${p.status}`;
      statusCount.set(label, (statusCount.get(label) ?? 0) + 1);
    }
    const projectStatus = Array.from(statusCount.entries()).map(([name, value]) => ({ name, value }));

    // ---- 汇总指标 ----
    const memberCol: CloudDBCollection<Member> = db.collection(Member);
    const members = await queryAllByOrg(memberCol, orgId);

    const workItemCol: CloudDBCollection<WorkItem> = db.collection(WorkItem);
    const pendingWorkItems = await workItemCol
      .query()
      .equalTo('orgId', orgId)
      .equalTo('status', 'open')
      .countQuery('id');

    // 自动化近 20 次运行成功率（无记录时按 100）
    const logCol: CloudDBCollection<AutomationRunLog> = db.collection(AutomationRunLog);
    const logs = await logCol.query().equalTo('orgId', orgId).orderByDesc('runAt').limit(20).get();
    let successRate = 100;
    if (logs.length > 0) {
      const ok = logs.filter((l) => l.status === 'success').length;
      successRate = Math.round((ok / logs.length) * 100);
    }

    const data = {
      financeTrend,
      riskDistribution,
      dqDimensions,
      projectStatus,
      totals: {
        members: members.length,
        projects: projects.length,
        pendingWorkItems,
        dqScore,
        successRate,
      },
    };

    logger.info(`get-report-stats done: orgId=${orgId}, months=${financeTrend.length}`);
    callback({ ret: { code: 0, message: 'ok', data } });
  } catch (err: any) {
    logger.error(`get-report-stats error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
