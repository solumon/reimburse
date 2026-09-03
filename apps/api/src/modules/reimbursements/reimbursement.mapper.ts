import type {
  Attachment,
  AttachmentKind,
  AttachmentType,
  ReimbursementDetail,
  ReimbursementStatus,
  ReimbursementSummary,
} from '@reimburse/shared';

export interface ReimbursementSummaryRow {
  id: string;
  name: string;
  amount: number;
  note: string;
  status: ReimbursementStatus;
  createdAt: number;
  clockCount: number;
  voucherCount: number;
}

export interface ReimbursementAttachmentRow {
  id: number;
  kind: AttachmentKind;
  sortOrder: number;
  type: AttachmentType;
  originalName: string;
  mimeType: string;
  workDate: string;
  earliest: string;
  latest: string;
  hours: number | null;
}

export function mapSummary(
  row: ReimbursementSummaryRow,
  hasAudit: boolean,
): ReimbursementSummary {
  return {
    ...row,
    amount: Number(row.amount),
    clockCount: Number(row.clockCount),
    hasAudit,
    voucherCount: Number(row.voucherCount),
  };
}

export function mapDetail(
  row: ReimbursementSummaryRow,
  attachments: ReimbursementAttachmentRow[],
  hasAudit: boolean,
): ReimbursementDetail {
  return {
    ...mapSummary(row, hasAudit),
    attachments: attachments.map<Attachment>((attachment) => ({
      ...attachment,
      hours: attachment.hours === null ? null : Number(attachment.hours),
      url: `/api/v1/attachments/${attachment.id}/content`,
    })),
  };
}
