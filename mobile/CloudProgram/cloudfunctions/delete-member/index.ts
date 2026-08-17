import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Member } from './Member';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';
import { AuditLog } from './AuditLog';

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
  ev.level = 'warning';
  ev.metadata = JSON.stringify(metadata || {});
  ev.sourceType = 'manual';
  ev.sourceId = '';
  ev.version = 1;
  ev.isDeleted = false;
  ev.occurredAt = now;
  ev.createdAt = now;
  await col.upsert([ev]);
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('delete-member called');

  try {
    const params = parseParams(event);
    const id = params?.id;
    const orgId = params?.orgId;
    if (!id) {
      callback({ ret: { code: -1, message: '缺少 id 字段' } });
      return;
    }
    if (!orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 字段' } });
      return;
    }
    const userId = String(params?.userId || '');
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    const col: CloudDBCollection<Member> = db.collection(Member);
    const existing = await col.query().equalTo('id', id).get();
    const obj = new Member();
    obj.id = id;
    obj.orgId = orgId;
    await col.delete([obj]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    await recordEvent(
      eventCol, orgId, 'deleted', 'member', String(id),
      existing.length > 0 ? existing[0].name : '',
      String(params?.actorId || 'system'),
      String(params?.actorName || '系统'),
      {},
    );

    const auditCol: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    await recordAudit(
      auditCol, orgId, 'delete', 'member', String(id),
      existing.length > 0 ? existing[0].name : '',
      userId, String(params?.actorName || '成员'),
      existing.length > 0 ? existing[0] : null, null,
    );

    logger.info(`delete-member done: id=${id}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`delete-member error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
