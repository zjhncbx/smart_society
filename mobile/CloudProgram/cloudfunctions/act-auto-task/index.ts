import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { AutoTask } from './AutoTask';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';
import { IdempotencyRecord } from './IdempotencyRecord';

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

const IDEM_TIMEOUT_MS = 120000;

async function claimIdempotent(
  col: CloudDBCollection<IdempotencyRecord>,
  key: string,
  orgId: string,
  action: string,
  entityType: string,
  entityId: string,
  requestHash: string,
  actorId: string,
): Promise<{ status: 'cached' | 'claimed' | 'processing'; result?: any }> {
  const now = Date.now();
  const rows = await col.query().equalTo('id', key).get();
  if (rows.length > 0) {
    const rec = rows[0];
    if (rec.status === 'done') {
      try {
        return { status: 'cached', result: JSON.parse(rec.result || '{}') };
      } catch {
        return { status: 'cached', result: {} };
      }
    }
    if (rec.status === 'processing') {
      const created = rec.createdAt ? rec.createdAt.getTime() : now;
      if (now - created < IDEM_TIMEOUT_MS) {
        return { status: 'processing' };
      }
    }
  }
  const claimId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
  const rec = new IdempotencyRecord();
  rec.id = key;
  rec.orgId = orgId;
  rec.action = action;
  rec.entityType = entityType;
  rec.entityId = entityId || '';
  rec.result = '{}';
  rec.status = 'processing';
  rec.claimId = claimId;
  rec.requestHash = requestHash;
  rec.createdAt = new Date(now);
  rec.expiresAt = new Date(now + IDEM_TIMEOUT_MS);
  rec.createdBy = actorId || '';
  await col.upsert([rec]);
  const confirm = await col.query().equalTo('id', key).get();
  if (confirm.length > 0 && confirm[0].claimId === claimId) {
    return { status: 'claimed' };
  }
  return { status: 'processing' };
}

async function completeIdempotent(
  col: CloudDBCollection<IdempotencyRecord>,
  key: string,
  result: any,
): Promise<void> {
  if (!key) return;
  const rows = await col.query().equalTo('id', key).get();
  if (rows.length === 0) return;
  const rec = rows[0];
  rec.status = 'done';
  rec.result = JSON.stringify(result || {});
  rec.updatedAt = new Date();
  await col.upsert([rec]);
}

async function failIdempotent(
  col: CloudDBCollection<IdempotencyRecord>,
  key: string,
): Promise<void> {
  if (!key || !col) return;
  const rows = await col.query().equalTo('id', key).get();
  if (rows.length === 0) return;
  const rec = rows[0];
  rec.status = 'failed';
  rec.updatedAt = new Date();
  await col.upsert([rec]);
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('act-auto-task called');
  let idempotencyKey = '';
  let idemCol: CloudDBCollection<IdempotencyRecord> | null = null;

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

    idempotencyKey = String(params?.idempotencyKey || '');
    if (!idempotencyKey) {
      callback({ ret: { code: -1, message: '缺少 idempotencyKey：任务处理必须幂等' } });
      return;
    }
    idemCol = db.collection(IdempotencyRecord);
    const claim = await claimIdempotent(
      idemCol, idempotencyKey, orgId, action, 'auto_task', task.id,
      String(JSON.stringify({ id, action })).slice(0, 300), userId,
    );
    if (claim.status === 'cached') {
      callback({ ret: { code: 0, message: 'ok（幂等返回）', data: claim.result } });
      return;
    }
    if (claim.status === 'processing') {
      callback({ ret: { code: -1, message: '该操作正在处理中，请勿重复提交' } });
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

    await completeIdempotent(
      idemCol, idempotencyKey,
      { id: task.id, status: task.status },
    );

    logger.info(`act-auto-task done: id=${id}, action=${action}`);
    callback({
      ret: { code: 0, message: 'ok', data: { id: task.id, status: task.status } },
    });
  } catch (err: any) {
    logger.error(`act-auto-task error: ${err.message}`);
    if (idemCol && idempotencyKey) {
      await failIdempotent(idemCol, idempotencyKey);
    }
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
