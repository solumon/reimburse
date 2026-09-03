export const ATTACHMENT_KINDS = ['clock', 'voucher'] as const;
export const ATTACHMENT_TYPES = ['img', 'pdf'] as const;

export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

export interface ClockMetadata {
  workDate: string;
  earliest: string;
  latest: string;
  hours: number | null;
}

export interface Attachment {
  id: number;
  kind: AttachmentKind;
  sortOrder: number;
  type: AttachmentType;
  originalName: string;
  mimeType: string;
  url: string;
  workDate: string;
  earliest: string;
  latest: string;
  hours: number | null;
}
