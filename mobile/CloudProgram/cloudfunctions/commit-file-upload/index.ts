import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { AGCCloudStorage } from '@agconnect/cloudstorage-server';
import { AGCClient } from '@agconnect/common-server';
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
const MAX_PROXY_SIZE = 5242880;
const BUCKET = process.env.CLOUD_STORAGE_BUCKET || 'agc-cloudstorage';

function getStorageBucket(): any {
  try {
    return AGCCloudStorage.getInstance().bucket(BUCKET);
  } catch {
    AGCClient.initialize(undefined, 'default', 'CN');
    return AGCCloudStorage.getInstance().bucket(BUCKET);
  }
}

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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('commit-file-upload called');
  let idemCol: CloudDBCollection<IdempotencyRecord> | null = null;
  let idempotencyKey = '';
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const userName = String(params?.userName || '成员');
    const documentId = String(params?.documentId || '');
    const mode = String(params?.mode || 'sdk');
    const contentBase64 = String(params?.contentBase64 || '');
    const checksum = String(params?.checksum || '');
    if (!orgId || !userId || !documentId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/documentId 参数' } });
      return;
    }
    if (mode !== 'sdk' && mode !== 'proxy') {
      callback({ ret: { code: -1, message: `mode 非法：${mode}（仅支持 sdk/proxy）` } });
      return;
    }
    idempotencyKey = String(params?.idempotencyKey || '');
    if (!idempotencyKey) {
      callback({ ret: { code: -1, message: '缺少 idempotencyKey：文件提交必须幂等' } });
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
    const col: CloudDBCollection<Document> = db.collection(Document);
    const docs = await col.query().equalTo('id', documentId).get();
    if (docs.length === 0) {
      callback({ ret: { code: -1, message: '文件不存在或已删除' } });
      return;
    }
    const doc = docs[0];
    if (doc.orgId !== orgId) {
      callback({ ret: { code: -1, message: '文件不属于当前组织' } });
      return;
    }
    if (doc.ownerId !== userId) {
      callback({ ret: { code: -1, message: '仅文件上传人可执行提交' } });
      return;
    }
    if (doc.status === 'active') {
      callback({
        ret: {
          code: 0,
          message: 'ok（文件已提交）',
          data: { documentId: doc.id, storagePath: doc.storagePath, status: doc.status, size: doc.size, correlationId: doc.correlationId },
        },
      });
      return;
    }
    if (doc.status !== 'uploading' && doc.status !== 'failed') {
      callback({ ret: { code: -1, message: `当前状态不可提交：${doc.status}` } });
      return;
    }
    idemCol = db.collection(IdempotencyRecord);
    const claim = await claimIdempotent(
      idemCol, idempotencyKey, orgId, 'file.commit', 'document', documentId,
      JSON.stringify(params), userId,
    );
    if (claim.status === 'cached') {
      callback({ ret: { code: 0, message: 'ok（幂等返回）', data: claim.result } });
      return;
    }
    if (claim.status === 'processing') {
      callback({ ret: { code: -1, message: '该文件提交正在处理中，请勿重复提交' } });
      return;
    }

    const storagePath = `${orgId}/${doc.domain}/${doc.id}`;
    let size = doc.size || 0;
    let uploaded = false;
    try {
      const bucket = getStorageBucket();
      if (mode === 'proxy') {
        if (!contentBase64) {
          callback({ ret: { code: -1, message: '代理上传模式缺少 contentBase64' } });
          return;
        }
        const buf = Buffer.from(contentBase64, 'base64');
        if (buf.length === 0) {
          callback({ ret: { code: -1, message: '文件内容为空' } });
          return;
        }
        if (buf.length > MAX_PROXY_SIZE) {
          callback({ ret: { code: -1, message: `代理上传超过上限 ${MAX_PROXY_SIZE / 1024 / 1024}MB` } });
          return;
        }
        await bucket.file(storagePath).save(buf);
        size = buf.length;
        uploaded = true;
      } else {
        const src = bucket.file(doc.uploadPath);
        const exists = await src.exists();
        if (!exists) {
          doc.status = 'failed';
          doc.updatedAt = new Date();
          doc.updatedBy = userId;
          await col.upsert([doc]);
          callback({ ret: { code: -1, message: '未检测到暂存文件，请重新上传后重试' } });
          return;
        }
        const buf = await src.download();
        const realSize = buf ? buf.length : 0;
        if (realSize === 0) {
          doc.status = 'failed';
          doc.updatedAt = new Date();
          doc.updatedBy = userId;
          await col.upsert([doc]);
          callback({ ret: { code: -1, message: '暂存文件为空' } });
          return;
        }
        if (realSize > MAX_FILE_SIZE) {
          doc.status = 'failed';
          doc.updatedAt = new Date();
          doc.updatedBy = userId;
          await col.upsert([doc]);
          callback({ ret: { code: -1, message: `文件超过上限 ${MAX_FILE_SIZE / 1024 / 1024}MB` } });
          return;
        }
        size = realSize;
        await src.move(storagePath);
        uploaded = true;
      }
    } catch (storageErr: any) {
      logger.error(`commit-file-upload storage error: ${storageErr.message}`);
      callback({
        ret: {
          code: -1,
          message: `云存储操作失败：${storageErr.message}（请确认云函数环境变量 CLOUD_STORAGE_BUCKET 与 AGC 服务端凭据）`,
        },
      });
      return;
    }
    if (!uploaded) {
      callback({ ret: { code: -1, message: '文件未完成写入' } });
      return;
    }

    const before = { status: doc.status, uploadPath: doc.uploadPath };
    doc.storagePath = storagePath;
    doc.uploadPath = '';
    doc.size = size;
    doc.checksum = checksum || doc.checksum;
    doc.status = 'active';
    doc.version = (doc.version || 1) + 1;
    doc.updatedAt = new Date();
    doc.updatedBy = userId;
    await col.upsert([doc]);
    await recordEvent(
      db.collection(BusinessEvent), orgId, 'document.committed', 'document', doc.id, doc.name,
      userId, userName, 'info', { status: 'active', storagePath, size, mode }, doc.correlationId,
    );
    await recordAudit(
      db.collection(AuditLog), orgId, 'file.commit', 'document', doc.id, doc.name,
      userId, userName, before, { status: 'active', storagePath, size, mode }, mode === 'proxy' ? '代理上传提交' : 'SDK 直传提交', doc.correlationId,
    );
    const result = { documentId: doc.id, storagePath, status: doc.status, size, name: doc.name, fileName: doc.fileName, contentType: doc.contentType, domain: doc.domain, correlationId: doc.correlationId };
    await completeIdempotent(idemCol, idempotencyKey, result);
    callback({ ret: { code: 0, message: 'ok', data: result } });
  } catch (err: any) {
    logger.error(`commit-file-upload error: ${err.message}`);
    if (idemCol && idempotencyKey) {
      await failIdempotent(idemCol, idempotencyKey);
    }
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
