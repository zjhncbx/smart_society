import { permissionBundleSchema } from '@/api/schemas';
import { PermissionBundle } from '@/models/contract';
import { newCorrelationId } from '@/utils/id';
import { apiRequest } from '../client';

/**
 * 认证边界：Web 阶段的真实链路为
 * Access Token → API Gateway 认证上下文 → 内部 userId。
 * W0 先固化调用形态；网关联调后替换实现。
 */
export async function ensureIdentity(input: {
  provider: string;
  providerSubject: string;
  displayName?: string;
}): Promise<{ userId: string; personId?: string; isNew: boolean }> {
  return apiRequest('/identity/ensure', {
    method: 'POST',
    correlationId: newCorrelationId(),
    body: input,
  });
}

/** 获取当前用户在当前组织的角色/权限/数据范围（服务端权威） */
export async function getMyPermissions(): Promise<PermissionBundle> {
  const data = await apiRequest<unknown>('/permissions/mine', {
    method: 'POST',
  });
  return permissionBundleSchema.parse(data);
}
