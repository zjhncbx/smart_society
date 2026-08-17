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
  logger.info('act-term called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string; const userId = params?.userId as string;
    const userName = String(params?.userName || '成员'); const id = params?.id as string;
    const action = String(params?.action || 'prepare');
    if (!orgId || !userId || !id) { callback({ ret: { code: -1, message: '缺少 orgId/userId/id 参数' } }); return; }
    if (!['prepare', 'activate', 'archive'].includes(action)) { callback({ ret: { code: -1, message: 'action 不合法' } }); return; }
    const key = String(params?.idempotencyKey || '');
    if (!key) { callback({ ret: { code: -1, message: '缺少 idempotencyKey：任期处理必须幂等' } }); return; }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uo = db.collection(UserOrganization);
    if ((await uo.query().equalTo('id', `${orgId}_${userId}`).get()).length === 0) { callback({ ret: { code: -1, message: '您不是该组织成员' } }); return; }
    const idem = db.collection(IdempotencyRecord);
    const cached = await idem.query().equalTo('id', key).get();
    if (cached.length > 0) { let r: any = {}; try { r = JSON.parse(cached[0].result || '{}'); } catch { r = {}; } callback({ ret: { code: 0, message: 'ok（幂等返回）', data: r } }); return; }
    const col = db.collection(Term);
    const rows = await col.query().equalTo('id', id).get();
    if (rows.length === 0) { callback({ ret: { code: -1, message: '任期不存在' } }); return; }
    const t = rows[0];
    if (t.orgId !== orgId) { callback({ ret: { code: -1, message: '任期不属于该组织' } }); return; }
    const before = t.status;
    t.status = action === 'prepare' ? 'preparing' : action === 'activate' ? 'active' : 'archived';
    t.updatedAt = new Date(); t.updatedBy = userId; t.correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
    await col.upsert([t]);
    const now = new Date();
    const e = new BusinessEvent();
    e.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000); e.orgId = orgId;
    e.eventType = 'status_changed'; e.entityType = 'term';
    e.entityId = t.id; e.entityName = t.title; e.actorId = userId; e.actorName = userName; e.level = 'info';
    e.metadata = JSON.stringify({ action, before, after: t.status }); e.sourceType = 'manual'; e.sourceId = '';
    e.correlationId = t.correlationId; e.version = 1; e.isDeleted = false; e.occurredAt = now; e.createdAt = now; e.createdBy = userId;
    await db.collection(BusinessEvent).upsert([e]);
    const a = new AuditLog();
    a.id = 'al' + Date.now() + Math.floor(Math.random() * 100000); a.orgId = orgId; a.code = ''; a.action = action;
    a.entityType = 'term'; a.entityId = t.id; a.entityName = t.title; a.actorId = userId; a.actorName = userName;
    a.before = JSON.stringify({ status: before }); a.after = JSON.stringify({ status: t.status });
    a.changeReason = ''; a.correlationId = t.correlationId; a.status = 'success'; a.version = 1;
    a.sourceType = 'manual'; a.sourceId = ''; a.isDeleted = false; a.createdAt = now; a.createdBy = userId;
    a.updatedAt = now; a.updatedBy = userId;
    await db.collection(AuditLog).upsert([a]);
    const rec = new IdempotencyRecord();
    rec.id = key; rec.orgId = orgId; rec.action = action; rec.entityType = 'term'; rec.entityId = t.id;
    rec.result = JSON.stringify({ id: t.id, status: t.status }); rec.status = 'done'; rec.createdAt = now;
    rec.expiresAt = new Date(now.getTime() + 24 * 3600 * 1000); rec.createdBy = userId; rec.updatedAt = now;
    await idem.upsert([rec]);
    logger.info(`act-term done: id=${id}, action=${action}`);
    callback({ ret: { code: 0, message: 'ok', data: { id: t.id, status: t.status } } });
  } catch (err: any) {
    logger.error(`act-term error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};
export { myHandler };
