import { ApiError, ApiErrorCode, RetEnvelope } from '@/api/types';

/** 解析 { ret } 信封：code !== 0 抛业务错误 */
export function unwrapRet<T>(payload: RetEnvelope<unknown> | null | undefined): T {
  if (!payload) {
    throw new ApiError(ApiErrorCode.Parse, '服务端返回为空');
  }
  const ret = payload.ret ?? payload;
  if (typeof ret.code !== 'number') {
    throw new ApiError(ApiErrorCode.Parse, '服务端返回格式异常');
  }
  if (ret.code !== 0) {
    throw new ApiError(ApiErrorCode.Business, ret.message ?? '业务处理失败', ret.code);
  }
  return ret.data as T;
}

/** HTTP 状态码 → 统一错误码 */
export function mapHttpStatus(status: number): ApiErrorCode {
  switch (status) {
    case 401:
      return ApiErrorCode.Unauthorized;
    case 403:
      return ApiErrorCode.Forbidden;
    case 404:
      return ApiErrorCode.NotFound;
    case 409:
      return ApiErrorCode.Conflict;
    case 429:
      return ApiErrorCode.RateLimited;
    default:
      return status >= 500 ? ApiErrorCode.Server : ApiErrorCode.Business;
  }
}
