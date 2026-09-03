import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import type {
  CreateReimbursementResponse,
  ReimbursementAudit,
  ReimbursementDetail,
  ReimbursementSummary,
} from '@reimburse/shared';

import { Public } from '../../common/decorators/public.decorator.js';
import { RateLimit } from '../../common/decorators/rate-limit.decorator.js';
import { UploadedFilesCleanupInterceptor } from '../../common/interceptors/uploaded-files-cleanup.interceptor.js';
import {
  ApiErrorResponseDto,
  CreateReimbursementResponseDto,
  ReimbursementAuditResponseDto,
  ReimbursementDetailResponseDto,
  ReimbursementSummaryResponseDto,
} from '../../common/swagger/api-response.dto.js';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto.js';
import { QueryReimbursementsDto } from './dto/query-reimbursements.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { ReimbursementService, type ReimbursementUploadGroups } from './reimbursement.service.js';

@Controller({ path: 'reimbursements', version: '1' })
@ApiTags('报销记录')
export class ReimbursementController {
  constructor(private readonly reimbursementService: ReimbursementService) {}

  @Public()
  @Post()
  @RateLimit({ limit: 10, ttl: 60_000 })
  @ApiOperation({ summary: '提交报销记录和附件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: {
        amount: { example: 128.5, maximum: 99999999.99, minimum: 0.01, type: 'number' },
        clockFiles: {
          items: { format: 'binary', type: 'string' },
          maxItems: 40,
          minItems: 1,
          type: 'array',
        },
        clockMetadata: {
          description: '与 clockFiles 顺序一一对应的 JSON 数组字符串',
          example: '[{"workDate":"2026-09-02","earliest":"09:00","latest":"22:30","hours":5.5}]',
          type: 'string',
        },
        name: { example: '张三', maxLength: 40, type: 'string' },
        note: { example: '项目紧急上线', maxLength: 2000, type: 'string' },
        voucherFiles: {
          items: { format: 'binary', type: 'string' },
          maxItems: 20,
          minItems: 1,
          type: 'array',
        },
      },
      required: ['name', 'amount', 'note', 'clockMetadata', 'clockFiles', 'voucherFiles'],
      type: 'object',
    },
  })
  @ApiCreatedResponse({ type: CreateReimbursementResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @UseInterceptors(
    UploadedFilesCleanupInterceptor,
    FileFieldsInterceptor([
      { maxCount: 40, name: 'clockFiles' },
      { maxCount: 20, name: 'voucherFiles' },
    ]),
  )
  create(
    @Body() dto: CreateReimbursementDto,
    @UploadedFiles() files: ReimbursementUploadGroups,
  ): CreateReimbursementResponse {
    return this.reimbursementService.create(dto, files ?? {});
  }

  @Get()
  @ApiCookieAuth('admin-session')
  @ApiOperation({ summary: '查询报销记录列表' })
  @ApiOkResponse({ isArray: true, type: ReimbursementSummaryResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  list(@Query() query: QueryReimbursementsDto): ReimbursementSummary[] {
    return this.reimbursementService.list(query);
  }

  @Get(':id/audit')
  @ApiCookieAuth('admin-session')
  @ApiOperation({ summary: '查询报销预审结果' })
  @ApiParam({ example: '0123456789abcdef0123456789abcdef', name: 'id' })
  @ApiOkResponse({ type: ReimbursementAuditResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ApiErrorResponseDto })
  getAudit(@Param('id') id: string): ReimbursementAudit {
    return this.reimbursementService.getAudit(id);
  }

  @Get(':id')
  @ApiCookieAuth('admin-session')
  @ApiOperation({ summary: '查询报销记录详情' })
  @ApiParam({ example: '0123456789abcdef0123456789abcdef', name: 'id' })
  @ApiOkResponse({ type: ReimbursementDetailResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getDetail(@Param('id') id: string): ReimbursementDetail {
    return this.reimbursementService.getDetail(id);
  }

  @Patch(':id/status')
  @ApiCookieAuth('admin-session')
  @ApiOperation({ summary: '更新报销处理状态' })
  @ApiParam({ example: '0123456789abcdef0123456789abcdef', name: 'id' })
  @ApiOkResponse({ type: ReimbursementSummaryResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ): ReimbursementSummary {
    return this.reimbursementService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('admin-session')
  @ApiOperation({ summary: '删除报销记录及附件' })
  @ApiParam({ example: '0123456789abcdef0123456789abcdef', name: 'id' })
  @ApiNoContentResponse({ description: '删除成功' })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  delete(@Param('id') id: string): void {
    this.reimbursementService.delete(id);
  }
}
