import { z } from 'zod';

import { paginatedSchema, workItemSchema } from '@/api/schemas';
import { WorkItem } from '@/models/contract';
import { newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export interface WorkItemListParams {
  workItemType?: string;
  status?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
}

/** 统一工作项查询（服务端执行 DataScope 过滤与分页） */
export async function getWorkItems(params: WorkItemListParams = {}): Promise<{
  items: WorkItem[];
  total: number;
  openCount: number;
  dataScope: string;
  hasMore: boolean;
}> {
  const data = await apiRequest<unknown>('/work-items', {
    method: 'POST',
    body: params,
  });
  const parsed = paginatedSchema(workItemSchema).extend({
    openCount: z.number(),
    dataScope: z.string(),
  });
  const result = parsed.parse(data);
  return {
    items: result.items,
    total: result.total,
    openCount: result.openCount,
    dataScope: result.dataScope,
    hasMore: result.hasMore ?? false,
  };
}

/** 从来源业务重新物化工作项视图 */
export async function refreshWorkItems(): Promise<{ upserted: number; autoClosed: number }> {
  return apiRequest('/work-items/refresh', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('refresh_work_items'),
  });
}

/** 处理工作项（自动任务/风险/数据治理同步来源；审批与项目任务跳转来源系统） */
export async function actWorkItem(input: {
  workItemId: string;
  action: 'done' | 'cancel' | 'reopen';
  correlationId: string;
}): Promise<{ id: string; status: string }> {
  return apiRequest('/work-items/act', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('act_work_item'),
    correlationId: input.correlationId,
    body: { id: input.workItemId, action: input.action },
  });
}
