import { z } from 'zod';

import { automationRunLogSchema } from '@/api/schemas';
import { AutomationRunLog } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

/** 云侧 actions 为 JSON 字符串，统一解析为动作计数对象 */
function parseActions(raw: unknown): Record<string, number> {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, number>;
  }
  if (typeof raw === 'string' && raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, number>;
      }
    } catch {
      // 保持兜底
    }
  }
  return {};
}

/** 自动化运行日志（云函数 get-automation-logs 契约：分页 + total/hasMore） */
export async function getAutomation(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<{
  logs: AutomationRunLog[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}> {
  const data = await apiRequest<unknown>('/automation', {
    method: 'POST',
    functionName: 'get-automation-logs',
    body: params,
  });
  const parsed = z
    .object({
      logs: z.array(z.unknown()),
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      hasMore: z.boolean(),
    })
    .parse(data);
  const logs = parsed.logs.map((raw) => {
    const row = z
      .object({ actions: z.unknown() })
      .passthrough()
      .parse(raw);
    return automationRunLogSchema.parse({ ...row, actions: parseActions(row.actions) });
  });
  return { ...parsed, logs };
}

/** 手动触发规则引擎（云函数 run-governance-rules，幂等键强制） */
export async function runRules(): Promise<{
  taskCreated: number;
  riskCreated: number;
  durationMs: number;
}> {
  return apiRequest('/automation/run', {
    method: 'POST',
    functionName: 'run-governance-rules',
    idempotencyKey: newIdempotencyKey('run_rules'),
    correlationId: newCorrelationId(),
  });
}
