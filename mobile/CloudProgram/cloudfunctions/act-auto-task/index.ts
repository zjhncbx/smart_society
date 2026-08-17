import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { AutoTask } from './AutoTask';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';

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
  logger.info('act-auto-task called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = String(params?.userName || '成员');
    const id = params?.id as string;
    const action = String(params?.action || 'done');
    if (!orgId || !userId || !id) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/id 参数' } });
      return;
    }
    if (!['done', 'cancel', 'reopen'].includes(action)) {
      callback({ ret: { code: -1, message: 'action 不合法' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const col: CloudDBCollection<AutoTask> = db.collection(AutoTask);
    const rows = await col.query().equalTo('id', id).get();
    if (rows.length === 0) {
      callback({ ret: { code: -1, message: '任务不存在' } });
      return;
    }
    const task = rows[0];
    if (task.orgId !== orgId) {
      callback({ ret: { code: -1, message: '任务不属于该组织' } });
      return;
    }

    const now = new Date();
    if (action === 'done') {
      task.status = 'done';
      task.completedAt = now;
      task.completedBy = userId;
      task.completedByName = userName;
    } else if (action === 'cancel') {
      task.status = 'cancelled';
      task.completedAt = now;
      task.completedBy = userId;
      task.completedByName = userName;
    } else {
      task.status = 'open';
      task.completedAt = null;
      task.completedBy = '';
      task.completedByName = '';
    }
    task.updatedAt = now;
    await col.upsert([task]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const ev = new BusinessEvent();
    ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
    ev.orgId = orgId;
    ev.eventType = action === 'done' ? 'completed' : action === 'cancel' ? 'withdrawn' : 'updated';
    ev.entityType = 'task';
    ev.entityId = task.id;
    ev.entityName = task.title;
    ev.actorId = userId;
    ev.actorName = userName;
    ev.level = 'info';
    ev.metadata = JSON.stringify({ action, sourceRuleId: task.sourceRuleId, sourceType: task.sourceType });
    ev.sourceType = 'manual';
    ev.sourceId = '';
    ev.version = 1;
    ev.isDeleted = false;
    ev.occurredAt = now;
    ev.createdAt = now;
    await eventCol.upsert([ev]);

    logger.info(`act-auto-task done: id=${id}, action=${action}`);
    callback({
      ret: { code: 0, message: 'ok', data: { id: task.id, status: task.status } },
    });
  } catch (err: any) {
    logger.error(`act-auto-task error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
