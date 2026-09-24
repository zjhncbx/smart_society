import { z } from 'zod';

import { memberSchema } from '@/api/schemas';
import { Member } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export async function getMembers(params: {
  keyword?: string;
  roleId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ members: Member[]; total: number; hasMore: boolean }> {
  // 云侧暂无独立成员列表函数：agc 模式复用 get-all-data 全量数据接口（后续批次细分）
  const data = await apiRequest<unknown>('/members', {
    method: 'POST',
    functionName: 'get-all-data',
    body: params,
  });
  const parsed = z
    .object({
      members: z.array(memberSchema),
      total: z.number(),
      hasMore: z.boolean().optional(),
    })
    .parse(data);
  return { ...parsed, hasMore: parsed.hasMore ?? false };
}

export async function saveMember(
  member: Partial<Member> & { id?: string },
): Promise<Member> {
  const data = await apiRequest<unknown>('/members/save', {
    method: 'POST',
    functionName: 'upsert-member',
    idempotencyKey: newIdempotencyKey('save_member'),
    correlationId: newCorrelationId(),
    body: member,
  });
  return memberSchema.parse(data);
}

export async function deleteMember(id: string): Promise<{ ok: boolean }> {
  return apiRequest('/members/delete', {
    method: 'POST',
    functionName: 'delete-member',
    idempotencyKey: newIdempotencyKey('delete_member'),
    correlationId: newCorrelationId(),
    body: { id },
  });
}
