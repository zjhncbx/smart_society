import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { WorkItem } from './WorkItem';
import { ApprovalInstance } from './ApprovalInstance';
import { AutoTask } from './AutoTask';
import { RiskAlert } from './RiskAlert';
import { DataQualityIssue } from './DataQualityIssue';
import { Member } from './Member';
import { Project } from './Project';
import { UserOrganization } from './UserOrganization';

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

function parseTasks(raw: string): any[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function sanitize(value: string): string {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function makeItem(
  orgId: string,
  type: string,
  originType: string,
  originId: string,
  title: string,
  description: string,
  ownerId: string,
  ownerName: string,
  priority: string,
  deadline: Date | null,
  slaDeadline: Date | null,
  escalationLevel: number,
  completionCondition: string,
  sourceRuleId: string,
  sourceRuleName: string,
  createdAt: Date,
  correlationId = '',
): WorkItem {
  const now = new Date();
  const item = new WorkItem();
  item.id = `wi_${orgId}_${type}_${sanitize(originId)}`;
  item.orgId = orgId;
  item.code = '';
  item.workItemType = type;
  item.originType = originType;
  item.originId = originId;
  item.originName = title;
  item.title = title;
  item.description = description;
  item.ownerId = ownerId || '';
  item.ownerName = ownerName || '';
  item.priority = priority || 'medium';
  item.status = 'open';
  item.deadline = deadline;
  item.slaDeadline = slaDeadline;
  item.escalationLevel = escalationLevel || 0;
  item.completionCondition = completionCondition;
  item.sourceRuleId = sourceRuleId || '';
  item.sourceRuleName = sourceRuleName || '';
  item.version = 1;
  item.sourceType = 'system';
  item.sourceId = 'refresh-work-items';
  item.correlationId = correlationId;
  item.isDeleted = false;
  item.createdAt = createdAt;
  item.createdBy = 'system';
  item.updatedAt = now;
  item.updatedBy = 'system';
  return item;
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('refresh-work-items called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const approvalCol: CloudDBCollection<ApprovalInstance> = db.collection(ApprovalInstance);
    const taskCol: CloudDBCollection<AutoTask> = db.collection(AutoTask);
    const riskCol: CloudDBCollection<RiskAlert> = db.collection(RiskAlert);
    const dqCol: CloudDBCollection<DataQualityIssue> = db.collection(DataQualityIssue);
    const memberCol: CloudDBCollection<Member> = db.collection(Member);
    const projectCol: CloudDBCollection<Project> = db.collection(Project);
    const itemCol: CloudDBCollection<WorkItem> = db.collection(WorkItem);

    const approvals = (await queryAllByOrg(approvalCol, orgId)).filter((a) => a.status === 'running');
    const autoTasks = (await queryAllByOrg(taskCol, orgId)).filter((t) => t.status === 'open');
    const risks = (await queryAllByOrg(riskCol, orgId)).filter((r) => r.status === 'open');
    const dqIssues = (await queryAllByOrg(dqCol, orgId)).filter((i) => i.status === 'open' && i.severity !== 'low');
    const members = await queryAllByOrg(memberCol, orgId);
    const projects = await queryAllByOrg(projectCol, orgId);

    const memberName = new Map<string, string>();
    for (const m of members) memberName.set(m.id, m.name);
    const now = new Date();

    const items: WorkItem[] = [];
    const hitKeys = new Set<string>();

    for (const a of approvals) {
      const key = `wi_${orgId}_approval_${sanitize(a.id)}`;
      hitKeys.add(key);
      items.push(makeItem(
        orgId, 'approval', 'approval', a.id, String(a.title || a.flowName || '审批'),
        `流程「${a.flowName || ''}」待处理，当前节点：${a.title || ''}`,
        '', '当前节点处理人', 'medium',
        new Date((a.createdAt ? a.createdAt.getTime() : now.getTime()) + 3 * DAY_MS),
        new Date((a.createdAt ? a.createdAt.getTime() : now.getTime()) + 3 * DAY_MS),
        0, '流程审批通过', 'WF-approval', '审批流程', a.createdAt || now,
      ));
    }

    for (const t of autoTasks) {
      const key = `wi_${orgId}_auto_task_${sanitize(t.id)}`;
      hitKeys.add(key);
      items.push(makeItem(
        orgId, 'auto_task', 'auto_task', t.id, t.title, t.description,
        t.assigneeId, t.assigneeName, t.priority,
        t.slaDeadline, t.slaDeadline, t.escalationLevel,
        '任务完成并通过来源规则校验', t.sourceRuleId, t.sourceRuleName,
        t.createdAt || now,
        t.correlationId,
      ));
    }

    for (const r of risks) {
      const key = `wi_${orgId}_risk_${sanitize(r.id)}`;
      hitKeys.add(key);
      items.push(makeItem(
        orgId, 'risk', 'risk', r.id, r.title, r.description,
        r.ownerId, r.ownerName, r.severity === 'high' ? 'high' : 'medium',
        r.deadline, r.deadline, 0,
        '风险处置完成并经规则校验', r.sourceRuleId, r.sourceRuleName,
        r.createdAt || now,
        r.correlationId,
      ));
    }

    for (const issue of dqIssues) {
      const key = `wi_${orgId}_data_quality_${sanitize(issue.id)}`;
      hitKeys.add(key);
      items.push(makeItem(
        orgId, 'data_quality', 'data_quality', issue.id,
        `修复数据问题：${issue.ruleName}`,
        `${issue.ruleName}：${issue.entityName || issue.description}`,
        issue.assignedTo, issue.assignedToName,
        issue.severity === 'high' ? 'high' : 'medium',
        null, new Date(now.getTime() + 7 * DAY_MS), 0,
        '问题修复并通过数据质量校验', issue.ruleId, issue.ruleName,
        issue.createdAt || now,
      ));
    }

    for (const p of projects) {
      for (const t of parseTasks(p.tasks)) {
        if (Number(t.status) === 2) continue;
        const assigneeId = String(t.assigneeId || '');
        const originId = `${p.id}:${t.id}`;
        const key = `wi_${orgId}_project_task_${sanitize(originId)}`;
        hitKeys.add(key);
        items.push(makeItem(
          orgId, 'project_task', 'project_task', originId,
          String(t.title || '任务'),
          `项目「${p.name}」任务待处理`,
          assigneeId, assigneeId ? memberName.get(assigneeId) || '' : '',
          String(t.priority || '') === '2' ? 'high' : String(t.priority || '') === '0' ? 'low' : 'medium',
          t.dueDate ? new Date(t.dueDate) : null,
          t.dueDate ? new Date(t.dueDate) : null,
          0, '任务完成', 'project', '项目任务',
          p.createdAt || now,
        ));
      }
    }

    if (items.length > 0) await itemCol.upsert(items);

    // 自动关闭：来源已消失的工作项
    const existing = await queryAllByOrg(itemCol, orgId);
    const toClose: WorkItem[] = [];
    for (const item of existing) {
      if (item.status !== 'open') continue;
      if (hitKeys.has(item.id)) continue;
      item.status = 'done';
      item.updatedAt = now;
      item.updatedBy = 'system';
      item.description = `${item.description}\n[自动完成] 来源业务已结束或消失`.trim();
      toClose.push(item);
    }
    if (toClose.length > 0) await itemCol.upsert(toClose);

    logger.info(`refresh-work-items done: orgId=${orgId}, upsert=${items.length}, autoClosed=${toClose.length}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { upserted: items.length, autoClosed: toClose.length, total: existing.length },
      },
    });
  } catch (err: any) {
    logger.error(`refresh-work-items error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
