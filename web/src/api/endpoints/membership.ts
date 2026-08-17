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
  const data = await apiRequest<unknown>('/members', { method: 'POST', body: params });
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
    idempotencyKey: newIdempotencyKey('save_member'),
    correlationId: newCorrelationId(),
    body: member,
  });
  return memberSchema.parse(data);
}

export async function deleteMember(id: string): Promise<{ ok: boolean }> {
  return apiRequest('/members/delete', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('delete_member'),
    correlationId: newCorrelationId(),
    body: { id },
  });
}
