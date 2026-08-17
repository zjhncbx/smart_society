import { z } from 'zod';

import { automationRunLogSchema } from '@/api/schemas';
import { AutomationRunLog } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export async function getAutomation(): Promise<{
  logs: AutomationRunLog[];
  counts: { todayRuns: number; successRate: number; failed: number; retries: number; blocked: number };
}> {
  const data = await apiRequest<unknown>('/automation', { method: 'POST' });
  const parsed = z
    .object({
      logs: z.array(automationRunLogSchema),
      counts: z.object({
        todayRuns: z.number(),
        successRate: z.number(),
        failed: z.number(),
        retries: z.number(),
        blocked: z.number(),
      }),
    })
    .parse(data);
  return parsed;
}

export async function runRules(): Promise<{
  taskCreated: number;
  riskCreated: number;
  durationMs: number;
}> {
  return apiRequest('/automation/run', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('run_rules'),
    correlationId: newCorrelationId(),
  });
}
