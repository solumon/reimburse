import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { REIMBURSEMENT_STATUSES, type ReimbursementStatus } from '@reimburse/shared';

export class QueryReimbursementsDto {
  @ApiPropertyOptional({ example: '2026-09', pattern: '^\\d{4}-\\d{2}$' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  month?: string;

  @ApiPropertyOptional({ example: '张三', maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  @ApiPropertyOptional({ enum: REIMBURSEMENT_STATUSES, example: 'wait' })
  @IsOptional()
  @IsIn(REIMBURSEMENT_STATUSES)
  status?: ReimbursementStatus;
}
