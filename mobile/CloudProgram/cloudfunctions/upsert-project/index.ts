import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Project } from './Project';
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

function parseTasks(raw: string): any[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function recordEvent(
  col: CloudDBCollection<BusinessEvent>,
  orgId: string,
  eventType: string,
  entityType: string,
  entityId: string,
  entityName: string,
  actorId: string,
  actorName: string,
  level: string,
  metadata: any,
): Promise<void> {
  const now = new Date();
  const ev = new BusinessEvent();
  ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
  ev.orgId = orgId;
  ev.eventType = eventType;
  ev.entityType = entityType;
  ev.entityId = entityId;
  ev.entityName = entityName || '';
  ev.actorId = actorId || 'system';
  ev.actorName = actorName || '系统';
  ev.level = level || 'info';
  ev.metadata = JSON.stringify(metadata || {});
  ev.sourceType = 'manual';
  ev.sourceId = '';
  ev.version = 1;
  ev.isDeleted = false;
  ev.occurredAt = now;
  ev.createdAt = now;
  await col.upsert([ev]);
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('upsert-project called');

  try {
    const record = parseParams(event);
    logger.info(`upsert-project params: ${JSON.stringify(record)}`);
    if (!record || !record.id) {
      callback({ ret: { code: -1, message: '缺少 id 字段' } });
      return;
    }
    if (!record.orgId) {
      callback({ ret: { code: -1, message: '缺少 orgId 字段' } });
      return;
    }
    const userId = String(record.userId || '');
    if (!userId) {
      callback({ ret: { code: -1, message: '缺少 userId 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${record.orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    const col: CloudDBCollection<Project> = db.collection(Project);
    const existingRows = await col.query().equalTo('id', record.id).get();
    const existing = existingRows.length > 0 ? existingRows[0] : null;
    const obj = Project.parseFrom(record);
    obj.updatedAt = new Date();
    await col.upsert([obj]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const actorId = String(record.actorId || 'system');
    const actorName = String(record.actorName || '系统');
    const statusNames = ['筹备中', '进行中', '已暂停', '已完成'];
    const projectEvent = existing ? 'updated' : 'created';
    await recordEvent(
      eventCol, record.orgId, projectEvent, 'project', obj.id, obj.name,
      actorId, actorName, projectEvent === 'created' ? 'info' : 'info',
      {
        status: obj.status,
        statusLabel: statusNames[obj.status] || '',
        progress: obj.progress,
        budget: obj.budget,
      },
    );

    // 任务状态变化事件：便于后续“决议→任务→项目”自动追踪
    const oldTasks = existing ? parseTasks(existing.tasks) : [];
    const newTasks = parseTasks(obj.tasks);
    const taskStatusNames = ['待办', '进行中', '已完成'];
    for (const task of newTasks) {
      const old = oldTasks.find((t: any) => t.id === task.id);
      const oldStatus = old ? Number(old.status) : -1;
      const newStatus = Number(task.status);
      if (oldStatus !== newStatus) {
        await recordEvent(
          eventCol, record.orgId, 'status_changed', 'task',
          `${obj.id}:${task.id}`, String(task.title || '任务'),
          actorId, actorName, 'info',
          {
            projectId: obj.id,
            projectName: obj.name,
            oldStatus,
            newStatus,
            oldStatusLabel: oldStatus >= 0 ? taskStatusNames[oldStatus] : '',
            newStatusLabel: taskStatusNames[newStatus] || '',
          },
        );
      }
    }

    logger.info(`upsert-project done: id=${record.id}, event=${projectEvent}`);
    callback({ ret: { code: 0, message: 'ok' } });
  } catch (err: any) {
    logger.error(`upsert-project error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
