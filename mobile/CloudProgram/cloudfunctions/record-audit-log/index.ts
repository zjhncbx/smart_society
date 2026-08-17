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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('record-audit-log called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const action = params?.action as string;
    const entityType = params?.entityType as string;
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
      return;
    }
    if (!action || !entityType) {
      callback({ ret: { code: -1, message: '缺少 action/entityType 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const now = new Date();
    const log = new AuditLog();
    log.id = 'al' + Date.now() + Math.floor(Math.random() * 100000);
    log.orgId = orgId;
    log.code = String(params?.code || '');
    log.action = action;
    log.entityType = entityType;
    log.entityId = String(params?.entityId || '');
    log.entityName = String(params?.entityName || '');
    log.actorId = userId;
    log.actorName = String(params?.actorName || '成员');
    log.before = params?.before !== undefined ? JSON.stringify(params.before) : 'null';
    log.after = params?.after !== undefined ? JSON.stringify(params.after) : 'null';
    log.changeReason = String(params?.changeReason || '');
    log.correlationId = String(params?.correlationId || '');
    log.status = String(params?.status || 'success');
    log.version = 1;
    log.sourceType = String(params?.sourceType || 'manual');
    log.sourceId = String(params?.sourceId || '');
    log.isDeleted = false;
    log.createdAt = now;
    log.createdBy = userId;
    log.updatedAt = now;
    log.updatedBy = userId;

    const col: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    await col.upsert([log]);

    logger.info(`record-audit-log done: id=${log.id}, action=${action}, entity=${entityType}`);
    callback({ ret: { code: 0, message: 'ok', data: { id: log.id } } });
  } catch (err: any) {
    logger.error(`record-audit-log error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
