import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { REIMBURSEMENT_STATUSES, type ReimbursementStatus } from '@reimburse/shared';

export class UpdateStatusDto {
  @ApiProperty({ enum: REIMBURSEMENT_STATUSES, example: 'done' })
  @IsIn(REIMBURSEMENT_STATUSES)
  status!: ReimbursementStatus;
}
