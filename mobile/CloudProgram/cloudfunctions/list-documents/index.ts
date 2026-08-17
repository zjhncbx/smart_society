import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Document } from './Document';
import { UserOrganization } from './UserOrganization';
import { AppUser } from './AppUser';
import { Role } from './Role';
import { DataScope } from './DataScope';

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
const PAGE_SIZE = 100;

function toJson(item: Document, viewerId: string): any {
  const isOwner = item.ownerId === viewerId;
  return {
    id: item.id,
    orgId: item.orgId,
    code: item.code,
    name: item.name,
    fileName: item.fileName,
    contentType: item.contentType,
    size: item.size,
    domain: item.domain,
    refType: item.refType,
    refId: item.refId,
    storagePath: isOwner ? item.storagePath : '',
    status: item.status,
    downloadCount: item.downloadCount,
    ownerId: item.ownerId,
    ownerName: item.ownerName,
    correlationId: item.correlationId,
    version: item.version,
    sourceType: item.sourceType,
    sourceId: item.sourceId,
    createdAt: item.createdAt ? item.createdAt.toISOString() : '',
    createdBy: item.createdBy,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : '',
    updatedBy: item.updatedBy,
  };
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('list-documents called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
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
    const domain = String(params?.domain || '');
    const refType = String(params?.refType || '');
    const refId = String(params?.refId || '');
    const status = String(params?.status || '');
    const keyword = String(params?.keyword || '').trim();
    const onlyMine = params?.onlyMine === true;
    const page = Math.max(0, Number(params?.page) || 0);
    const pageSize = Math.min(PAGE_SIZE, Math.max(1, Number(params?.pageSize) || 30));

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
    if (onlyMine) {
      dataScope = 'self';
    }
    const myMemberId = String(membership.memberId || '');
    const effectiveOwner = myMemberId || userId;

    const col: CloudDBCollection<Document> = db.collection(Document);
    let query = col.query().equalTo('orgId', orgId);
    if (domain) query = query.equalTo('domain', domain);
    if (refType) query = query.equalTo('refType', refType);
    if (refId) query = query.equalTo('refId', refId);
    if (status) query = query.equalTo('status', status);
    if (keyword) query = query.contains('name', keyword);
    if (dataScope === 'self') {
      query = query.equalTo('ownerId', effectiveOwner);
    }
    const total = await query.orderByDesc('updatedAt').countQuery('id');
    const rows = await query.orderByDesc('updatedAt').limit(pageSize, page * pageSize).get();
    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          items: rows.map((r) => toJson(r, effectiveOwner)),
          total,
          dataScope,
          hasMore: page * pageSize + rows.length < total,
        },
      },
    });
  } catch (err: any) {
    logger.error(`list-documents error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
