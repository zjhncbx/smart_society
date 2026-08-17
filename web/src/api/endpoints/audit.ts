import { z } from 'zod';

import { auditLogSchema } from '@/api/schemas';
import { AuditLog, BusinessEvent } from '@/models/contract';
import { apiRequest } from '../client';

export interface AuditLogParams {
  entityType?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}

export async function getAuditLogs(
  params: AuditLogParams = {},
): Promise<{ logs: AuditLog[]; total: number; hasMore: boolean }> {
  const data = await apiRequest<unknown>('/audit/logs', { method: 'POST', body: params });
  const parsed = z
    .object({
      logs: z.array(auditLogSchema),
      total: z.number(),
      hasMore: z.boolean().optional(),
    })
    .parse(data);
  return { ...parsed, hasMore: parsed.hasMore ?? false };
}

const businessEventSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  eventType: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityName: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  level: z.enum(['info', 'warning', 'risk']),
  correlationId: z.string(),
  occurredAt: z.string(),
});

export async function getEvents(params: {
  entityType?: string;
  level?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ events: BusinessEvent[]; total: number; hasMore: boolean }> {
  const data = await apiRequest<unknown>('/events', { method: 'POST', body: params });
  const parsed = z
    .object({
      events: z.array(businessEventSchema),
      total: z.number(),
      hasMore: z.boolean().optional(),
    })
    .parse(data);
  return { ...parsed, hasMore: parsed.hasMore ?? false };
}
