import { z } from 'zod';

import { permissionBundleSchema } from '@/api/schemas';
import { PermissionBundle } from '@/models/contract';
import { apiRequest } from '../api/client';
import { SessionOrg } from './session';

/** login-user 云函数返回的用户身份 */
export interface LoginUserResult {
  userId: string;
  displayName?: string;
  phone?: string;
  email?: string;
}

const myOrgSchema = z.object({
  orgId: z.string(),
  name: z.string(),
  role: z.string(),
  userRole: z.string().optional(),
});

/**
 * 真实认证链（全部为已部署云函数）：
 * login-user（账号+密码 → 内部 userId）→ get-my-orgs（组织列表）→ get-my-permissions（角色/权限）。
 * Mock 模式下由 dev-api 中间件提供同名契约路由。
 */

/** 第 1 步：账号密码登录，换取内部 userId */
export async function login(account: string, password: string): Promise<LoginUserResult> {
  return apiRequest<LoginUserResult>('/auth/login', {
    method: 'POST',
    functionName: 'login-user',
    body: { account, password },
  });
}

/** 第 2 步：拉取当前用户所属组织列表（组织切换器数据源） */
export async function fetchMyOrgs(userId: string): Promise<SessionOrg[]> {
  const data = await apiRequest<unknown>('/orgs/mine', {
    method: 'POST',
    functionName: 'get-my-orgs',
    body: { userId },
  });
  const rows = z.array(z.record(z.string(), z.unknown())).parse(data);
  return rows
    .map((row) =>
      myOrgSchema.safeParse({
        orgId: row.orgId,
        name: row.name,
        role: row.userRole ?? row.role ?? 'member',
      }),
    )
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data);
}

/** 第 3 步：拉取当前用户在指定组织的角色/权限/数据范围 */
export async function fetchMyPermissions(orgId: string): Promise<PermissionBundle> {
  const data = await apiRequest<unknown>('/permissions/mine', {
    method: 'POST',
    functionName: 'get-my-permissions',
    body: { orgId },
  });
  return permissionBundleSchema.parse(data);
}

/** 完整认证链结果（登录成功后按序调用，默认进入第一个组织） */
export interface LoginChainResult {
  user: LoginUserResult;
  orgs: SessionOrg[];
  /** 默认组织（orgs[0]）的权限包；无组织时为 null */
  permission: PermissionBundle | null;
}

/** 按序执行 login-user → get-my-orgs → get-my-permissions */
export async function loginWithChain(
  account: string,
  password: string,
): Promise<LoginChainResult> {
  const user = await login(account, password);
  const orgs = await fetchMyOrgs(user.userId);
  const permission = orgs.length > 0 ? await fetchMyPermissions(orgs[0].orgId) : null;
  return { user, orgs, permission };
}
