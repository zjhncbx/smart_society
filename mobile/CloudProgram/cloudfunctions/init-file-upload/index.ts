import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Document } from './Document';
import { UserOrganization } from './UserOrganization';
import { AppUser } from './AppUser';
import { BusinessEvent } from './BusinessEvent';
import { AuditLog } from './AuditLog';
import { IdempotencyRecord } from './IdempotencyRecord';

function parseParams(event: any): any {
  let body: any = event && event.body !== undefined ? event.body : event;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return {}; } }
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return {}; } }
  if (body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 1 && 'data' in body) {
    body = body.data;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return {}; } }
  }
  return body ?? {};
}

const ZONE_NAME = 'default';
const IDEM_TIMEOUT_MS = 120000;
const MAX_FILE_SIZE = 10485760;
const DOMAINS = ['member', 'project', 'notice', 'approval', 'finance', 'governance', 'attachment', 'other'];

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
  level: string,
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
  ev.level = level || 'info';
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

function newCode(now: Date): string {
  return `DOC-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('init-file-upload called');
  let idemCol: CloudDBCollection<IdempotencyRecord> | null = null;
  let idempotencyKey = '';
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = String(params?.userName || '成员');
    const name = String(params?.name || '').trim();
    const fileName = String(params?.fileName || '').trim();
    const contentType = String(params?.contentType || '').trim();
    const domain = String(params?.domain || 'attachment');
    const refType = String(params?.refType || '');
    const refId = String(params?.refId || '');
    const size = Math.max(0, Number(params?.size) || 0);
    if (!orgId || !userId || !name || !fileName || !contentType) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/name/fileName/contentType 参数' } });
      return;
    }
    if (!DOMAINS.includes(domain)) {
      callback({ ret: { code: -1, message: `domain 非法：${domain}` } });
      return;
    }
    if (size > MAX_FILE_SIZE) {
      callback({ ret: { code: -1, message: `文件大小超过上限 ${MAX_FILE_SIZE / 1024 / 1024}MB` } });
      return;
    }
    idempotencyKey = String(params?.idempotencyKey || '');
    if (!idempotencyKey) {
      callback({ ret: { code: -1, message: '缺少 idempotencyKey：文件上传初始化必须幂等' } });
      return;
    }
    const db = cloud.database({ zoneName: ZONE_NAME });
    const uoCol: CloudDBCollection<UserOrganization> = db.collection(UserOrganization);
    const mine = await uoCol.query().equalTo('id', `${orgId}_${userId}`).get();
    if (mine.length === 0 || mine[0].status !== 'active') {
      callback({ ret: { code: -1, message: '您不是该组织有效成员' } });
      return;
    }
    const userCol: CloudDBCollection<AppUser> = db.collection(AppUser);
    const userRows = await userCol.query().equalTo('id', userId).get();
    if (userRows.length === 0) {
      callback({ ret: { code: -1, message: '用户身份无效' } });
      return;
    }
    idemCol = db.collection(IdempotencyRecord);
    const claim = await claimIdempotent(
      idemCol, idempotencyKey, orgId, 'file.init', 'document', '',
      JSON.stringify(params), userId,
    );
    if (claim.status === 'cached') {
      callback({ ret: { code: 0, message: 'ok（幂等返回）', data: claim.result } });
      return;
    }
    if (claim.status === 'processing') {
      callback({ ret: { code: -1, message: '该上传初始化正在处理中，请勿重复提交' } });
      return;
    }
    const col: CloudDBCollection<Document> = db.collection(Document);
    const now = new Date();
    const correlationId = 'c' + Date.now() + Math.floor(Math.random() * 1000000);
    const d = new Document();
    d.id = 'doc' + Date.now() + Math.floor(Math.random() * 100000);
    d.orgId = orgId;
    d.code = newCode(now);
    d.name = name;
    d.fileName = fileName;
    d.contentType = contentType;
    d.size = size;
    d.domain = domain;
    d.refType = refType;
    d.refId = refId;
    d.uploadPath = `_uploads/${userId}/${d.id}`;
    d.storagePath = '';
    d.status = 'uploading';
    d.downloadCount = 0;
    d.ownerId = userId;
    d.ownerName = userName;
    d.correlationId = correlationId;
    d.version = 1;
    d.sourceType = 'manual';
    d.sourceId = '';
    d.isDeleted = false;
    d.createdAt = now;
    d.createdBy = userId;
    d.updatedAt = now;
    d.updatedBy = userId;
    await col.upsert([d]);
    await recordEvent(
      db.collection(BusinessEvent), orgId, 'document.created', 'document', d.id, d.name,
      userId, userName, 'info', { status: 'uploading', domain, size, fileName }, correlationId,
    );
    await recordAudit(
      db.collection(AuditLog), orgId, 'file.init', 'document', d.id, d.name,
      userId, userName, null, d, '初始化文件上传', correlationId,
    );
    const result = { documentId: d.id, uploadPath: d.uploadPath, code: d.code, domain: d.domain, correlationId };
    await completeIdempotent(idemCol, idempotencyKey, result);
    callback({ ret: { code: 0, message: 'ok', data: result } });
  } catch (err: any) {
    logger.error(`init-file-upload error: ${err.message}`);
    if (idemCol && idempotencyKey) {
      await failIdempotent(idemCol, idempotencyKey);
    }
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
