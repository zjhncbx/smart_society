import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Resolution } from './Resolution';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';
import { AuditLog } from './AuditLog';
import { IdempotencyRecord } from './IdempotencyRecord';

function parseParams(event: any): any {
  let body: any = event && event.body !== undefined ? event.body : event;
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
  correlationId = '',
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
  ev.level = 'info';
  ev.metadata = JSON.stringify(metadata || {});
  ev.sourceType = 'manual';
  ev.sourceId = '';
  ev.correlationId = correlationId || '';
  ev.version = 1;
  ev.isDeleted = false;
  ev.occurredAt = now;
  ev.createdAt = now;
  await col.upsert([ev]);
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
  correlationId = '',
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
  log.correlationId = correlationId || '';
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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('save-resolution called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = String(params?.userName || '成员');
    const id = String(params?.id || '');
    const title = String(params?.title || '').trim();
    if (!orgId || !userId || !title) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/title 参数' } });
      return;
    }
    const idempotencyKey = String(params?.idempotencyKey || '');
    if (!idempotencyKey) {
      callback({ ret: { code: -1, message: '缺少 idempotencyKey：决议创建必须幂等' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const idemCol: CloudDBCollection<IdempotencyRecord> = db.collection(IdempotencyRecord);
    const cachedRows = await idemCol.query().equalTo('id', idempotencyKey).get();
    if (cachedRows.length > 0) {
      let cached: any = {};
      try { cached = JSON.parse(cachedRows[0].result || '{}'); } catch { cached = {}; }
      callback({ ret: { code: 0, message: 'ok（幂等返回）', data: cached } });
      return;
    }

    const col: CloudDBCollection<Resolution> = db.collection(Resolution);
    const now = new Date();
    const correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
    const existing = id ? (await col.query().equalTo('id', id).get()) : [];
    const resolution = existing.length > 0 ? existing[0] : new Resolution();
    resolution.id = existing.length > 0 ? id : 'res' + Date.now();
    resolution.orgId = orgId;
    resolution.code = resolution.code || `RES-${now.getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    resolution.title = title;
    resolution.content = String(params?.content || '');
    resolution.responsibleMemberId = String(params?.responsibleMemberId || '');
    resolution.responsibleName = String(params?.responsibleName || '');
    resolution.deadline = params?.deadline ? new Date(String(params.deadline)) : null;
    resolution.meetingId = String(params?.meetingId || '');
    resolution.projectId = String(params?.projectId || '');
    resolution.correlationId = correlationId;
    resolution.version = (resolution.version || 1) + (existing.length > 0 ? 1 : 0);
    resolution.sourceType = 'manual';
    resolution.sourceId = '';
    resolution.isDeleted = false;
    resolution.createdAt = resolution.createdAt || now;
    resolution.createdBy = resolution.createdBy || userId;
    resolution.updatedAt = now;
    resolution.updatedBy = userId;
    await col.upsert([resolution]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    await recordEvent(
      eventCol, orgId, existing.length > 0 ? 'updated' : 'created', 'resolution',
      resolution.id, resolution.title, userId, userName,
      { status: resolution.status, responsibleName: resolution.responsibleName },
      correlationId,
    );
    const auditCol: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    await recordAudit(
      auditCol, orgId, existing.length > 0 ? 'update' : 'create', 'resolution',
      resolution.id, resolution.title, userId, userName,
      existing.length > 0 ? existing[0] : null, resolution, '', correlationId,
    );
    await storeIdempotent(
      idemCol, orgId, idempotencyKey, existing.length > 0 ? 'update' : 'create',
      'resolution', resolution.id, { id: resolution.id, code: resolution.code, status: resolution.status },
      userId,
    );

    logger.info(`save-resolution done: id=${resolution.id}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { id: resolution.id, code: resolution.code, status: resolution.status },
      },
    });
  } catch (err: any) {
    logger.error(`save-resolution error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
