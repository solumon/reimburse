import type { ReimbursementDetail } from '@reimburse/shared';

import { downloadBlob } from '@/shared/utils/download';
import { safeFilename } from '@/shared/utils/format';

import { exportFilename, fetchAttachment } from './export-utils';

export async function exportClockWord(records: ReimbursementDetail[]): Promise<void> {
  const { Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } = await import('docx');
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const record of records) {
    const children: import('docx').Paragraph[] = [
      new Paragraph({ heading: HeadingLevel.TITLE, text: `${record.name}·加班打卡截图` }),
      new Paragraph({ children: [new TextRun(`报销金额：¥${record.amount.toFixed(2)}；备注：${record.note}`)] }),
    ];
    for (const clock of record.attachments.filter((item) => item.kind === 'clock' && item.type === 'img')) {
      const bytes = new Uint8Array(await (await fetchAttachment(clock.url)).arrayBuffer());
      children.push(new Paragraph({ text: `${clock.workDate} ${clock.earliest}-${clock.latest} ${clock.hours ?? ''}小时` }));
      children.push(new Paragraph({ children: [new ImageRun({
        data: bytes,
        transformation: { height: 450, width: 600 },
        type: clock.mimeType === 'image/png' ? 'png' : 'jpg',
      })] }));
    }
    const document = new Document({ sections: [{ children }] });
    zip.file(`${safeFilename(record.name)}.docx`, await Packer.toBlob(document));
  }
  downloadBlob(await zip.generateAsync({ type: 'blob' }), exportFilename('全员加班截图', 'zip'));
}
