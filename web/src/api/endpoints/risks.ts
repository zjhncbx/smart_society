import { z } from 'zod';

import { riskAlertSchema } from '@/api/schemas';
import { RiskAlert } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export async function getRisks(params: {
  kind?: 'risk' | 'warning';
  status?: string;
} = {}): Promise<{ risks: RiskAlert[]; riskCount: number; warningCount: number }> {
  const data = await apiRequest<unknown>('/risks', { method: 'POST', body: params });
  const parsed = z
    .object({
      risks: z.array(riskAlertSchema),
      riskCount: z.number(),
      warningCount: z.number(),
    })
    .parse(data);
  return parsed;
}

export async function actRisk(
  id: string,
  action: 'resolve' | 'ack' | 'reopen',
): Promise<{ id: string; status: string }> {
  return apiRequest('/risks/act', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('act_risk'),
    correlationId: newCorrelationId(),
    body: { id, action },
  });
}
