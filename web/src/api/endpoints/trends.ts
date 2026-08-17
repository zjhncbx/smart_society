import { trendStatsSchema } from '@/api/schemas';
import { TrendStats } from '@/models/contract';
import { apiRequest } from '../client';

/** 变化感知趋势：近 7 天事件/风险/自动化/审批时长 + 异常判断 */
export async function getTrendStats(): Promise<TrendStats> {
  const data = await apiRequest<unknown>('/trends', { method: 'POST' });
  return trendStatsSchema.parse(data);
}
