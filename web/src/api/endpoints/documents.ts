import { z } from 'zod';

import { documentSchema } from '@/api/schemas';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export type DocumentItem = z.infer<typeof documentSchema>;

export const DOCUMENT_DOMAINS = [
  'member',
  'project',
  'notice',
  'approval',
  'finance',
  'governance',
  'attachment',
  'other',
] as const;

export type DocumentDomain = (typeof DOCUMENT_DOMAINS)[number];

export const DOMAIN_LABELS: Record<DocumentDomain, string> = {
  member: '成员档案',
  project: '项目文件',
  notice: '公告附件',
  approval: '审批附件',
  finance: '财务凭证',
  governance: '治理文件',
  attachment: '通用附件',
  other: '其他',
};

export async function listDocuments(params: {
  domain?: string;
  refType?: string;
  refId?: string;
  status?: string;
  keyword?: string;
  onlyMine?: boolean;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ items: DocumentItem[]; total: number; dataScope: string; hasMore: boolean }> {
  const data = await apiRequest<unknown>('/documents', { method: 'POST', body: params });
  const parsed = z
    .object({
      items: z.array(documentSchema),
      total: z.number(),
      dataScope: z.string(),
      hasMore: z.boolean().optional(),
    })
    .parse(data);
  return { ...parsed, hasMore: parsed.hasMore ?? false };
}

export async function initFileUpload(input: {
  name: string;
  fileName: string;
  contentType: string;
  size: number;
  domain: DocumentDomain;
  refType?: string;
  refId?: string;
}): Promise<{
  documentId: string;
  uploadPath: string;
  code: string;
  domain: string;
  correlationId: string;
}> {
  const data = await apiRequest<unknown>('/documents/init', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('file_init'),
    correlationId: newCorrelationId(),
    body: input,
  });
  return z
    .object({
      documentId: z.string(),
      uploadPath: z.string(),
      code: z.string(),
      domain: z.string(),
      correlationId: z.string(),
    })
    .parse(data);
}

export async function commitFileUpload(input: {
  documentId: string;
  mode: 'proxy' | 'sdk';
  contentBase64?: string;
  checksum?: string;
  correlationId?: string;
}): Promise<{
  documentId: string;
  storagePath: string;
  status: string;
  size: number;
  correlationId: string;
}> {
  const data = await apiRequest<unknown>('/documents/commit', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('file_commit'),
    correlationId: input.correlationId ?? newCorrelationId(),
    body: input,
  });
  return z
    .object({
      documentId: z.string(),
      storagePath: z.string(),
      status: z.string(),
      size: z.number(),
      correlationId: z.string(),
    })
    .parse(data);
}

export async function getDocumentFile(
  documentId: string,
): Promise<{
  documentId: string;
  name: string;
  fileName: string;
  contentType: string;
  size: number;
  base64: string;
  correlationId: string;
}> {
  const data = await apiRequest<unknown>('/documents/download', {
    method: 'POST',
    body: { documentId },
  });
  return z
    .object({
      documentId: z.string(),
      name: z.string(),
      fileName: z.string(),
      contentType: z.string(),
      size: z.number(),
      base64: z.string(),
      correlationId: z.string(),
    })
    .parse(data);
}

export async function deleteDocument(
  documentId: string,
  reason = '',
): Promise<{ documentId: string; status: string }> {
  const data = await apiRequest<unknown>('/documents/delete', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('file_delete'),
    correlationId: newCorrelationId(),
    body: { documentId, reason },
  });
  return z
    .object({ documentId: z.string(), status: z.string() })
    .parse(data);
}

/** 代理下载：base64 → Blob → 浏览器保存 */
export function saveBase64File(
  file: { fileName: string; contentType: string; base64: string },
): void {
  const binary = atob(file.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: file.contentType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.fileName || 'download';
  a.click();
  URL.revokeObjectURL(url);
}
