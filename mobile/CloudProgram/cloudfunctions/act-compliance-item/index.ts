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
  logger.info('act-compliance-item called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string; const userId = params?.userId as string;
    const userName = String(params?.userName || '成员'); const id = params?.id as string;
    const action = String(params?.action || 'start');
    if (!orgId || !userId || !id) { callback({ ret: { code: -1, message: '缺少 orgId/userId/id 参数' } }); return; }
    if (!['start', 'done', 'reopen'].includes(action)) { callback({ ret: { code: -1, message: 'action 不合法' } }); return; }
    const key = String(params?.idempotencyKey || '');
    if (!key) { callback({ ret: { code: -1, message: '缺少 idempotencyKey：合规事项处理必须幂等' } }); return; }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uo = db.collection(UserOrganization);
    if ((await uo.query().equalTo('id', `${orgId}_${userId}`).get()).length === 0) { callback({ ret: { code: -1, message: '您不是该组织成员' } }); return; }
    const idem = db.collection(IdempotencyRecord);
    const cached = await idem.query().equalTo('id', key).get();
    if (cached.length > 0) { let r: any = {}; try { r = JSON.parse(cached[0].result || '{}'); } catch { r = {}; } callback({ ret: { code: 0, message: 'ok（幂等返回）', data: r } }); return; }
    const col = db.collection(ComplianceItem);
    const rows = await col.query().equalTo('id', id).get();
    if (rows.length === 0) { callback({ ret: { code: -1, message: '合规事项不存在' } }); return; }
    const c = rows[0];
    if (c.orgId !== orgId) { callback({ ret: { code: -1, message: '合规事项不属于该组织' } }); return; }
    const before = c.status;
    c.status = action === 'start' ? 'executing' : action === 'done' ? 'done' : 'pending';
    c.updatedAt = new Date(); c.updatedBy = userId; c.correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
    await col.upsert([c]);
    const now = new Date();
    const e = new BusinessEvent();
    e.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000); e.orgId = orgId;
    e.eventType = action === 'done' ? 'completed' : 'status_changed'; e.entityType = 'compliance';
    e.entityId = c.id; e.entityName = c.name; e.actorId = userId; e.actorName = userName; e.level = 'info';
    e.metadata = JSON.stringify({ action, before, after: c.status }); e.sourceType = 'manual'; e.sourceId = '';
    e.correlationId = c.correlationId; e.version = 1; e.isDeleted = false; e.occurredAt = now; e.createdAt = now; e.createdBy = userId;
    await db.collection(BusinessEvent).upsert([e]);
    const a = new AuditLog();
    a.id = 'al' + Date.now() + Math.floor(Math.random() * 100000); a.orgId = orgId; a.code = ''; a.action = action;
    a.entityType = 'compliance'; a.entityId = c.id; a.entityName = c.name; a.actorId = userId; a.actorName = userName;
    a.before = JSON.stringify({ status: before }); a.after = JSON.stringify({ status: c.status });
    a.changeReason = ''; a.correlationId = c.correlationId; a.status = 'success'; a.version = 1;
    a.sourceType = 'manual'; a.sourceId = ''; a.isDeleted = false; a.createdAt = now; a.createdBy = userId;
    a.updatedAt = now; a.updatedBy = userId;
    await db.collection(AuditLog).upsert([a]);
    const rec = new IdempotencyRecord();
    rec.id = key; rec.orgId = orgId; rec.action = action; rec.entityType = 'compliance'; rec.entityId = c.id;
    rec.result = JSON.stringify({ id: c.id, status: c.status }); rec.status = 'done'; rec.createdAt = now;
    rec.expiresAt = new Date(now.getTime() + 24 * 3600 * 1000); rec.createdBy = userId; rec.updatedAt = now;
    await idem.upsert([rec]);
    logger.info(`act-compliance-item done: id=${id}, action=${action}`);
    callback({ ret: { code: 0, message: 'ok', data: { id: c.id, status: c.status } } });
  } catch (err: any) {
    logger.error(`act-compliance-item error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};
export { myHandler };
