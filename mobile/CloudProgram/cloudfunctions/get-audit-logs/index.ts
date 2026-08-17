import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { AuditLog } from './AuditLog';
import { UserOrganization } from './UserOrganization';

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
const PAGE_SIZE = 100;

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-audit-logs called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const entityType = String(params?.entityType || '');
    const action = String(params?.action || '');
    const entityId = String(params?.entityId || '');
    const actorId = String(params?.actorId || '');
    const page = Math.max(0, Number(params?.page) || 0);
    const pageSize = Math.min(PAGE_SIZE, Math.max(1, Number(params?.pageSize) || 30));

    const col: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    let query = col.query().equalTo('orgId', orgId);
    if (entityType) query = query.equalTo('entityType', entityType);
    if (action) query = query.equalTo('action', action);
    if (entityId) query = query.equalTo('entityId', entityId);
    if (actorId) query = query.equalTo('actorId', actorId);
    const rows = await query.orderByDesc('createdAt').limit(pageSize, page * pageSize).get();
    const total = await query.orderByDesc('createdAt').countQuery('id');

    const logs = rows.map((l) => ({
      id: l.id,
      orgId: l.orgId,
      code: l.code,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      entityName: l.entityName,
      actorId: l.actorId,
      actorName: l.actorName,
      before: l.before,
      after: l.after,
      changeReason: l.changeReason,
      correlationId: l.correlationId,
      status: l.status,
      version: l.version,
      sourceType: l.sourceType,
      sourceId: l.sourceId,
      createdAt: l.createdAt ? l.createdAt.toISOString() : '',
      createdBy: l.createdBy,
      updatedAt: l.updatedAt ? l.updatedAt.toISOString() : '',
      updatedBy: l.updatedBy,
    }));

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          logs,
          total,
          hasMore: page * pageSize + rows.length < total,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-audit-logs error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
