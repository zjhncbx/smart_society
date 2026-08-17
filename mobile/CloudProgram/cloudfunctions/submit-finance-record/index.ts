import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { ApprovalFlow } from './ApprovalFlow';
import { ApprovalInstance } from './ApprovalInstance';
import { Notice } from './Notice';
import { Member } from './Member';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';
import { AuditLog } from './AuditLog';
import { IdempotencyRecord } from './IdempotencyRecord';

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

async function readIdempotent(
  col: CloudDBCollection<IdempotencyRecord>,
  key: string,
): Promise<any> {
  if (!key) return null;
  const rows = await col.query().equalTo('id', key).get();
  if (rows.length === 0) return null;
  try {
    return JSON.parse(rows[0].result || '{}');
  } catch {
    return {};
  }
}

async function storeIdempotent(
  col: CloudDBCollection<IdempotencyRecord>,
  orgId: string,
  key: string,
  action: string,
  entityType: string,
  entityId: string,
  result: any,
  actorId: string,
): Promise<void> {
  if (!key) return;
  const now = new Date();
  const rec = new IdempotencyRecord();
  rec.id = key;
  rec.orgId = orgId;
  rec.action = action;
  rec.entityType = entityType;
  rec.entityId = entityId || '';
  rec.result = JSON.stringify(result || {});
  rec.createdAt = now;
  rec.expiresAt = new Date(now.getTime() + 24 * 3600 * 1000);
  rec.createdBy = actorId || '';
  await col.upsert([rec]);
}

async function recordAudit(
  col: CloudDBCollection<AuditLog>,
  orgId: string,
  action: string,
  entityType: string,
  entityId: string,
  entityName: string,
  actorId: string,
  actorName: string,
  before: any,
  after: any,
  changeReason = '',
): Promise<void> {
  const now = new Date();
  const log = new AuditLog();
  log.id = 'al' + Date.now() + Math.floor(Math.random() * 100000);
  log.orgId = orgId;
  log.code = '';
  log.action = action;
  log.entityType = entityType;
  log.entityId = entityId;
  log.entityName = entityName || '';
  log.actorId = actorId || 'system';
  log.actorName = actorName || '系统';
  log.before = before !== undefined && before !== null ? JSON.stringify(before) : 'null';
  log.after = after !== undefined && after !== null ? JSON.stringify(after) : 'null';
  log.changeReason = changeReason;
  log.correlationId = '';
  log.status = 'success';
  log.version = 1;
  log.sourceType = 'manual';
  log.sourceId = '';
  log.isDeleted = false;
  log.createdAt = now;
  log.createdBy = actorId || '';
  log.updatedAt = now;
  log.updatedBy = actorId || '';
  await col.upsert([log]);
}

async function recordEvent(
  col: CloudDBCollection<BusinessEvent>,
  orgId: string,
  eventType: string,
  entityType: string,
  entityId: string,
  entityName: string,
  actorId: string,
  actorName: string,
  level: string,
  metadata: any,
): Promise<void> {
  const now = new Date();
  const ev = new BusinessEvent();
  ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
  ev.orgId = orgId;
  ev.eventType = eventType;
  ev.entityType = entityType;
  ev.entityId = entityId;
  ev.entityName = entityName || '';
  ev.actorId = actorId || 'system';
  ev.actorName = actorName || '系统';
  ev.level = level || 'info';
  ev.metadata = JSON.stringify(metadata || {});
  ev.sourceType = 'manual';
  ev.sourceId = '';
  ev.version = 1;
  ev.isDeleted = false;
  ev.occurredAt = now;
  ev.createdAt = now;
  await col.upsert([ev]);
}

interface FlowNode {
  id: string;
  type: string;
  name: string;
  roleIds: string[];
  userIds: string[];
}

async function queryAllByOrg<T>(col: CloudDBCollection<T>, orgId: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

function parseNodes(raw: string): FlowNode[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function parseHistory(raw: string): any[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function membersByRole(col: CloudDBCollection<Member>, orgId: string, roleId: string): Promise<string[]> {
  const all = await queryAllByOrg(col, orgId);
  return all.filter((m) => m.roleId === roleId).map((m) => m.id);
}

async function resolveActors(
  node: FlowNode,
  memberCol: CloudDBCollection<Member>,
  orgId: string,
): Promise<{ actorMemberIds: string[]; actorUserIds: string[] }> {
  const memberIds = new Set<string>();
  for (const roleId of node.roleIds || []) {
    const ids = await membersByRole(memberCol, orgId, roleId);
    for (const id of ids) memberIds.add(id);
  }
  return {
    actorMemberIds: Array.from(memberIds),
    actorUserIds: Array.from(node.userIds || []),
  };
}

async function createNotice(
  noticeCol: CloudDBCollection<Notice>,
  orgId: string,
  title: string,
  content: string,
  important = false,
): Promise<void> {
  const n = new Notice();
  n.id = 'fn' + Date.now() + Math.floor(Math.random() * 1000);
  n.orgId = orgId;
  n.title = title;
  n.content = content;
  n.publisher = '财务流程';
  n.publishTime = new Date();
  n.isRead = false;
  n.isImportant = important;
  n.updatedAt = new Date();
  await noticeCol.upsert([n]);
}

/** 推进流程：处理抄送节点、跳过无处理人的节点，停留在首个审批/办理节点；全部结束返回 true */
async function advanceInstance(
  instance: ApprovalInstance,
  flowNodes: FlowNode[],
  memberCol: CloudDBCollection<Member>,
  instanceCol: CloudDBCollection<ApprovalInstance>,
  noticeCol: CloudDBCollection<Notice>,
  orgId: string,
): Promise<boolean> {
  let idx = instance.currentIndex;
  while (idx < flowNodes.length) {
    const node = flowNodes[idx];
    if (node.type === 'cc') {
      const history = parseHistory(instance.history);
      history.push({
        nodeId: node.id,
        nodeName: node.name || '抄送',
        nodeType: 'cc',
        actorId: instance.createdBy,
        actorName: instance.createdByName || '发起人',
        action: 'cc',
        comment: '已抄送',
        time: new Date(),
      });
      instance.history = JSON.stringify(history);
      await createNotice(
        noticeCol,
        orgId,
        `【财务】${instance.title}`,
        `流程「${instance.flowName}」抄送：${node.name || '抄送'}。单据：${instance.title}`,
      );
      idx++;
      instance.currentIndex = idx;
      continue;
    }
    const actors = await resolveActors(node, memberCol, orgId);
    if (actors.actorMemberIds.length === 0 && actors.actorUserIds.length === 0) {
      const history = parseHistory(instance.history);
      history.push({
        nodeId: node.id,
        nodeName: node.name || (node.type === 'approve' ? '审批' : '办理'),
        nodeType: node.type,
        actorId: '',
        actorName: '系统',
        action: 'skip',
        comment: '无处理人，自动跳过',
        time: new Date(),
      });
      instance.history = JSON.stringify(history);
      idx++;
      instance.currentIndex = idx;
      continue;
    }
    instance.nodeSnapshot = JSON.stringify({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      actorMemberIds: actors.actorMemberIds,
      actorUserIds: actors.actorUserIds,
    });
    instance.currentIndex = idx;
    instance.status = 'running';
    await instanceCol.upsert([instance]);
    return false;
  }
  instance.status = 'approved';
  instance.nodeSnapshot = '{}';
  instance.currentIndex = flowNodes.length;
  await instanceCol.upsert([instance]);
  await createNotice(
    noticeCol,
    orgId,
    `【财务】${instance.title}`,
    `流程「${instance.flowName}」已全部完成，单据已生效。`,
    true,
  );
  return true;
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('submit-finance-record called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = (params?.userName as string) || '成员';
    const p = params?.record ?? params;
    if (!orgId || !userId || !p || !p.type || !p.summary) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/type/summary 参数' } });
      return;
    }
    if (!['income', 'expense', 'voucher'].includes(p.type)) {
      callback({ ret: { code: -1, message: '单据类型不合法' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const idempotencyKey = String(params?.idempotencyKey || '');
    const idemCol: CloudDBCollection<IdempotencyRecord> = db.collection(IdempotencyRecord);
    if (idempotencyKey) {
      const cached = await readIdempotent(idemCol, idempotencyKey);
      if (cached !== null) {
        callback({ ret: { code: 0, message: 'ok（幂等返回）', data: cached } });
        return;
      }
    }

    const now = new Date();
    const record = new FinanceRecord();
    record.id = 'f' + Date.now();
    record.orgId = orgId;
    record.projectId = String(p.projectId || '');
    record.type = p.type;
    record.amount = Math.max(0, Number(p.amount) || 0);
    record.category = String(p.category || '');
    record.categoryLabel = String(p.categoryLabel || '');
    record.date = p.date ? new Date(p.date) : now;
    record.summary = String(p.summary).trim();
    record.counterparty = String(p.counterparty || '');
    record.voucherNo = String(p.voucherNo || '');
    record.entries = Array.isArray(p.entries) ? JSON.stringify(p.entries) : String(p.entries || '[]');
    record.restricted = p.restricted === true;
    record.status = 'approving';
    record.createdBy = userId;
    record.createdByName = userName;
    record.createdAt = now;
    record.updatedAt = now;
    record.period = String(record.date.getFullYear());

    // 已结账年度锁定：不允许再新增该年度凭证
    const recordCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const existingRecords = await queryAllByOrg(recordCol, orgId);
    if (existingRecords.some((r) => r.type === 'closing' && r.period === record.period)) {
      callback({
        ret: {
          code: -1,
          message: `${record.period} 年度已结账，不能新增该年度凭证（如需修改请先反结账）`,
        },
      });
      return;
    }

    const flowCol: CloudDBCollection<ApprovalFlow> = db.collection(ApprovalFlow);
    let flow: ApprovalFlow | null = null;
    if (params.flowId) {
      const rows = await flowCol.query().equalTo('id', String(params.flowId)).get();
      if (rows.length > 0 && rows[0].orgId === orgId) flow = rows[0];
    } else {
      const flows = (await queryAllByOrg(flowCol, orgId))
        .filter((f) => f.enabled && f.bizType === 'finance');
      flow = flows.find((f) => f.isDefault) || flows[0] || null;
    }

    const instanceCol: CloudDBCollection<ApprovalInstance> = db.collection(ApprovalInstance);
    let instance: ApprovalInstance | null = null;
    if (flow) {
      instance = new ApprovalInstance();
      instance.id = 'ai' + Date.now();
      instance.orgId = orgId;
      instance.flowId = flow.id;
      instance.flowName = flow.name;
      instance.bizType = 'finance';
      instance.bizId = record.id;
      instance.title = `${record.summary}（${record.categoryLabel || record.type}）`;
      instance.status = 'running';
      instance.currentIndex = 0;
      instance.nodeSnapshot = '{}';
      instance.history = '[]';
      instance.createdBy = userId;
      instance.createdByName = userName;
      instance.createdAt = now;
      instance.updatedAt = now;
      const flowNodes = parseNodes(flow.nodes);
      if (flowNodes.length === 0) {
        instance.status = 'approved';
        instance.currentIndex = 0;
        await instanceCol.upsert([instance]);
        record.status = 'approved';
        record.flowId = flow.id;
        record.instanceId = instance.id;
      } else {
        const memberCol: CloudDBCollection<Member> = db.collection(Member);
        const noticeCol: CloudDBCollection<Notice> = db.collection(Notice);
        const finished = await advanceInstance(
          instance, flowNodes, memberCol, instanceCol, noticeCol, orgId,
        );
        record.status = finished ? 'approved' : 'approving';
        record.flowId = flow.id;
        record.instanceId = instance.id;
      }
    } else {
      record.status = 'approved';
    }

    await recordCol.upsert([record]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    await recordEvent(
      eventCol, orgId, 'submitted', 'finance', record.id, record.summary,
      userId, userName,
      record.status === 'approved' ? 'info' : 'info',
      {
        type: record.type,
        amount: record.amount,
        categoryLabel: record.categoryLabel,
        status: record.status,
        instanceId: record.instanceId,
        projectId: record.projectId,
      },
    );

    const auditCol: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    await recordAudit(
      auditCol, orgId, 'submit', 'finance', record.id, record.summary,
      userId, userName, null, record,
    );

    await storeIdempotent(
      idemCol, orgId, idempotencyKey, 'submit', 'finance', record.id,
      { recordId: record.id, instanceId: record.instanceId, status: record.status },
      userId,
    );

    logger.info(`submit-finance-record done: id=${record.id}, status=${record.status}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          recordId: record.id,
          instanceId: record.instanceId,
          status: record.status,
        },
      },
    });
  } catch (err: any) {
    logger.error(`submit-finance-record error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
