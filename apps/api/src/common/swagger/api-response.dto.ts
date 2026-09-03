import { ApiProperty } from '@nestjs/swagger';

import {
  ATTACHMENT_KINDS,
  ATTACHMENT_TYPES,
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
