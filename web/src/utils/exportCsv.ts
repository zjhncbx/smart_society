/** 生成 CSV 文本（含 BOM，兼容 Excel 中文） */
export function toCsv(
  headers: string[],
  rows: Array<Array<string | number>>,
): string {
  const escape = (v: string | number): string => {
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers, ...rows].map((row) => row.map(escape).join(','));
  return `\ufeff${lines.join('\r\n')}`;
}

/** 浏览器端导出 CSV 文件 */
export function exportCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): void {
  const blob = new Blob([toCsv(headers, rows)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
