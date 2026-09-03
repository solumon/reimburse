import { plainToInstance, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ClockMetadataDto {
  @ApiProperty({ example: '2026-09-02', format: 'date' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  workDate!: string;

  @ApiProperty({ example: '09:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  earliest!: string;

  @ApiProperty({ example: '22:30', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  latest!: string;

  @ApiProperty({ example: 5.5, maximum: 24, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  hours!: number;
}

export class CreateReimbursementDto {
  @ApiProperty({ example: '张三', maxLength: 40 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name!: string;

  @ApiProperty({ example: 128.5, maximum: 99999999.99, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  amount!: number;

  @ApiProperty({ example: '项目紧急上线', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note = '';

  @ApiProperty({ isArray: true, type: () => ClockMetadataDto })
  @Transform(({ value }) => {
    let parsed: unknown = value;
    try {
      if (typeof value === 'string') parsed = JSON.parse(value) as unknown;
    } catch {
      return value;
    }
    return Array.isArray(parsed)
      ? parsed.map((item) => plainToInstance(ClockMetadataDto, item))
      : parsed;
  })
  @IsArray()
  @ValidateNested({ each: true })
  clockMetadata!: ClockMetadataDto[];
}
