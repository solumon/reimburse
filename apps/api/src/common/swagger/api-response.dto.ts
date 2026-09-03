import { ApiProperty } from '@nestjs/swagger';

import {
  ATTACHMENT_KINDS,
  ATTACHMENT_TYPES,
  REIMBURSEMENT_AUDIT_STATUSES,
  REIMBURSEMENT_STATUSES,
} from '@reimburse/shared';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [
      { type: 'string' },
      { items: { type: 'string' }, type: 'array' },
    ],
  })
  message!: string | string[];

  @ApiProperty({ example: '/api/v1/reimbursements' })
  path!: string;

  @ApiProperty({ example: '34f90552-c794-4bf7-98d2-13b528520ca4' })
  requestId!: string;

  @ApiProperty({ example: '2026-09-02T08:00:00.000Z', format: 'date-time' })
  timestamp!: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'up' })
  database!: 'up';

  @ApiProperty({ example: 'up' })
  service!: 'up';

  @ApiProperty({ example: '2026-09-02T08:00:00.000Z', format: 'date-time' })
  timestamp!: string;
}

export class AuthSessionResponseDto {
  @ApiProperty({ example: true })
  authenticated!: boolean;
}

export class ReimbursementSummaryResponseDto {
  @ApiProperty({ example: '0123456789abcdef0123456789abcdef' })
  id!: string;

  @ApiProperty({ example: '张三' })
  name!: string;

  @ApiProperty({ example: 128.5 })
  amount!: number;

  @ApiProperty({ example: '项目紧急上线' })
  note!: string;

  @ApiProperty({ enum: REIMBURSEMENT_STATUSES, example: 'wait' })
  status!: (typeof REIMBURSEMENT_STATUSES)[number];

  @ApiProperty({ example: 1788336000000 })
  createdAt!: number;

  @ApiProperty({ example: 2 })
  clockCount!: number;

  @ApiProperty({ example: 1 })
  voucherCount!: number;

  @ApiProperty({ example: true })
  hasAudit!: boolean;
}

export class ReimbursementAuditTripResponseDto {
  @ApiProperty({ example: '2026-08-25' })
  shiftDate!: string;

  @ApiProperty({ example: '09:28', nullable: true })
  clockInTime!: string | null;

  @ApiProperty({ example: '次日 01:00', nullable: true })
  clockOutTime!: string | null;

  @ApiProperty({ example: '01:00', nullable: true })
  taxiTime!: string | null;

  @ApiProperty({ example: 51 })
  amount!: number;

  @ApiProperty({ enum: REIMBURSEMENT_AUDIT_STATUSES, example: '通过' })
  status!: (typeof REIMBURSEMENT_AUDIT_STATUSES)[number];

  @ApiProperty({ example: '26117000001167600148' })
  invoiceNumber!: string;

  @ApiProperty({ example: '2026-08-03' })
  invoiceDate!: string;
}

export class ReimbursementAuditResponseDto {
  @ApiProperty({ example: '0123456789abcdef0123456789abcdef' })
  batchId!: string;

  @ApiProperty({ example: '张三' })
  name!: string;

  @ApiProperty({ example: '2026-09-03 12:14:26' })
  auditedAt!: string;

  @ApiProperty({ example: 109.9 })
  invoiceAmount!: number;

  @ApiProperty({ example: 109.9 })
  reimbursementAmount!: number;

  @ApiProperty({ isArray: true, type: () => ReimbursementAuditTripResponseDto })
  trips!: ReimbursementAuditTripResponseDto[];

  @ApiProperty({ enum: REIMBURSEMENT_AUDIT_STATUSES, example: '不通过' })
  status!: (typeof REIMBURSEMENT_AUDIT_STATUSES)[number];

  @ApiProperty({ example: ['行程对应的下班打卡时间为空'], isArray: true, type: String })
  rejectionReasons!: string[];
}

export class AttachmentResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: ATTACHMENT_KINDS, example: 'clock' })
  kind!: (typeof ATTACHMENT_KINDS)[number];

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ enum: ATTACHMENT_TYPES, example: 'img' })
  type!: (typeof ATTACHMENT_TYPES)[number];

  @ApiProperty({ example: 'clock.jpg' })
  originalName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType!: string;

  @ApiProperty({ example: '/api/v1/attachments/1/content' })
  url!: string;

  @ApiProperty({ example: '2026-09-02' })
  workDate!: string;

  @ApiProperty({ example: '09:00' })
  earliest!: string;

  @ApiProperty({ example: '22:30' })
  latest!: string;

  @ApiProperty({ example: 5.5, nullable: true })
  hours!: number | null;
}

export class ReimbursementDetailResponseDto extends ReimbursementSummaryResponseDto {
  @ApiProperty({ isArray: true, type: () => AttachmentResponseDto })
  attachments!: AttachmentResponseDto[];
}

export class CreateReimbursementResponseDto {
  @ApiProperty({ type: () => ReimbursementSummaryResponseDto })
  record!: ReimbursementSummaryResponseDto;
}
