import { z } from 'zod';

import { financeRecordSchema, financeStatsSchema } from '@/api/schemas';
import { FinanceRecord, FinanceStats } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export async function getFinanceRecords(params: {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ records: FinanceRecord[]; total: number; hasMore: boolean }> {
  const data = await apiRequest<unknown>('/finance/records', { method: 'POST', body: params });
  const parsed = z
    .object({
      records: z.array(financeRecordSchema),
      total: z.number(),
      hasMore: z.boolean().optional(),
    })
    .parse(data);
  return { ...parsed, hasMore: parsed.hasMore ?? false };
}

export async function getFinanceStats(): Promise<FinanceStats> {
  const data = await apiRequest<unknown>('/finance/stats', { method: 'POST' });
  return financeStatsSchema.parse(data);
}

export async function submitFinanceRecord(input: {
  type: 'income' | 'expense' | 'voucher';
  amount: number;
  categoryLabel: string;
  summary: string;
  counterparty?: string;
  projectId?: string;
  date: string;
}): Promise<{ recordId: string; status: string }> {
  return apiRequest('/finance/submit', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('submit_finance'),
    correlationId: newCorrelationId(),
    body: input,
  });
}
