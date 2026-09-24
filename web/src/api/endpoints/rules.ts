import { z } from 'zod';

import { ruleSchema } from '@/api/schemas';
import { Rule } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

/** 治理规则列表（云函数 get-rule-config：GR-01~12 静态定义 + 组织级启停状态） */
export async function getRules(): Promise<{ rules: Rule[] }> {
  const data = await apiRequest<unknown>('/rules', {
    method: 'POST',
    functionName: 'get-rule-config',
  });
  return z.object({ rules: z.array(ruleSchema) }).parse(data);
}

/** 规则启停（云函数 set-rule-enabled：仅 admin，入参 ruleId，幂等键强制） */
export async function toggleRule(
  ruleId: string,
  enabled: boolean,
): Promise<{ id: string; enabled: boolean }> {
  return apiRequest('/rules/toggle', {
    method: 'POST',
    functionName: 'set-rule-enabled',
    idempotencyKey: newIdempotencyKey('set_rule_enabled'),
    correlationId: newCorrelationId(),
    body: { ruleId, enabled },
  });
}
