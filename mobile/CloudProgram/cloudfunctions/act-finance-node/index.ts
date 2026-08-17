import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { ApprovalFlow } from './ApprovalFlow';
import { ApprovalInstance } from './ApprovalInstance';
import { Notice } from './Notice';
import { Member } from './Member';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';
import { AuditLog } from './AuditLog';

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
  logger.info('act-finance-node called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = (params?.userName as string) || '成员';
    const instanceId = params?.instanceId as string;
    const action = params?.action as string;
    const comment = String(params?.comment || '');
    if (!orgId || !userId || !instanceId || !['approve', 'reject', 'done'].includes(action)) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/instanceId/action 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    const myMemberId = mine[0].memberId || '';

    const instanceCol: CloudDBCollection<ApprovalInstance> = db.collection(ApprovalInstance);
    const rows = await instanceCol.query().equalTo('id', instanceId).get();
    if (rows.length === 0) {
      callback({ ret: { code: -1, message: '审批实例不存在' } });
      return;
    }
    const instance = rows[0];
    if (instance.orgId !== orgId) {
      callback({ ret: { code: -1, message: '审批实例不属于该组织' } });
      return;
    }
    if (instance.status !== 'running') {
      callback({ ret: { code: -1, message: '该流程已结束，无法操作' } });
      return;
    }

    let snapshot: any = {};
    try {
      snapshot = JSON.parse(instance.nodeSnapshot || '{}');
    } catch {
      snapshot = {};
    }
    const actorMemberIds: string[] = Array.isArray(snapshot.actorMemberIds) ? snapshot.actorMemberIds : [];
    const actorUserIds: string[] = Array.isArray(snapshot.actorUserIds) ? snapshot.actorUserIds : [];
    const canAct = (myMemberId && actorMemberIds.includes(myMemberId)) || actorUserIds.includes(userId);
    if (!canAct) {
      callback({ ret: { code: -1, message: '您不是当前节点的处理人' } });
      return;
    }

    const history = parseHistory(instance.history);
    history.push({
      nodeId: snapshot.nodeId || '',
      nodeName: snapshot.nodeName || (action === 'done' ? '办理' : '审批'),
      nodeType: snapshot.nodeType || (action === 'done' ? 'handle' : 'approve'),
      actorId: userId,
      actorName: userName,
      action,
      comment,
      time: new Date(),
    });
    instance.history = JSON.stringify(history);
    instance.updatedAt = new Date();

    const recordCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    if (action === 'reject') {
      instance.status = 'rejected';
      instance.nodeSnapshot = '{}';
      await instanceCol.upsert([instance]);
      if (instance.bizId) {
        const recs = await recordCol.query().equalTo('id', instance.bizId).get();
        if (recs.length > 0) {
          recs[0].status = 'rejected';
          recs[0].updatedAt = new Date();
          await recordCol.upsert([recs[0]]);
        }
      }
      const noticeCol: CloudDBCollection<Notice> = db.collection(Notice);
      await createNotice(
        noticeCol,
        orgId,
        `【财务】${instance.title}`,
        `流程「${instance.flowName}」已被驳回：${userName}（${comment || '未填写意见'}）`,
        true,
      );
      const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
      await recordEvent(
        eventCol, orgId, 'rejected', 'approval', instance.id, instance.title,
        userId, userName, 'warning',
        { action, comment, bizId: instance.bizId },
      );
      const auditCol: CloudDBCollection<AuditLog> = db.collection(AuditLog);
      await recordAudit(
        auditCol, orgId, 'reject', 'approval', instance.id, instance.title,
        userId, userName, { status: 'running' }, { status: 'rejected', comment },
        comment,
      );
      callback({ ret: { code: 0, message: 'ok', data: { status: 'rejected' } } });
      return;
    }

    const flowCol: CloudDBCollection<ApprovalFlow> = db.collection(ApprovalFlow);
    const flowRows = await flowCol.query().equalTo('id', instance.flowId).get();
    if (flowRows.length === 0) {
      callback({ ret: { code: -1, message: '流程定义不存在' } });
      return;
    }
    const flowNodes = parseNodes(flowRows[0].nodes);
    instance.currentIndex = Math.min(instance.currentIndex + 1, flowNodes.length);
    const memberCol: CloudDBCollection<Member> = db.collection(Member);
    const noticeCol: CloudDBCollection<Notice> = db.collection(Notice);
    const finished = await advanceInstance(
      instance, flowNodes, memberCol, instanceCol, noticeCol, orgId,
    );

    if (instance.bizId) {
      const recs = await recordCol.query().equalTo('id', instance.bizId).get();
      if (recs.length > 0) {
        recs[0].status = finished ? 'approved' : 'approving';
        recs[0].updatedAt = new Date();
        await recordCol.upsert([recs[0]]);
      }
    }

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const eventType = action === 'done' ? 'completed' : 'approved';
    await recordEvent(
      eventCol, orgId, eventType, 'approval', instance.id, instance.title,
      userId, userName, finished ? 'info' : 'info',
      {
        action,
        comment,
        nodeName: snapshot.nodeName || '',
        final: finished,
        status: finished ? 'approved' : 'approving',
        bizId: instance.bizId,
      },
    );

    const auditCol: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    await recordAudit(
      auditCol, orgId, action === 'done' ? 'complete' : 'approve',
      'approval', instance.id, instance.title,
      userId, userName,
      { status: 'running' },
      { status: finished ? 'approved' : 'approving', comment },
      comment,
    );

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { status: finished ? 'approved' : 'approving' },
      },
    });
  } catch (err: any) {
    logger.error(`act-finance-node error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
