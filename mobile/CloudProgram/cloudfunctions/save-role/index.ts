import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Role } from './Role';
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
  logger.info('save-role called');
  try {
    const params = parseParams(event);
    const orgId = params?.orgId as string;
    const userId = params?.userId as string;
    const roleId = String(params?.roleId || '');
    const name = String(params?.name || '');
    const permissions = params?.permissions;
    const dataScope = String(params?.dataScope || 'org');
    if (!orgId || !userId || !roleId || !name) {
      callback({ ret: { code: -1, message: '缺少 orgId/userId/roleId/name 参数' } });
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
      callback({ ret: { code: -1, message: '仅组织管理员可配置角色' } });
      return;
    }

    const now = new Date();
    const col: CloudDBCollection<Role> = db.collection(Role);
    const rows = await col.query().equalTo('id', `role_${orgId}_${roleId}`).get();
    const role = rows.length > 0 ? rows[0] : new Role();
    role.id = `role_${orgId}_${roleId}`;
    role.orgId = orgId;
    role.code = roleId;
    role.name = name;
    role.builtin = role.builtin || false;
    role.permissions = Array.isArray(permissions) ? JSON.stringify(permissions) : role.permissions;
    role.dataScope = dataScope;
    role.status = 'active';
    role.version = (role.version || 1) + (rows.length > 0 ? 1 : 0);
    role.sourceType = 'manual';
    role.sourceId = '';
    role.isDeleted = false;
    role.createdAt = role.createdAt || now;
    role.createdBy = role.createdBy || userId;
    role.updatedAt = now;
    role.updatedBy = userId;
    await col.upsert([role]);

    callback({ ret: { code: 0, message: 'ok', data: { id: role.id } } });
  } catch (err: any) {
    logger.error(`save-role error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
