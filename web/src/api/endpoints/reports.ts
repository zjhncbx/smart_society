import { reportDataSchema } from '@/api/schemas';
import { ReportData } from '@/models/contract';
import { apiRequest } from '../client';

/** 报表中心：聚合态势/风险/数据质量/项目/财务指标 */
export async function getReportData(): Promise<ReportData> {
  const data = await apiRequest<unknown>('/reports', { method: 'POST' });
  return reportDataSchema.parse(data);
}
