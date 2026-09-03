import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator.js';
import { ApiErrorResponseDto, HealthResponseDto } from '../../common/swagger/api-response.dto.js';
import { DatabaseService } from '../../database/database.service.js';

interface HealthResponse {
  database: 'up';
  service: 'up';
  timestamp: string;
}

@Controller({ path: 'health', version: '1' })
@ApiTags('健康检查')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '检查服务与数据库状态' })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorResponseDto })
  check(): HealthResponse {
    try {
      this.databaseService.connection.prepare('SELECT 1').get();
      return {
        database: 'up',
        service: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException('数据库健康检查失败');
    }
  }
}
