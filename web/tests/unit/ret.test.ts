import { describe, expect, it } from 'vitest';

import { ApiError, ApiErrorCode } from '@/api/types';
import { unwrapRet } from '@/utils/ret';

describe('utils/ret', () => {
  it('解析嵌套 ret 信封', () => {
    const data = unwrapRet({ ret: { code: 0, data: { ok: true } } });
    expect(data).toEqual({ ok: true });
  });

  it('业务错误抛 ApiError', () => {
    expect(() =>
      unwrapRet({ ret: { code: -1, message: '余额不足' } }),
    ).toThrowError(new ApiError(ApiErrorCode.Business, '余额不足', -1));
  });
});
