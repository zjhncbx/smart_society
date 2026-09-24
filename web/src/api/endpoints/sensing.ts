import { orgPostureSchema } from '@/api/schemas';
import { OrgPosture } from '@/models/contract';
import { apiRequest } from '../client';

/** 组织态势（W1）：状态 + 计数 + 最值得关注 */
export async function getPosture(): Promise<OrgPosture> {
  // 云侧无独立态势函数：agc 模式复用治理中心数据（任务/风险）客户端汇总（后续批次细分）
  const data = await apiRequest<unknown>('/sensing/posture', {
    method: 'POST',
    functionName: 'get-governance-center',
  });
  return orgPostureSchema.parse(data);
}
