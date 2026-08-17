/** 云函数统一返回契约：{ ret: { code, message, data } } */
export interface RetEnvelope<T> {
  ret?: {
    code: number;
    message?: string;
    data?: T;
  };
  code?: number;
  message?: string;
  data?: T;
}

export enum ApiErrorCode {
  Network = 'NETWORK_ERROR',
  Timeout = 'TIMEOUT',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  RateLimited = 'RATE_LIMITED',
  Business = 'BUSINESS_ERROR',
  Server = 'SERVER_ERROR',
  Parse = 'PARSE_ERROR',
}

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 服务端分页契约 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
