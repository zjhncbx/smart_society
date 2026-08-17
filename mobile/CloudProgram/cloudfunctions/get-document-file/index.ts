import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { AGCCloudStorage } from '@agconnect/cloudstorage-server';
import { AGCClient } from '@agconnect/common-server';
import { Document } from './Document';
import { UserOrganization } from './UserOrganization';
import { AppUser } from './AppUser';
import { Role } from './Role';
import { DataScope } from './DataScope';
import { AuditLog } from './AuditLog';

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
const MAX_DOWNLOAD_SIZE = 10485760;
const BUCKET = process.env.CLOUD_STORAGE_BUCKET || 'agc-cloudstorage';

function getStorageBucket(): any {
  try {
    return AGCCloudStorage.getInstance().bucket(BUCKET);
  } catch {
    AGCClient.initialize(undefined, 'default', 'CN');
    return AGCCloudStorage.getInstance().bucket(BUCKET);
  }
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
  metadata: any,
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
  log.before = 'null';
  log.after = JSON.stringify(metadata || {});
  log.changeReason = '';
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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-document-file called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const documentId = String(params?.documentId || '');
    if (!orgId || !userId || !documentId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/documentId 参数' } });
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
    if (docs.length === 0 || docs[0].orgId !== orgId) {
      callback({ ret: { code: -1, message: '文件不存在或不属于当前组织' } });
      return;
    }
    const doc = docs[0];
    if (doc.status !== 'active') {
      callback({ ret: { code: -1, message: `文件当前不可下载：${doc.status}` } });
      return;
    }
    if (doc.size > MAX_DOWNLOAD_SIZE) {
      callback({ ret: { code: -1, message: `文件超过代理下载上限 ${MAX_DOWNLOAD_SIZE / 1024 / 1024}MB` } });
      return;
    }
    let dataScope = 'org';
    const membership = mine[0];
    const roleId = String(membership.roleId || (membership.role === 'admin' ? 'org_admin' : 'member'));
    const roleCol: CloudDBCollection<Role> = db.collection(Role);
    const roleRows = await roleCol.query().equalTo('id', `role_${orgId}_${roleId}`).get();
    if (roleRows.length > 0) {
      dataScope = roleRows[0].dataScope || 'org';
    }
    const scopeCol: CloudDBCollection<DataScope> = db.collection(DataScope);
    const scopeRows = await scopeCol.query().equalTo('orgId', orgId).get();
    const userScope = scopeRows.find((s) => s.status === 'active' && s.userId === userId);
    if (userScope) {
      dataScope = userScope.scopeType || dataScope;
    }
    const myMemberId = String(membership.memberId || '');
    const effectiveOwner = myMemberId || userId;
    if (dataScope === 'self' && doc.ownerId !== effectiveOwner) {
      callback({ ret: { code: -1, message: '您的数据范围仅限本人文件' } });
      return;
    }

    let buf: Buffer | void;
    try {
      const bucket = getStorageBucket();
      buf = await bucket.file(doc.storagePath).download();
    } catch (storageErr: any) {
      logger.error(`get-document-file storage error: ${storageErr.message}`);
      callback({
        ret: {
          code: -1,
          message: `云存储读取失败：${storageErr.message}（请确认 CLOUD_STORAGE_BUCKET 与 AGC 服务端凭据）`,
        },
      });
      return;
    }
    if (!buf || buf.length === 0) {
      callback({ ret: { code: -1, message: '文件内容为空' } });
      return;
    }
    doc.downloadCount = (doc.downloadCount || 0) + 1;
    doc.updatedAt = new Date();
    doc.updatedBy = userId;
    await col.upsert([doc]);
    await recordAudit(
      db.collection(AuditLog), orgId, 'file.download', 'document', doc.id, doc.name,
      userId, userNameOf(params, userRows[0]), { size: buf.length, downloadCount: doc.downloadCount },
      doc.correlationId,
    );
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          documentId: doc.id,
          name: doc.name,
          fileName: doc.fileName,
          contentType: doc.contentType,
          size: buf.length,
          base64: buf.toString('base64'),
          correlationId: doc.correlationId,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-document-file error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

function userNameOf(params: any, user: AppUser): string {
  const name = String(params?.userName || '');
  return name || user.displayName || '成员';
}

export { myHandler };
