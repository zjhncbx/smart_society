import { describe, expect, it } from 'vitest';

import { newCorrelationId, newIdempotencyKey, newRequestId } from '@/utils/id';

describe('utils/id', () => {
  it('生成唯一且带前缀的标识', () => {
    expect(newRequestId()).toMatch(/^req_/);
    expect(newCorrelationId()).toMatch(/^c_/);
    expect(newIdempotencyKey('submit_finance')).toMatch(/^idem_submit_finance_/);
  });

  it('多次生成不重复', () => {
    const ids = new Set(Array.from({ length: 100 }, () => newCorrelationId()));
    expect(ids.size).toBe(100);
  });
});
