import { z } from 'zod';

import { orgSettingsSchema, roleSchema, userSettingsSchema } from '@/api/schemas';
import { OrgSettings, RoleDef, UserSettings } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

/** 组织设置（云函数 get-org-settings / save-org-settings；保存仅 admin） */
export interface SaveOrgSettingsPayload {
  themeIndex: number;
  roleLabels: Record<string, string>;
  dingtalkClientId: string;
  dingtalkClientSecret: string;
}

export async function getOrgSettings(): Promise<OrgSettings> {
  const data = await apiRequest<unknown>('/settings/org', {
    method: 'POST',
    functionName: 'get-org-settings',
  });
  return orgSettingsSchema.parse(data);
}

export async function saveOrgSettings(payload: SaveOrgSettingsPayload): Promise<void> {
  await apiRequest<unknown>('/settings/org/save', {
    method: 'POST',
    functionName: 'save-org-settings',
    idempotencyKey: newIdempotencyKey('save_org_settings'),
    correlationId: newCorrelationId(),
    body: payload,
  });
}

/** 角色权限（云函数 get-roles / save-role；保存仅 admin） */
export interface SaveRolePayload {
  roleId: string;
  name: string;
  permissions: string[];
  dataScope: string;
}

export async function getRoles(): Promise<{ roles: RoleDef[]; builtins: string[] }> {
  const data = await apiRequest<unknown>('/settings/roles', {
    method: 'POST',
    functionName: 'get-roles',
  });
  return z
    .object({ roles: z.array(roleSchema), builtins: z.array(z.string()) })
    .parse(data);
}

export async function saveRole(payload: SaveRolePayload): Promise<{ id: string }> {
  return apiRequest('/settings/roles/save', {
    method: 'POST',
    functionName: 'save-role',
    idempotencyKey: newIdempotencyKey('save_role'),
    correlationId: newCorrelationId(),
    body: payload,
  });
}

/** 用户偏好（云函数 get-user-settings / save-user-settings，按 userId 存储） */
export interface SaveUserSettingsPayload {
  nickname: string;
  darkMode: boolean;
}

export async function getUserSettings(): Promise<UserSettings> {
  const data = await apiRequest<unknown>('/settings/user', {
    method: 'POST',
    functionName: 'get-user-settings',
  });
  return userSettingsSchema.parse(data);
}

export async function saveUserSettings(payload: SaveUserSettingsPayload): Promise<void> {
  await apiRequest<unknown>('/settings/user/save', {
    method: 'POST',
    functionName: 'save-user-settings',
    idempotencyKey: newIdempotencyKey('save_user_settings'),
    correlationId: newCorrelationId(),
    body: payload,
  });
}
