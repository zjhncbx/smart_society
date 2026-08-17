import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { License } from './License';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';
import { AuditLog } from './AuditLog';
import { IdempotencyRecord } from './IdempotencyRecord';

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

async function storeIdem(col: CloudDBCollection<IdempotencyRecord>, orgId: string, key: string, action: string, entityId: string, result: any, actorId: string): Promise<void> {
  if (!key) return;
  const now = new Date();
  const rec = new IdempotencyRecord();
  rec.id = key; rec.orgId = orgId; rec.action = action; rec.entityType = 'license'; rec.entityId = entityId || '';
  rec.result = JSON.stringify(result || {}); rec.status = 'done'; rec.createdAt = now;
  rec.expiresAt = new Date(now.getTime() + 24 * 3600 * 1000); rec.createdBy = actorId || ''; rec.updatedAt = now;
  await col.upsert([rec]);
}
async function evt(col: CloudDBCollection<BusinessEvent>, orgId: string, type: string, entityId: string, name: string, actorId: string, actorName: string, correlationId: string): Promise<void> {
  const now = new Date();
  const e = new BusinessEvent();
  e.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000); e.orgId = orgId; e.eventType = type;
  e.entityType = 'license'; e.entityId = entityId; e.entityName = name; e.actorId = actorId || 'system';
  e.actorName = actorName || '系统'; e.level = 'info'; e.metadata = '{}'; e.sourceType = 'manual';
  e.sourceId = ''; e.correlationId = correlationId; e.version = 1; e.isDeleted = false;
  e.occurredAt = now; e.createdAt = now; e.createdBy = actorId || '';
  await col.upsert([e]);
}
async function audit(col: CloudDBCollection<AuditLog>, orgId: string, action: string, entityId: string, name: string, actorId: string, actorName: string, before: any, after: any, correlationId: string): Promise<void> {
  const now = new Date();
  const l = new AuditLog();
  l.id = 'al' + Date.now() + Math.floor(Math.random() * 100000); l.orgId = orgId; l.code = ''; l.action = action;
  l.entityType = 'license'; l.entityId = entityId; l.entityName = name; l.actorId = actorId || 'system';
  l.actorName = actorName || '系统'; l.before = before != null ? JSON.stringify(before) : 'null';
  l.after = after != null ? JSON.stringify(after) : 'null'; l.changeReason = ''; l.correlationId = correlationId;
  l.status = 'success'; l.version = 1; l.sourceType = 'manual'; l.sourceId = ''; l.isDeleted = false;
  l.createdAt = now; l.createdBy = actorId || ''; l.updatedAt = now; l.updatedBy = actorId || '';
  await col.upsert([l]);
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('save-license called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string; const userId = params?.userId as string;
    const userName = String(params?.userName || '成员'); const id = String(params?.id || '');
    const name = String(params?.name || '').trim();
    if (!orgId || !userId || !name) { callback({ ret: { code: -1, message: '缺少 orgId/userId/name 参数' } }); return; }
    const key = String(params?.idempotencyKey || '');
    if (!key) { callback({ ret: { code: -1, message: '缺少 idempotencyKey：证照保存必须幂等' } }); return; }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uo = db.collection(UserOrganization);
    if ((await uo.query().equalTo('id', `${orgId}_${userId}`).get()).length === 0) { callback({ ret: { code: -1, message: '您不是该组织成员' } }); return; }
    const idem = db.collection(IdempotencyRecord);
    const cached = await idem.query().equalTo('id', key).get();
    if (cached.length > 0) { let r: any = {}; try { r = JSON.parse(cached[0].result || '{}'); } catch { r = {}; } callback({ ret: { code: 0, message: 'ok（幂等返回）', data: r } }); return; }
    const col = db.collection(License);
    const existing = id ? (await col.query().equalTo('id', id).get()) : [];
    const now = new Date(); const correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
    const l = existing.length > 0 ? existing[0] : new License();
    l.id = existing.length > 0 ? id : 'lic' + Date.now(); l.orgId = orgId;
    l.code = l.code || `LIC-${now.getFullYear()}-${String(now.getTime()).slice(-4)}`;
    l.name = name; l.licenseNo = String(params?.licenseNo || ''); l.issuer = String(params?.issuer || '');
    l.issuedAt = params?.issuedAt ? new Date(String(params.issuedAt)) : null;
    l.expireAt = params?.expireAt ? new Date(String(params.expireAt)) : null;
    l.ownerId = String(params?.ownerId || ''); l.ownerName = String(params?.ownerName || '');
    l.correlationId = correlationId; l.version = (l.version || 1) + (existing.length > 0 ? 1 : 0);
    l.sourceType = 'manual'; l.sourceId = ''; l.isDeleted = false;
    l.createdAt = l.createdAt || now; l.createdBy = l.createdBy || userId; l.updatedAt = now; l.updatedBy = userId;
    await col.upsert([l]);
    await evt(db.collection(BusinessEvent), orgId, existing.length > 0 ? 'updated' : 'created', l.id, l.name, userId, userName, correlationId);
    await audit(db.collection(AuditLog), orgId, existing.length > 0 ? 'update' : 'create', l.id, l.name, userId, userName, existing.length > 0 ? existing[0] : null, l, correlationId);
    await storeIdem(idem, orgId, key, existing.length > 0 ? 'update' : 'create', l.id, { id: l.id, code: l.code, status: l.status }, userId);
    logger.info(`save-license done: id=${l.id}`);
    callback({ ret: { code: 0, message: 'ok', data: { id: l.id, code: l.code, status: l.status } } });
  } catch (err: any) {
    logger.error(`save-license error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};
export { myHandler };
