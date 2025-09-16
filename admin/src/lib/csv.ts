"use client";

export function toCsv(rows: any[], columns?: string[]): string {
  if (!rows || rows.length === 0) return '';
  const keys = columns && columns.length ? columns : Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    if (/[",\n]/.test(s)) return `"${s}"`;
    return s;
  };
  const lines = [keys.join(',')];
  for (const r of rows) {
    lines.push(keys.map(k => escape(r[k])).join(','));
  }
  return lines.join('\n');
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
