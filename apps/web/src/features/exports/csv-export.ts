import type { ReimbursementSummary } from '@reimburse/shared';

import { downloadBlob } from '@/shared/utils/download';

import { exportFilename } from './export-utils';

function cell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function exportCsv(records: ReimbursementSummary[]): void {
  const rows = [
    ['记录编号', '提交时间', '姓名', '金额', '备注', '打卡数', '凭证数', '状态'],
    ...records.map((record) => [
      record.id,
      new Date(record.createdAt).toLocaleString('zh-CN'),
      record.name,
      record.amount.toFixed(2),
      record.note,
      record.clockCount,
      record.voucherCount,
      record.status === 'done' ? '已报销' : '待报销',
    ]),
  ];
  const content = `\ufeff${rows.map((row) => row.map(cell).join(',')).join('\r\n')}`;
  downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), exportFilename('报销汇总', 'csv'));
}
