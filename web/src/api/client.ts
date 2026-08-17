import { getAccessToken, clearSession, getCurrentOrgId } from '@/auth/session';
import { newRequestId } from '@/utils/id';
import { mapHttpStatus, unwrapRet } from '@/utils/ret';
import { ApiError, ApiErrorCode, RetEnvelope } from './types';

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  /** 显式组织上下文（默认取当前会话组织） */
  orgId?: string;
  /** 跨业务链路关联键：事件→规则→动作→审计 */
  correlationId?: string;
  /** 高风险写操作幂等键 */
  idempotencyKey?: string;
  timeoutMs?: number;
  body?: unknown;
}

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api';
const DEFAULT_TIMEOUT_MS: number = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 30000);

/**
 * 唯一 API Client：统一处理认证、orgId、requestId/correlationId/idempotencyKey、
 * 超时、{ ret } 业务错误、HTTP 错误与响应校验。
 * 业务页面禁止自行 fetch()。
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    orgId,
    correlationId,
    idempotencyKey,
    timeoutMs,
    headers,
    body,
    ...init
  } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const token = getAccessToken();
    const effectiveOrgId = orgId ?? getCurrentOrgId() ?? undefined;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': newRequestId(),
        ...(correlationId ? { 'X-Correlation-Id': correlationId } : {}),
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
        ...(effectiveOrgId ? { 'X-Org-Id': effectiveOrgId } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
      },
      body:
        body == null
          ? undefined
          : typeof body === 'string'
            ? body
            : JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.status === 401) {
      clearSession();
      throw new ApiError(ApiErrorCode.Unauthorized, '登录已过期，请重新登录', 401);
    }
    if (response.status === 403) {
      throw new ApiError(ApiErrorCode.Forbidden, '没有操作权限', 403);
    }

    const payload = (await response.json().catch(() => null)) as
      | RetEnvelope<unknown>
      | null;
    if (!response.ok) {
      const ret = payload?.ret ?? payload;
      throw new ApiError(
        mapHttpStatus(response.status),
        ret?.message ?? `请求失败（${response.status}）`,
        response.status,
      );
    }
    return unwrapRet<T>(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(ApiErrorCode.Timeout, '请求超时，请稍后重试');
    }
    throw new ApiError(ApiErrorCode.Network, '网络连接失败，请检查网络');
  } finally {
    clearTimeout(timer);
  }
}

/** 文件上传/下载（预留；Cloud Storage 联调后启用） */
export function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
