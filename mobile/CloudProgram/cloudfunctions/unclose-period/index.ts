import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { FinanceRecord } from './FinanceRecord';
import { Notice } from './Notice';
import { UserOrganization } from './UserOrganization';
import { BusinessEvent } from './BusinessEvent';
import { AuditLog } from './AuditLog';
import { IdempotencyRecord } from './IdempotencyRecord';

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
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

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

async function recordAudit(
  col: CloudDBCollection<AuditLog>,
  orgId: string,
  action: string,
  entityType: string,
  entityId: string,
  entityName: string,
  actorId: string,
  actorName: string,
  before: any,
  after: any,
  changeReason = '',
  correlationId = '',
): Promise<void> {
  const now = new Date();
  const log = new AuditLog();
  log.id = 'al' + Date.now() + Math.floor(Math.random() * 100000);
  log.orgId = orgId;
  log.code = '';
  log.action = action;
  log.entityType = entityType;
  log.entityId = entityId;
  log.entityName = entityName || '';
  log.actorId = actorId || 'system';
  log.actorName = actorName || '系统';
  log.before = before !== undefined && before !== null ? JSON.stringify(before) : 'null';
  log.after = after !== undefined && after !== null ? JSON.stringify(after) : 'null';
  log.changeReason = changeReason;
  log.correlationId = correlationId || '';
  log.status = 'success';
  log.version = 1;
  log.sourceType = 'manual';
  log.sourceId = '';
  log.isDeleted = false;
  log.createdAt = now;
  log.createdBy = actorId || '';
  log.updatedAt = now;
  log.updatedBy = actorId || '';
  await col.upsert([log]);
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
  ev.level = 'warning';
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

async function queryAllByOrg<T>(col: CloudDBCollection<T>, orgId: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await col.query().equalTo('orgId', orgId).limit(PAGE_SIZE, page * PAGE_SIZE).get();
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('unclose-period called');
  let idempotencyKey = '';
  let idemCol: CloudDBCollection<IdempotencyRecord> | null = null;

  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = (params?.userName as string) || '管理员';
    const year = String(params?.year || '');
    if (!orgId || !userId || !/^\d{4}$/.test(year)) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/year 参数' } });
      return;
    }

    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }
    if (mine[0].role !== 'admin') {
      callback({ ret: { code: -1, message: '仅组织管理员可以反结账' } });
      return;
    }

    idempotencyKey = String(params?.idempotencyKey || '');
    if (!idempotencyKey) {
      callback({ ret: { code: -1, message: '缺少 idempotencyKey：反结账必须幂等' } });
      return;
    }
    idemCol = db.collection(IdempotencyRecord);
    const claim = await claimIdempotent(
      idemCol, idempotencyKey, orgId, 'unclose', 'finance', year,
      String(JSON.stringify({ year })).slice(0, 300), userId,
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

    const recordCol: CloudDBCollection<FinanceRecord> = db.collection(FinanceRecord);
    const rows = await queryAllByOrg(recordCol, orgId);
    const closing = rows.filter((r) => r.type === 'closing' && r.period === year);
    if (closing.length === 0) {
      callback({ ret: { code: -1, message: `${year} 年度尚未结账` } });
      return;
    }
    await recordCol.delete(closing);

    const noticeCol: CloudDBCollection<Notice> = db.collection(Notice);
    const notice = new Notice();
    notice.id = 'fn' + Date.now() + Math.floor(Math.random() * 1000);
    notice.orgId = orgId;
    notice.title = `【财务】${year} 年度已反结账`;
    notice.content = `${userName} 已撤销 ${year} 年度期末结账，可继续录入该年度凭证。`;
    notice.publisher = '财务结账';
    notice.publishTime = new Date();
    notice.isRead = false;
    notice.isImportant = true;
    notice.updatedAt = new Date();
    await noticeCol.upsert([notice]);

    const eventCol: CloudDBCollection<BusinessEvent> = db.collection(BusinessEvent);
    await recordEvent(
      eventCol, orgId, 'updated', 'finance', `unclose-${year}`, `${year} 年度反结账`,
      userId, userName,
      { year, removed: closing.length },
      correlationId,
    );

    const auditCol: CloudDBCollection<AuditLog> = db.collection(AuditLog);
    await recordAudit(
      auditCol, orgId, 'unclose', 'finance', `unclose-${year}`, `${year} 年度反结账`,
      userId, userName, closing, null, '', correlationId,
    );

    await completeIdempotent(
      idemCol, idempotencyKey,
      { removed: closing.length },
    );

    logger.info(`unclose-period done: orgId=${orgId}, year=${year}, vouchers=${closing.length}`);
    callback({
      ret: { code: 0, message: 'ok', data: { removed: closing.length } },
    });
  } catch (err: any) {
    logger.error(`unclose-period error: ${err.message}`);
    if (idemCol && idempotencyKey) {
      await failIdempotent(idemCol, idempotencyKey);
    }
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
