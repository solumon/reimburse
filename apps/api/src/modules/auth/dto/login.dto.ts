import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '管理员密码', example: 'your-admin-password', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;
}
