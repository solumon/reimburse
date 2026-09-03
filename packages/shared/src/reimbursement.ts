import type { Attachment, ClockMetadata } from './attachment.js';

export const REIMBURSEMENT_STATUSES = ['wait', 'done'] as const;
export const REIMBURSEMENT_AUDIT_STATUSES = ['通过', '不通过'] as const;

export type ReimbursementStatus = (typeof REIMBURSEMENT_STATUSES)[number];
export type ReimbursementAuditStatus = (typeof REIMBURSEMENT_AUDIT_STATUSES)[number];

export interface ReimbursementAuditTrip {
  shiftDate: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  taxiTime: string | null;
  amount: number;
  status: ReimbursementAuditStatus;
  invoiceNumber: string;
  invoiceDate: string;
}

export interface ReimbursementAudit {
  batchId: string;
  name: string;
  auditedAt: string;
  invoiceAmount: number;
  reimbursementAmount: number;
  trips: ReimbursementAuditTrip[];
  status: ReimbursementAuditStatus;
  rejectionReasons: string[];
}

export interface ReimbursementSummary {
  id: string;
  name: string;
  amount: number;
  note: string;
  status: ReimbursementStatus;
  createdAt: number;
  clockCount: number;
  voucherCount: number;
  hasAudit: boolean;
}

export interface ReimbursementDetail extends ReimbursementSummary {
  attachments: Attachment[];
}

export interface ReimbursementQuery {
  month?: string;
  name?: string;
  status?: ReimbursementStatus;
}

export interface CreateReimbursementFields {
  name: string;
  amount: number;
  note: string;
  clockMetadata: ClockMetadata[];
}

export interface CreateReimbursementResponse {
  record: ReimbursementSummary;
}
