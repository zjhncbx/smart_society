import { describe, expect, it } from 'vitest';

import { toCsv } from '@/utils/exportCsv';

describe('utils/exportCsv', () => {
  it('生成带 BOM 的 CSV，并对含逗号/引号字段转义', () => {
    const csv = toCsv(['姓名', '备注'], [['张三', '含,逗号'], ['李四', '说"你好"']]);
    expect(csv.startsWith('\ufeff')).toBe(true);
    expect(csv).toContain('"含,逗号"');
    expect(csv).toContain('"说""你好"""');
    expect(csv).toContain('\r\n');
  });
});
