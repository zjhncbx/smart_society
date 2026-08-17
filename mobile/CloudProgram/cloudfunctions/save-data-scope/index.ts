import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { DataScope } from './DataScope';
import { UserOrganization } from './UserOrganization';

function parseParams(event: any): any {
  let body: any = event && event.body !== undefined ? event.body : event;
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

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('save-data-scope called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const targetUserId = String(params?.targetUserId || '');
    const roleId = String(params?.roleId || '');
    const scopeType = String(params?.scopeType || 'org');
    const dataTypes = params?.dataTypes;
    if (!orgId || !userId) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId 参数' } });
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
      callback({ ret: { code: -1, message: '仅组织管理员可配置数据范围' } });
      return;
    }

    const now = new Date();
    const id = `ds_${orgId}_${targetUserId || roleId}`;
    const col: CloudDBCollection<DataScope> = db.collection(DataScope);
    const rows = await col.query().equalTo('id', id).get();
    const scope = rows.length > 0 ? rows[0] : new DataScope();
    scope.id = id;
    scope.orgId = orgId;
    scope.roleId = roleId;
    scope.userId = targetUserId;
    scope.scopeType = scopeType;
    scope.dataTypes = Array.isArray(dataTypes) ? JSON.stringify(dataTypes) : scope.dataTypes;
    scope.status = 'active';
    scope.createdAt = scope.createdAt || now;
    scope.createdBy = scope.createdBy || userId;
    scope.updatedAt = now;
    scope.updatedBy = userId;
    await col.upsert([scope]);

    callback({ ret: { code: 0, message: 'ok', data: { id: scope.id } } });
  } catch (err: any) {
    logger.error(`save-data-scope error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
