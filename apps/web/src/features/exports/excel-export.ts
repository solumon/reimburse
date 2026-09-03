import type { ReimbursementDetail } from '@reimburse/shared';

import { downloadBlob } from '@/shared/utils/download';

import { exportFilename, fetchAttachment } from './export-utils';

async function saveWorkbook(workbook: import('exceljs').Workbook, name: string): Promise<void> {
  const bytes = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), exportFilename(name, 'xlsx'));
}

function styleHeader(row: import('exceljs').Row): void {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { pattern: 'solid', type: 'pattern', fgColor: { argb: 'FF4F46E5' } };
  row.alignment = { horizontal: 'center', vertical: 'middle' };
}

export async function exportReimbursementWorkbook(records: ReimbursementDetail[]): Promise<void> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('报销单');
  sheet.columns = [
    { header: '姓名', key: 'name', width: 16 },
    { header: '提交日期', key: 'date', width: 22 },
    { header: '报销事由', key: 'note', width: 48 },
    { header: '金额（元）', key: 'amount', width: 16 },
    { header: '状态', key: 'status', width: 14 },
  ];
  records.forEach((record) => sheet.addRow({
    amount: record.amount,
    date: new Date(record.createdAt).toLocaleString('zh-CN'),
    name: record.name,
    note: record.note,
    status: record.status === 'done' ? '已报销' : '待报销',
  }));
  styleHeader(sheet.getRow(1));
  sheet.getColumn('amount').numFmt = '¥0.00';
  await saveWorkbook(workbook, '报销单');
}

export async function exportDetailWorkbook(records: ReimbursementDetail[]): Promise<void> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('个人明细');
  sheet.addRow(['姓名', '打卡日期', '最早时间', '最晚时间', '工时', '报销金额', '备注']);
  records.forEach((record) => {
    const clocks = record.attachments.filter((item) => item.kind === 'clock');
    clocks.forEach((clock, index) => sheet.addRow([
      record.name,
      clock.workDate,
      clock.earliest,
      clock.latest,
      clock.hours,
      index === 0 ? record.amount : '',
      index === 0 ? record.note : '',
    ]));
  });
  styleHeader(sheet.getRow(1));
  sheet.columns.forEach((column) => { column.width = 20; });
  await saveWorkbook(workbook, '个人报销明细');
}

export async function exportVoucherWorkbook(records: ReimbursementDetail[]): Promise<void> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('票据凭证');
  sheet.addRow(['姓名', '记录编号', '附件名', '类型']);
  for (const record of records) {
    for (const attachment of record.attachments.filter((item) => item.kind === 'voucher')) {
      sheet.addRow([record.name, record.id, attachment.originalName, attachment.mimeType]);
      if (attachment.type === 'img') {
        const blob = await fetchAttachment(attachment.url);
        const bytes = await blob.arrayBuffer();
        const extension = attachment.mimeType === 'image/png' ? 'png' : 'jpeg';
        const imageId = workbook.addImage({ buffer: bytes, extension });
        const row = sheet.rowCount;
        sheet.addImage(imageId, { tl: { col: 4, row: row - 1 }, ext: { width: 160, height: 100 } });
        sheet.getRow(row).height = 80;
      }
    }
  }
  styleHeader(sheet.getRow(1));
  sheet.columns.forEach((column) => { column.width = 24; });
  await saveWorkbook(workbook, '票据凭证');
}
