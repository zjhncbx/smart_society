import { cloud, CloudDBCollection } from '@hw-agconnect/cloud-server';
import { Role } from './Role';
import { DataScope } from './DataScope';
import { UserOrganization } from './UserOrganization';

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

// 内置权限目录（Web 权限配置的数据底座，Permission 表用于扩展）
const PERMISSION_CATALOG: Record<string, { name: string; category: string }> = {
  'member:view': { name: '查看会员', category: 'member' },
  'member:edit': { name: '编辑会员', category: 'member' },
  'member:delete': { name: '删除会员', category: 'member' },
  'project:view': { name: '查看项目', category: 'project' },
  'project:edit': { name: '编辑项目', category: 'project' },
  'project:delete': { name: '删除项目', category: 'project' },
  'notice:publish': { name: '发布公告', category: 'notice' },
  'finance:view': { name: '查看财务', category: 'finance' },
  'finance:edit': { name: '录入财务', category: 'finance' },
  'finance:approve': { name: '财务审批', category: 'finance' },
  'finance:close': { name: '结账/反结账', category: 'finance' },
  'governance:view': { name: '查看治理', category: 'governance' },
  'governance:edit': { name: '治理配置', category: 'governance' },
  'audit:view': { name: '查看审计', category: 'audit' },
  'org:view': { name: '查看组织资料', category: 'org' },
  'org:edit': { name: '编辑组织资料', category: 'org' },
  'org:admin': { name: '管理员操作', category: 'org' },
  'org:delete': { name: '注销组织', category: 'org' },
  'settings:edit': { name: '组织设置', category: 'settings' },
  'automation:view': { name: '查看自动化', category: 'automation' },
  'automation:run': { name: '运行自动化规则', category: 'automation' },
};

// 内置角色权限矩阵
const BUILTIN_ROLES: Record<string, { name: string; permissions: string[]; dataScope: string }> = {
  org_admin: {
    name: '组织管理员',
    permissions: Object.keys(PERMISSION_CATALOG),
    dataScope: 'org',
  },
  chairman: {
    name: '会长',
    permissions: [
      'member:view', 'project:view', 'finance:view', 'governance:view',
      'audit:view', 'org:view', 'org:edit', 'notice:publish', 'automation:view',
    ],
    dataScope: 'org',
  },
  secretary_general: {
    name: '秘书长',
    permissions: [
      'member:view', 'member:edit', 'project:view', 'project:edit',
      'notice:publish', 'governance:view', 'org:view', 'automation:view',
    ],
    dataScope: 'org',
  },
  finance_lead: {
    name: '财务负责人',
    permissions: [
      'finance:view', 'finance:edit', 'finance:approve', 'finance:close',
      'audit:view', 'project:view',
    ],
    dataScope: 'finance',
  },
  director: {
    name: '理事',
    permissions: ['member:view', 'project:view', 'governance:view', 'finance:view'],
    dataScope: 'governance',
  },
  supervisor: {
    name: '监事',
    permissions: ['finance:view', 'audit:view', 'governance:view', 'member:view'],
    dataScope: 'governance',
  },
  secretariat: {
    name: '秘书处',
    permissions: [
      'member:view', 'member:edit', 'project:view', 'notice:publish',
      'governance:view', 'automation:run',
    ],
    dataScope: 'org',
  },
  member: {
    name: '普通成员',
    permissions: ['member:view', 'project:view'],
    dataScope: 'self',
  },
};

function parsePermissions(raw: string): string[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr.map((p) => String(p)) : [];
  } catch {
    return [];
  }
}

let myHandler = async function (event: any, context: any, callback: any, logger: any) {
  logger.info('get-my-permissions called');

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
    const membership = mine[0];

    // 角色解析：优先 roleId，回退旧二元 role
    let roleId = String(membership.roleId || '');
    if (!roleId) {
      roleId = membership.role === 'admin' ? 'org_admin' : 'member';
    }

    // 自定义角色覆盖（Role 表），否则使用内置矩阵
    const roleCol: CloudDBCollection<Role> = db.collection(Role);
    const roleRows = await roleCol.query().equalTo('id', `role_${orgId}_${roleId}`).get();
    let permissions: string[] = [];
    let roleName = '';
    let roleDataScope = 'org';
    if (roleRows.length > 0 && roleRows[0].status === 'active' && !roleRows[0].isDeleted) {
      const custom = roleRows[0];
      roleName = custom.name || roleId;
      permissions = parsePermissions(custom.permissions);
      roleDataScope = custom.dataScope || 'org';
    } else {
      const builtin = BUILTIN_ROLES[roleId] || BUILTIN_ROLES.member;
      roleName = builtin.name;
      permissions = [...builtin.permissions];
      roleDataScope = builtin.dataScope;
    }

    // 数据范围：用户级 DataScope 覆盖角色级
    const scopeCol: CloudDBCollection<DataScope> = db.collection(DataScope);
    const scopeRows = await scopeCol.query().equalTo('orgId', orgId).get();
    let dataScope = roleDataScope;
    const userScope = scopeRows.find(
      (s) => s.status === 'active' && s.userId === userId,
    );
    if (userScope) {
      dataScope = userScope.scopeType || dataScope;
    }

    callback({
      ret: {
        code: 0,
        message: 'ok',
        data: {
          roleId,
          roleName,
          permissions,
          dataScope,
          isAdmin: roleId === 'org_admin' || membership.role === 'admin',
          catalog: PERMISSION_CATALOG,
        },
      },
    });
  } catch (err: any) {
    logger.error(`get-my-permissions error: ${err.message}`);
    callback({ ret: { code: -1, message: err.message } });
  }
};

export { myHandler };
