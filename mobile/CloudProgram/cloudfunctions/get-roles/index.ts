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

const BUILTIN_NAMES: Record<string, string> = {
  org_admin: '组织管理员',
  chairman: '会长',
  secretary_general: '秘书长',
  finance_lead: '财务负责人',
  director: '理事',
  supervisor: '监事',
  secretariat: '秘书处',
  member: '普通成员',
};

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-roles called');
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
    if (mine.length === 0) {
      callback({ ret: { code: -1, message: '您不是该组织成员' } });
      return;
    }

    const roleCol: CloudDBCollection<Role> = db.collection(Role);
    const custom = await roleCol.query().equalTo('orgId', orgId).limit(200).get();
    const roles = custom.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      builtin: r.builtin,
      permissions: r.permissions,
      dataScope: r.dataScope,
      status: r.status,
    }));
    const builtinCodes = Object.keys(BUILTIN_NAMES);
    const customCodes = new Set(custom.map((r) => r.code));

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          roles,
          builtins: builtinCodes
            .filter((c) => !customCodes.has(c))
            .map((c) => ({
              id: `role_${orgId}_${c}`,
              code: c,
              name: BUILTIN_NAMES[c],
              builtin: true,
              permissions: '[]',
              dataScope: 'org',
              status: 'active',
            })),
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-roles error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
