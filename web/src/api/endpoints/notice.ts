import { z } from 'zod';

import { noticeSchema } from '@/api/schemas';
import { NoticeItem } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

/**
 * 公告列表：agc 模式复用 get-all-data（data.Notice 数组）；
 * Mock 模式 /notices 返回 { notices: [...] }，两种形状兼容解析。
 */
export async function getNotices(): Promise<NoticeItem[]> {
  const data = await apiRequest<unknown>('/notices', {
    method: 'POST',
    functionName: 'get-all-data',
    body: {},
  });
  const parsed = z
    .object({
      Notice: z.array(noticeSchema).optional(),
      notices: z.array(noticeSchema).optional(),
    })
    .parse(data);
  const notices = parsed.notices ?? parsed.Notice ?? [];
  // 时间倒序（新公告在前）
  return [...notices].sort((a, b) => (a.publishTime < b.publishTime ? 1 : -1));
}

export interface UpsertNoticePayload {
  /** 编辑时传原 id；新建由客户端生成 */
  id?: string;
  title: string;
  content: string;
  publisher: string;
  /** ISO 时间字符串 */
  publishTime: string;
  isImportant: boolean;
  status?: string;
}

/**
 * 发布/编辑公告（upsert-notice 契约：record 即参数本体，
 * id/orgId/userId 必填——orgId/userId 由 AGC client 自动合并，幂等键强制）。
 * 云侧成功返回 code:0 无 data。
 */
export async function upsertNotice(payload: UpsertNoticePayload): Promise<void> {
  await apiRequest('/notices/save', {
    method: 'POST',
    functionName: 'upsert-notice',
    idempotencyKey: newIdempotencyKey('upsert_notice'),
    correlationId: newCorrelationId(),
    body: {
      id: payload.id ?? `n_${Date.now()}`,
      title: payload.title,
      content: payload.content,
      publisher: payload.publisher,
      publishTime: payload.publishTime,
      isImportant: payload.isImportant,
      status: payload.status ?? 'active',
      sourceType: 'manual',
    },
  });
}

/** 删除公告（delete-notice 契约：参数 {id, orgId, userId}，成功无 data） */
export async function deleteNotice(id: string): Promise<void> {
  await apiRequest('/notices/delete', {
    method: 'POST',
    functionName: 'delete-notice',
    idempotencyKey: newIdempotencyKey('delete_notice'),
    correlationId: newCorrelationId(),
    body: { id },
  });
}
