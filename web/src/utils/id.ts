/**
 * 跨业务链路标识生成：requestId / correlationId / idempotencyKey。
 * 均基于 crypto.randomUUID()，保证全局唯一、不可预测。
 */

function uuid(): string {
  return crypto.randomUUID();
}

/** 单次 HTTP 请求标识（诊断日志用） */
export function newRequestId(): string {
  return `req_${uuid()}`;
}

/** 一次业务动作的关联键：事件→规则→动作→审计全链追踪 */
export function newCorrelationId(): string {
  return `c_${uuid()}`;
}

/** 高风险写操作的幂等键：同键重试服务端去重 */
export function newIdempotencyKey(action: string): string {
  return `idem_${action}_${uuid()}`;
}
