import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { WorkItem } from './WorkItem';
import { AutoTask } from './AutoTask';
import { RiskAlert } from './RiskAlert';
import { DataQualityIssue } from './DataQualityIssue';
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

async function recordEvent(
  col: CloudDBCollection<BusinessEvent>,
  orgId: string,
  eventType: string,
  entityType: string,
  entityId: string,
  entityName: string,
  actorId: string,
  actorName: string,
  metadata: any,
  correlationId = '',
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
  ev.level = 'info';
  ev.metadata = JSON.stringify(metadata || {});
  ev.sourceType = 'manual';
  ev.sourceId = '';
  ev.correlationId = correlationId || '';
  ev.version = 1;
  ev.isDeleted = false;
  ev.occurredAt = now;
  ev.createdAt = now;
  await col.upsert([ev]);
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('act-work-item called');

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = String(params?.userName || '成员');
    const id = params?.id as string;
    const action = String(params?.action || 'done');
    const note = String(params?.note || '');
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

    const col: CloudDBCollection<WorkItem> = db.collection(WorkItem);
    const rows = await col.query().equalTo('id', id).get();
    if (rows.length === 0) {
      callback({ ret: { code: -1, message: '工作项不存在' } });
      return;
    }
    const item = rows[0];
    if (item.orgId !== orgId) {
      callback({ ret: { code: -1, message: '工作项不属于该组织' } });
      return;
    }

    const now = new Date();
    const correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const eventType = action === 'done' ? 'completed' : action === 'cancel' ? 'withdrawn' : 'updated';

    // 审批与项目任务：来源系统处理，工作项仅同步状态
    if (item.workItemType === 'approval') {
      callback({
        ret: {
          code: -1,
          message: '审批请通过财务审批动作处理（act-finance-node），工作项状态将自动同步',
        },
      });
      return;
    }
    if (item.workItemType === 'project_task') {
      callback({
        ret: { code: -1, message: '项目任务请在项目管理模块处理，工作项状态将自动同步' },
      });
      return;
    }

    // 自动任务 / 风险 / 数据质量：同步更新来源对象
    if (item.workItemType === 'auto_task') {
      const taskCol: CloudDBCollection<AutoTask> = db.collection(AutoTask);
      const taskRows = await taskCol.query().equalTo('id', item.originId).get();
      if (taskRows.length > 0) {
        const task = taskRows[0];
        if (action === 'done' || action === 'cancel') {
          task.status = action === 'done' ? 'done' : 'cancelled';
          task.completedAt = now;
          task.completedBy = userId;
          task.completedByName = userName;
        } else {
          task.status = 'open';
          task.completedAt = null;
          task.completedBy = '';
          task.completedByName = '';
        }
        task.correlationId = correlationId;
        task.updatedAt = now;
        await taskCol.upsert([task]);
      }
    } else if (item.workItemType === 'risk') {
      const riskCol: CloudDBCollection<RiskAlert> = db.collection(RiskAlert);
      const riskRows = await riskCol.query().equalTo('id', item.originId).get();
      if (riskRows.length > 0) {
        const risk = riskRows[0];
        if (action === 'done') {
          risk.status = 'resolved';
          risk.resolvedAt = now;
          risk.resolvedBy = userId;
          risk.resolvedByName = userName;
        } else {
          risk.status = 'open';
          risk.resolvedAt = null;
          risk.resolvedBy = '';
          risk.resolvedByName = '';
        }
        if (note) risk.metadata = JSON.stringify({ lastNote: note, lastNoteBy: userName, lastNoteAt: now.toISOString() });
        risk.correlationId = correlationId;
        risk.updatedAt = now;
        await riskCol.upsert([risk]);
      }
    } else if (item.workItemType === 'data_quality') {
      const dqCol: CloudDBCollection<DataQualityIssue> = db.collection(DataQualityIssue);
      const dqRows = await dqCol.query().equalTo('id', item.originId).get();
      if (dqRows.length > 0) {
        const issue = dqRows[0];
        if (action === 'done') {
          issue.status = 'resolved';
          issue.resolvedAt = now;
          issue.resolvedBy = userId;
          issue.resolvedByName = userName;
        } else {
          issue.status = 'open';
          issue.resolvedAt = null;
          issue.resolvedBy = '';
          issue.resolvedByName = '';
        }
        issue.updatedAt = now;
        await dqCol.upsert([issue]);
      }
    }

    if (action === 'done' || action === 'cancel') {
      item.status = action === 'done' ? 'done' : 'cancelled';
    } else {
      item.status = 'open';
    }
    if (note) {
      item.description = `${item.description}\n[处理备注] ${note}`.trim();
    }
    item.correlationId = correlationId;
    item.updatedAt = now;
    item.updatedBy = userId;
    await col.upsert([item]);

    await recordEvent(
      eventCol, orgId, eventType, 'work_item', item.id, item.title,
      userId, userName,
      { action, note, workItemType: item.workItemType, originId: item.originId },
      correlationId,
    );

    logger.info(`act-work-item done: id=${id}, action=${action}, type=${item.workItemType}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { id: item.id, status: item.status, workItemType: item.workItemType },
      },
    });
  } catch (err: any) {
    logger.error(`act-work-item error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
