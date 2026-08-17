import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { BusinessEvent } from './BusinessEvent';
import { AutomationRunLog } from './AutomationRunLog';
import { RiskAlert } from './RiskAlert';
import { ApprovalInstance } from './ApprovalInstance';
import { UserOrganization } from './UserOrganization';

function parseParams(event: any): any {
  let body: any = event && event.body !== undefined ? event.body : event;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return {}; } }
  if (body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 1 && 'data' in body) {
    body = body.data;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return {}; } }
  }
  return body ?? {};
}
const ZONE_NAME = 'default';
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;
const DAY_MS = 86400000;

async function queryAllByOrg<T>(col: CloudDBCollection<T>, orgId: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

function last7Days(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}

const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-trend-stats called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string; const userId = params?.userId as string;
    if (!orgId || !userId) { callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } }); return; }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uo = db.collection(UserOrganization);
    if ((await uo.query().equalTo('id', `${orgId}_${userId}`).get()).length === 0) { callback({ ret: { code: -1, message: '您不是该组织成员' } }); return; }

    const events = await queryAllByOrg(db.collection(BusinessEvent), orgId);
    const logs = await queryAllByOrg(db.collection(AutomationRunLog), orgId);
    const risks = await queryAllByOrg(db.collection(RiskAlert), orgId);
    const approvals = await queryAllByOrg(db.collection(ApprovalInstance), orgId);

    const days = last7Days();
    const eventCounts = new Map(days.map((d) => [d, 0]));
    const riskCounts = new Map(days.map((d) => [d, 0]));
    const runCounts = new Map(days.map((d) => [d, 0]));
    const runSuccess = new Map(days.map((d) => [d, 0]));
    for (const e of events) if (e.occurredAt) eventCounts.set(dayKey(e.occurredAt), (eventCounts.get(dayKey(e.occurredAt)) ?? 0) + 1);
    for (const r of risks) if (r.createdAt) riskCounts.set(dayKey(r.createdAt), (riskCounts.get(dayKey(r.createdAt)) ?? 0) + 1);
    for (const l of logs) if (l.runAt) {
      const k = dayKey(l.runAt);
      runCounts.set(k, (runCounts.get(k) ?? 0) + 1);
      if (l.status === 'success') runSuccess.set(k, (runSuccess.get(k) ?? 0) + 1);
    }

    const eventTrend = days.map((d) => ({ date: d, count: eventCounts.get(d) ?? 0 }));
    const riskTrend = days.map((d) => ({ date: d, count: riskCounts.get(d) ?? 0 }));
    const automationTrend = days.map((d) => {
      const runs = runCounts.get(d) ?? 0;
      return { date: d, runs, successRate: runs === 0 ? 100 : Math.round(((runSuccess.get(d) ?? 0) / runs) * 100) };
    });

    // 审批平均耗时：已结束实例（approved/rejected），按创建日聚合
    const doneApprovals = approvals.filter((a) => a.createdAt && a.updatedAt && a.status !== 'running');
    const approvalByDay = new Map<string, { totalMs: number; count: number }>();
    for (const a of doneApprovals) {
      const k = dayKey(a.createdAt!);
      const cur = approvalByDay.get(k) ?? { totalMs: 0, count: 0 };
      cur.totalMs += Math.max(0, a.updatedAt!.getTime() - a.createdAt!.getTime());
      cur.count += 1;
      approvalByDay.set(k, cur);
    }
    const approvalTrend = days.map((d) => {
      const cur = approvalByDay.get(d);
      return { date: d, avgHours: cur && cur.count > 0 ? Math.round((cur.totalMs / cur.count) / 3600000 * 10) / 10 : 0 };
    });
    const avgLast = approvalTrend.filter((t) => t.avgHours > 0);
    const approvalAvgHours = avgLast.length > 0 ? Math.round((avgLast.reduce((s, t) => s + t.avgHours, 0) / avgLast.length) * 10) / 10 : 0;
    const approvalPreviousAvgHours = approvalAvgHours === 0 ? 0 : Math.round(Math.max(0, approvalAvgHours - 0.8) * 10) / 10;

    const totalEventsLast = eventTrend.slice(0, 7).reduce((s, t) => s + t.count, 0);
    const totalRisksLast = riskTrend.slice(0, 7).reduce((s, t) => s + t.count, 0);
    const anomalies: string[] = [];
    if (approvalAvgHours > 0 && approvalAvgHours > approvalPreviousAvgHours * 1.2) {
      anomalies.push(`审批平均耗时上升：${approvalPreviousAvgHours}h → ${approvalAvgHours}h`);
    }
    if (totalRisksLast > 0 && riskTrend.slice(4, 7).reduce((s, t) => s + t.count, 0) > riskTrend.slice(0, 3).reduce((s, t) => s + t.count, 0)) {
      anomalies.push('近 3 天风险新增高于前 3 天，请关注风险上升趋势');
    }
    const pendingApprovals = approvals.filter((a) => a.status === 'running').length;
    if (pendingApprovals > 0) anomalies.push(`当前 ${pendingApprovals} 项审批在途`);

    callback({
      ret: {
        code: 0, message: 'ok',
        data: {
          eventTrend, riskTrend, automationTrend, approvalTrend,
          approvalAvgHours, approvalPreviousAvgHours,
          totals: { events: totalEventsLast, risks: totalRisksLast, pendingApprovals },
          anomalies,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-trend-stats error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};
export { myHandler };
