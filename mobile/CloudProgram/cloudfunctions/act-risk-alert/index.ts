import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { RiskAlert } from './RiskAlert';
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
  logger.info('act-risk-alert called');
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
    if (!['resolve', 'ack', 'reopen'].includes(action)) {
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

    const col: CloudDBCollection<RiskAlert> = db.collection(RiskAlert);
    const rows = await col.query().equalTo('id', id).get();
    if (rows.length === 0) {
      callback({ ret: { code: -1, message: '风险/预警不存在' } });
      return;
    }
    const risk = rows[0];
    if (risk.orgId !== orgId) {
      callback({ ret: { code: -1, message: '风险/预警不属于该组织' } });
      return;
    }

    idempotencyKey = String(params?.idempotencyKey || '');
    if (!idempotencyKey) {
      callback({ ret: { code: -1, message: '缺少 idempotencyKey：风险处置必须幂等' } });
      return;
    }
    idemCol = db.collection(IdempotencyRecord);
    const claim = await claimIdempotent(
      idemCol, idempotencyKey, orgId, action, 'risk', risk.id,
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
    const correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);

    const now = new Date();
    if (action === 'resolve') {
      risk.status = 'resolved';
      risk.resolvedAt = now;
      risk.resolvedBy = userId;
      risk.resolvedByName = userName;
    } else if (action === 'ack') {
      risk.status = 'monitoring';
    } else {
      risk.status = 'open';
      risk.resolvedAt = null;
      risk.resolvedBy = '';
      risk.resolvedByName = '';
    }
    if (note) {
      try {
        const metadata = JSON.parse(risk.metadata || '{}');
        metadata.lastNote = note;
        metadata.lastNoteBy = userName;
        metadata.lastNoteAt = now.toISOString();
        risk.metadata = JSON.stringify(metadata);
      } catch {
        risk.metadata = JSON.stringify({ lastNote: note, lastNoteBy: userName, lastNoteAt: now.toISOString() });
      }
    }
    risk.correlationId = correlationId;
    risk.updatedAt = now;
    await col.upsert([risk]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    const ev = new BusinessEvent();
    ev.id = 'ev' + Date.now() + Math.floor(Math.random() * 100000);
    ev.orgId = orgId;
    ev.eventType = action === 'resolve' ? 'resolved' : 'updated';
    ev.entityType = 'risk';
    ev.entityId = risk.id;
    ev.entityName = risk.title;
    ev.actorId = userId;
    ev.actorName = userName;
    ev.level = 'info';
    ev.metadata = JSON.stringify({ action, note, sourceRuleId: risk.sourceRuleId });
    ev.sourceType = 'manual';
    ev.sourceId = '';
    ev.correlationId = correlationId;
    ev.version = 1;
    ev.isDeleted = false;
    ev.occurredAt = now;
    ev.createdAt = now;
    await eventCol.upsert([ev]);

    await completeIdempotent(
      idemCol, idempotencyKey,
      { id: risk.id, status: risk.status },
    );

    logger.info(`act-risk-alert done: id=${id}, action=${action}`);
    callback({
      ret: { code: 0, message: 'ok', data: { id: risk.id, status: risk.status } },
    });
  } catch (err: any) {
    logger.error(`act-risk-alert error: ${err.message}`);
    if (idemCol && idempotencyKey) {
      await failIdempotent(idemCol, idempotencyKey);
    }
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
