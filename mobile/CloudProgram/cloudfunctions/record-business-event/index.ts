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

const EVENT_TYPES = [
  'created', 'submitted', 'approved', 'rejected', 'completed',
  'updated', 'overdue', 'withdrawn', 'archived', 'deleted',
  'status_changed', 'notified', 'resolved',
];

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('record-business-event called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const eventType = params?.eventType as string;
    const entityType = params?.entityType as string;
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
      return;
    }
    if (!eventType || !EVENT_TYPES.includes(eventType)) {
      callback({ ret: { code: -1, message: 'eventType 不合法' } });
      return;
    }
    if (!entityType) {
      callback({ ret: { code: -1, message: '缺少 entityType 参数' } });
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
    const ev = new BusinessEvent();
    ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
    ev.orgId = orgId;
    ev.eventType = eventType;
    ev.entityType = entityType;
    ev.entityId = String(params?.entityId || '');
    ev.entityName = String(params?.entityName || '');
    ev.actorId = userId;
    ev.actorName = String(params?.actorName || '成员');
    ev.level = String(params?.level || 'info');
    ev.metadata = JSON.stringify(params?.metadata || {});
    ev.sourceType = String(params?.sourceType || 'manual');
    ev.sourceId = String(params?.sourceId || '');
    ev.version = 1;
    ev.isDeleted = false;
    ev.occurredAt = now;
    ev.createdAt = now;

    const col: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    await col.upsert([ev]);

    logger.info(`record-business-event done: id=${ev.id}, type=${eventType}, entity=${entityType}`);
    callback({ ret: { code: 0, message: 'ok', data: { id: ev.id } } });
  } catch (err: any) {
    logger.error(`record-business-event error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
