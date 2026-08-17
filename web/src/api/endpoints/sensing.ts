import { orgPostureSchema } from '@/api/schemas';
import { OrgPosture } from '@/models/contract';
import { apiRequest } from '../client';

/** 组织态势（W1）：状态 + 计数 + 最值得关注 */
export async function getPosture(): Promise<OrgPosture> {
  const data = await apiRequest<unknown>('/sensing/posture', { method: 'POST' });
  return orgPostureSchema.parse(data);
}
