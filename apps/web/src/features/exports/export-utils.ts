import type { ReimbursementDetail } from '@reimburse/shared';

import { reimbursementApi } from '@/features/reimbursements/reimbursement.api';
import { safeFilename } from '@/shared/utils/format';

export async function loadDetails(ids: string[]): Promise<ReimbursementDetail[]> {
  return Promise.all(ids.map((id) => reimbursementApi.detail(id)));
}

export async function fetchAttachment(url: string): Promise<Blob> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) throw new Error(`附件下载失败（${response.status}）`);
  return response.blob();
}

export function exportFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${safeFilename(prefix)}-${date}.${extension}`;
}

export function extensionFromMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return extensions[mimeType] ?? 'bin';
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}
