import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { ComplianceItem } from './ComplianceItem';
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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('save-compliance-item called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string; const userId = params?.userId as string;
    const userName = String(params?.userName || '成员'); const id = String(params?.id || '');
    const name = String(params?.name || '').trim();
    if (!orgId || !userId || !name) { callback({ ret: { code: -1, message: '缺少 orgId/userId/name 参数' } }); return; }
    const key = String(params?.idempotencyKey || '');
    if (!key) { callback({ ret: { code: -1, message: '缺少 idempotencyKey：合规事项保存必须幂等' } }); return; }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uo = db.collection(UserOrganization);
    if ((await uo.query().equalTo('id', `${orgId}_${userId}`).get()).length === 0) { callback({ ret: { code: -1, message: '您不是该组织成员' } }); return; }
    const idem = db.collection(IdempotencyRecord);
    const cached = await idem.query().equalTo('id', key).get();
    if (cached.length > 0) { let r: any = {}; try { r = JSON.parse(cached[0].result || '{}'); } catch { r = {}; } callback({ ret: { code: 0, message: 'ok（幂等返回）', data: r } }); return; }
    const col = db.collection(ComplianceItem);
    const existing = id ? (await col.query().equalTo('id', id).get()) : [];
    const now = new Date(); const correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
    const c = existing.length > 0 ? existing[0] : new ComplianceItem();
    c.id = existing.length > 0 ? id : 'cmp' + Date.now(); c.orgId = orgId;
    c.code = c.code || `CMP-${now.getFullYear()}-${String(now.getTime()).slice(-4)}`;
    c.name = name; c.itemType = String(params?.itemType || 'other');
    c.deadline = params?.deadline ? new Date(String(params.deadline)) : null;
    c.responsibleMemberId = String(params?.responsibleMemberId || ''); c.responsibleName = String(params?.responsibleName || '');
    c.correlationId = correlationId; c.version = (c.version || 1) + (existing.length > 0 ? 1 : 0);
    c.sourceType = 'manual'; c.sourceId = ''; c.isDeleted = false;
    c.createdAt = c.createdAt || now; c.createdBy = c.createdBy || userId; c.updatedAt = now; c.updatedBy = userId;
    await col.upsert([c]);
    const e = new BusinessEvent();
    e.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000); e.orgId = orgId;
    e.eventType = existing.length > 0 ? 'updated' : 'created'; e.entityType = 'compliance';
    e.entityId = c.id; e.entityName = c.name; e.actorId = userId; e.actorName = userName; e.level = 'info';
    e.metadata = JSON.stringify({ itemType: c.itemType, status: c.status }); e.sourceType = 'manual'; e.sourceId = '';
    e.correlationId = correlationId; e.version = 1; e.isDeleted = false; e.occurredAt = now; e.createdAt = now; e.createdBy = userId;
    await db.collection(BusinessEvent).upsert([e]);
    const a = new AuditLog();
    a.id = 'al' + Date.now() + Math.floor(Math.random() * 100000); a.orgId = orgId; a.code = ''; a.action = existing.length > 0 ? 'update' : 'create';
    a.entityType = 'compliance'; a.entityId = c.id; a.entityName = c.name; a.actorId = userId; a.actorName = userName;
    a.before = existing.length > 0 ? JSON.stringify(existing[0]) : 'null'; a.after = JSON.stringify(c);
    a.changeReason = ''; a.correlationId = correlationId; a.status = 'success'; a.version = 1;
    a.sourceType = 'manual'; a.sourceId = ''; a.isDeleted = false; a.createdAt = now; a.createdBy = userId;
    a.updatedAt = now; a.updatedBy = userId;
    await db.collection(AuditLog).upsert([a]);
    const rec = new IdempotencyRecord();
    rec.id = key; rec.orgId = orgId; rec.action = existing.length > 0 ? 'update' : 'create'; rec.entityType = 'compliance';
    rec.entityId = c.id; rec.result = JSON.stringify({ id: c.id, code: c.code, status: c.status });
    rec.status = 'done'; rec.createdAt = now; rec.expiresAt = new Date(now.getTime() + 24 * 3600 * 1000);
    rec.createdBy = userId; rec.updatedAt = now;
    await idem.upsert([rec]);
    logger.info(`save-compliance-item done: id=${c.id}`);
    callback({ ret: { code: 0, message: 'ok', data: { id: c.id, code: c.code, status: c.status } } });
  } catch (err: any) {
    logger.error(`save-compliance-item error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};
export { myHandler };
