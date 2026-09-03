import type { Attachment, ClockMetadata } from './attachment.js';

export const REIMBURSEMENT_STATUSES = ['wait', 'done'] as const;

export type ReimbursementStatus = (typeof REIMBURSEMENT_STATUSES)[number];

export interface ReimbursementSummary {
  id: string;
  name: string;
  amount: number;
  note: string;
  status: ReimbursementStatus;
  createdAt: number;
  clockCount: number;
  voucherCount: number;
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
