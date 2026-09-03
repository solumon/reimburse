import type { AttachmentKind, ReimbursementDetail } from '@reimburse/shared';

import { downloadBlob } from '@/shared/utils/download';
import { safeFilename } from '@/shared/utils/format';

import { exportFilename, extensionFromMime, fetchAttachment } from './export-utils';

export async function exportAttachmentZip(
  records: ReimbursementDetail[],
  kind: AttachmentKind,
): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const record of records) {
    const folder = zip.folder(safeFilename(record.name));
    const attachments = record.attachments.filter((item) => item.kind === kind);
    for (const [index, attachment] of attachments.entries()) {
      const blob = await fetchAttachment(attachment.url);
      const extension = extensionFromMime(attachment.mimeType);
      folder?.file(`${kind}-${String(index + 1).padStart(3, '0')}.${extension}`, blob);
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, exportFilename(kind === 'clock' ? '打卡截图' : '发票行程单', 'zip'));
}
