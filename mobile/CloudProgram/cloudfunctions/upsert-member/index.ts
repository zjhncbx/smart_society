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
  ev.level = eventType === 'deleted' || eventType === 'rejected' ? 'warning' : 'info';
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
  logger.info('upsert-member called');

  try {
    const record = parseParams(event);
    if (!record || !record.id) {
      callback({ ret: { code: -1, message: '缺少 id 字段' } });
      return;
    }
    if (!record.orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 字段' } });
      return;
    }
    const userId = String(record.userId || '');
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${record.orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    const col: CloudDBCollection<Member> = db.collection(Member);
    const existing = await col.query().equalTo('id', record.id).get();
    const obj = Member.parseFrom(record);
    obj.updatedAt = new Date();
    await col.upsert([obj]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const actorId = String(record.actorId || 'system');
    const actorName = String(record.actorName || '系统');
    if (existing.length === 0) {
      await recordEvent(
        eventCol, record.orgId, 'created', 'member', obj.id, obj.name,
        actorId, actorName,
        { roleId: obj.roleId, roleLabel: obj.roleLabel, source: String(record.syncStatus || 'manual') },
      );
    } else {
      await recordEvent(
        eventCol, record.orgId, 'updated', 'member', obj.id, obj.name,
        actorId, actorName,
        { roleId: obj.roleId, roleLabel: obj.roleLabel, source: String(record.syncStatus || 'manual') },
      );
    }

    const auditCol: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    await recordAudit(
      auditCol, record.orgId, existing.length === 0 ? 'create' : 'update',
      'member', obj.id, obj.name, userId, String(record.actorName || '成员'),
      existing.length > 0 ? existing[0] : null, obj,
    );

    logger.info(`upsert-member done: id=${record.id}, event=${existing.length === 0 ? 'created' : 'updated'}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`upsert-member error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
