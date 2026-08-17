import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { BusinessEvent } from './BusinessEvent';
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
const PAGE_SIZE = 50;

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-business-events called');

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
    const eventType = String(params?.eventType || '');
    const level = String(params?.level || '');
    const page = Math.max(0, Number(params?.page) || 0);
    const pageSize = Math.min(PAGE_SIZE, Math.max(1, Number(params?.pageSize) || 20));

    const col: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    let query = col.query().equalTo('orgId', orgId);
    if (entityType) query = query.equalTo('entityType', entityType);
    if (eventType) query = query.equalTo('eventType', eventType);
    if (level) query = query.equalTo('level', level);
    const rows = await query.orderByDesc('occurredAt').limit(pageSize, page * pageSize).get();
    const total = await query.orderByDesc('occurredAt').countQuery('id');

    const events = rows.map((e) => ({
      id: e.id,
      orgId: e.orgId,
      eventType: e.eventType,
      entityType: e.entityType,
      entityId: e.entityId,
      entityName: e.entityName,
      actorId: e.actorId,
      actorName: e.actorName,
      level: e.level,
      metadata: e.metadata,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      version: e.version,
      isDeleted: e.isDeleted,
      occurredAt: e.occurredAt ? e.occurredAt.toISOString() : '',
      createdAt: e.createdAt ? e.createdAt.toISOString() : '',
    }));

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          events,
          total,
          hasMore: page * pageSize + rows.length < total,
          page,
          pageSize,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-business-events error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
