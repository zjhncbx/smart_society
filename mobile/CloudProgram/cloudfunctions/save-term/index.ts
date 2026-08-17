import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Term } from './Term';
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
  logger.info('save-term called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string; const userId = params?.userId as string;
    const userName = String(params?.userName || '成员'); const id = String(params?.id || '');
    const title = String(params?.title || '').trim();
    if (!orgId || !userId || !title) { callback({ ret: { code: -1, message: '缺少 orgId/userId/title 参数' } }); return; }
    const key = String(params?.idempotencyKey || '');
    if (!key) { callback({ ret: { code: -1, message: '缺少 idempotencyKey：任期保存必须幂等' } }); return; }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uo = db.collection(UserOrganization);
    if ((await uo.query().equalTo('id', `${orgId}_${userId}`).get()).length === 0) { callback({ ret: { code: -1, message: '您不是该组织成员' } }); return; }
    const idem = db.collection(IdempotencyRecord);
    const cached = await idem.query().equalTo('id', key).get();
    if (cached.length > 0) { let r: any = {}; try { r = JSON.parse(cached[0].result || '{}'); } catch { r = {}; } callback({ ret: { code: 0, message: 'ok（幂等返回）', data: r } }); return; }
    const col = db.collection(Term);
    const existing = id ? (await col.query().equalTo('id', id).get()) : [];
    const now = new Date(); const correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
    const t = existing.length > 0 ? existing[0] : new Term();
    t.id = existing.length > 0 ? id : 'term' + Date.now(); t.orgId = orgId;
    t.code = t.code || `TERM-${now.getFullYear()}-${String(now.getTime()).slice(-4)}`;
    t.title = title; t.governanceBody = String(params?.governanceBody || '');
    t.startDate = params?.startDate ? new Date(String(params.startDate)) : null;
    t.endDate = params?.endDate ? new Date(String(params.endDate)) : null;
    t.correlationId = correlationId; t.version = (t.version || 1) + (existing.length > 0 ? 1 : 0);
    t.sourceType = 'manual'; t.sourceId = ''; t.isDeleted = false;
    t.createdAt = t.createdAt || now; t.createdBy = t.createdBy || userId; t.updatedAt = now; t.updatedBy = userId;
    await col.upsert([t]);
    const e = new BusinessEvent();
    e.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000); e.orgId = orgId;
    e.eventType = existing.length > 0 ? 'updated' : 'created'; e.entityType = 'term';
    e.entityId = t.id; e.entityName = t.title; e.actorId = userId; e.actorName = userName; e.level = 'info';
    e.metadata = JSON.stringify({ governanceBody: t.governanceBody, status: t.status }); e.sourceType = 'manual'; e.sourceId = '';
    e.correlationId = correlationId; e.version = 1; e.isDeleted = false; e.occurredAt = now; e.createdAt = now; e.createdBy = userId;
    await db.collection(BusinessEvent).upsert([e]);
    const a = new AuditLog();
    a.id = 'al' + Date.now() + Math.floor(Math.random() * 100000); a.orgId = orgId; a.code = ''; a.action = existing.length > 0 ? 'update' : 'create';
    a.entityType = 'term'; a.entityId = t.id; a.entityName = t.title; a.actorId = userId; a.actorName = userName;
    a.before = existing.length > 0 ? JSON.stringify(existing[0]) : 'null'; a.after = JSON.stringify(t);
    a.changeReason = ''; a.correlationId = correlationId; a.status = 'success'; a.version = 1;
    a.sourceType = 'manual'; a.sourceId = ''; a.isDeleted = false; a.createdAt = now; a.createdBy = userId;
    a.updatedAt = now; a.updatedBy = userId;
    await db.collection(AuditLog).upsert([a]);
    const rec = new IdempotencyRecord();
    rec.id = key; rec.orgId = orgId; rec.action = existing.length > 0 ? 'update' : 'create'; rec.entityType = 'term';
    rec.entityId = t.id; rec.result = JSON.stringify({ id: t.id, code: t.code, status: t.status });
    rec.status = 'done'; rec.createdAt = now; rec.expiresAt = new Date(now.getTime() + 24 * 3600 * 1000);
    rec.createdBy = userId; rec.updatedAt = now;
    await idem.upsert([rec]);
    logger.info(`save-term done: id=${t.id}`);
    callback({ ret: { code: 0, message: 'ok', data: { id: t.id, code: t.code, status: t.status } } });
  } catch (err: any) {
    logger.error(`save-term error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};
export { myHandler };
