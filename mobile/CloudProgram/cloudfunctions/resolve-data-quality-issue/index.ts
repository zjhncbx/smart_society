import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { DataQualityIssue } from './DataQualityIssue';
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
  logger.info('resolve-data-quality-issue called');
  let idempotencyKey = '';
  let idemCol: CloudDBCollection<IdempotencyRecord> | null = null;

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = String(params?.userName || '成员');
    const id = params?.id as string;
    const action = String(params?.action || 'resolve');
    const note = String(params?.note || '');
    if (!orgId || !userId || !id) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/id 参数' } });
      return;
    }
    if (!['resolve', 'ignore', 'reopen'].includes(action)) {
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

    const col: CloudDBCollection<DataQualityIssue> = db.collection(DataQualityIssue);
    const rows = await col.query().equalTo('id', id).get();
    if (rows.length === 0) {
      callback({ ret: { code: -1, message: '数据质量问题不存在' } });
      return;
    }
    const issue = rows[0];
    if (issue.orgId !== orgId) {
      callback({ ret: { code: -1, message: '数据质量问题不属于该组织' } });
      return;
    }

    idempotencyKey = String(params?.idempotencyKey || '');
    if (!idempotencyKey) {
      callback({ ret: { code: -1, message: '缺少 idempotencyKey：数据问题处理必须幂等' } });
      return;
    }
    idemCol = db.collection(IdempotencyRecord);
    const claim = await claimIdempotent(
      idemCol, idempotencyKey, orgId, action, 'data_quality', issue.id,
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
    if (action === 'resolve') {
      issue.status = 'resolved';
      issue.resolvedAt = now;
      issue.resolvedBy = userId;
      issue.resolvedByName = userName;
    } else if (action === 'ignore') {
      issue.status = 'ignored';
      issue.resolvedAt = now;
      issue.resolvedBy = userId;
      issue.resolvedByName = userName;
    } else {
      issue.status = 'open';
      issue.resolvedAt = null;
      issue.resolvedBy = '';
      issue.resolvedByName = '';
    }
    if (note) {
      try {
        const detail = JSON.parse(issue.detail || '{}');
        detail.lastNote = note;
        detail.lastNoteBy = userName;
        detail.lastNoteAt = now.toISOString();
        issue.detail = JSON.stringify(detail);
      } catch {
        issue.detail = JSON.stringify({ lastNote: note, lastNoteBy: userName, lastNoteAt: now.toISOString() });
      }
    }
    issue.updatedAt = now;
    await col.upsert([issue]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const ev = new BusinessEvent();
    ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
    ev.orgId = orgId;
    ev.eventType = action === 'resolve' ? 'resolved' : 'updated';
    ev.entityType = 'quality';
    ev.entityId = issue.id;
    ev.entityName = `${issue.ruleName}：${issue.entityName}`;
    ev.actorId = userId;
    ev.actorName = userName;
    ev.level = action === 'resolve' ? 'info' : 'warning';
    ev.metadata = JSON.stringify({ action, note, ruleId: issue.ruleId });
    ev.sourceType = 'manual';
    ev.sourceId = '';
    ev.version = 1;
    ev.isDeleted = false;
    ev.occurredAt = now;
    ev.createdAt = now;
    await eventCol.upsert([ev]);

    await completeIdempotent(
      idemCol, idempotencyKey,
      { id: issue.id, status: issue.status },
    );

    logger.info(`resolve-data-quality-issue done: id=${id}, action=${action}`);
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: { id: issue.id, status: issue.status },
      },
    });
  } catch (err: any) {
    logger.error(`resolve-data-quality-issue error: ${err.message}`);
    if (idemCol && idempotencyKey) {
      await failIdempotent(idemCol, idempotencyKey);
    }
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
