import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { License } from './License';
import { UserOrganization } from './UserOrganization';

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
function toJson(l: License): any {
  return {
    id: l.id, orgId: l.orgId, code: l.code, name: l.name, licenseNo: l.licenseNo, issuer: l.issuer,
    issuedAt: l.issuedAt ? l.issuedAt.toISOString() : '', expireAt: l.expireAt ? l.expireAt.toISOString() : '',
    status: l.status, ownerId: l.ownerId, ownerName: l.ownerName, correlationId: l.correlationId,
    createdAt: l.createdAt ? l.createdAt.toISOString() : '', updatedAt: l.updatedAt ? l.updatedAt.toISOString() : '',
  };
}
let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-licenses called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string; const userId = params?.userId as string;
    if (!orgId || !userId) { callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } }); return; }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uo = db.collection(UserOrganization);
    if ((await uo.query().equalTo('id', `${orgId}_${userId}`).get()).length === 0) { callback({ ret: { code: -1, message: '您不是该组织成员' } }); return; }
    const status = String(params?.status || '');
    const page = Math.max(0, Number(params?.page) || 0); const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 30));
    const col = db.collection(License);
    let q = col.query().equalTo('orgId', orgId);
    if (status) q = q.equalTo('status', status);
    const rows = await q.orderByDesc('createdAt').limit(pageSize, page * pageSize).get();
    const total = await q.orderByDesc('createdAt').countQuery('id');
    callback({ ret: { code: 0, message: 'ok', data: { licenses: rows.map(toJson), total, hasMore: page * pageSize + rows.length < total } } });
  } catch (err: any) {
    logger.error(`get-licenses error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};
export { myHandler };
