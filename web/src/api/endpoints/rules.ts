import { z } from 'zod';

import { ruleSchema } from '@/api/schemas';
import { Rule } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export async function getRules(): Promise<{ rules: Rule[] }> {
  const data = await apiRequest<unknown>('/rules', { method: 'POST' });
  return z.object({ rules: z.array(ruleSchema) }).parse(data);
}

export async function toggleRule(
  id: string,
  enabled: boolean,
): Promise<{ id: string; enabled: boolean }> {
  return apiRequest('/rules/toggle', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('toggle_rule'),
    correlationId: newCorrelationId(),
    body: { id, enabled },
  });
}
