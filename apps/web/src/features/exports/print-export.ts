import type { ReimbursementDetail } from '@reimburse/shared';

import { escapeHtml } from './export-utils';

export function printReimbursements(records: ReimbursementDetail[]): void {
  const content = records.map((record) => `
    <section class="sheet">
      <h1>日常零星报销单</h1>
      <table>
        <tr><th>姓名</th><td>${escapeHtml(record.name)}</td><th>金额</th><td>¥${record.amount.toFixed(2)}</td></tr>
        <tr><th>提交时间</th><td colspan="3">${new Date(record.createdAt).toLocaleString('zh-CN')}</td></tr>
        <tr><th>报销事由</th><td colspan="3">${escapeHtml(record.note)}</td></tr>
      </table>
    </section>
  `).join('');
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) throw new Error('打印窗口被浏览器拦截');
  popup.document.write(`<!doctype html><html><head><title>报销单</title><style>
    body{font-family:"Microsoft YaHei",sans-serif;color:#111;padding:24px}.sheet{page-break-after:always}h1{text-align:center}
    table{width:100%;border-collapse:collapse}th,td{padding:12px;border:1px solid #333;text-align:left}th{width:120px;background:#f3f4f6}
    @media print{body{padding:0}.sheet:last-child{page-break-after:auto}}
  </style></head><body>${content}</body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}
