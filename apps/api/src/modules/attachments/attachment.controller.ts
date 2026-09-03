import type { Response } from 'express';
import { Controller, Get, Header, Param, ParseIntPipe, Query, Res, StreamableFile } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto.js';
import { AttachmentService } from './attachment.service.js';

@Controller({ path: 'attachments', version: '1' })
@ApiTags('附件')
@ApiCookieAuth('admin-session')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get(':id/content')
  @Header('Cache-Control', 'private, max-age=300')
  @ApiOperation({ summary: '预览或下载附件内容' })
  @ApiParam({ example: 1, name: 'id', type: Number })
  @ApiQuery({ description: '传 1 时下载，否则浏览器内预览', example: '1', name: 'download', required: false })
  @ApiOkResponse({
    content: {
      'application/octet-stream': {
        schema: { format: 'binary', type: 'string' },
      },
    },
    description: '附件文件流，实际 Content-Type 为附件 MIME 类型',
  })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getContent(
    @Param('id', ParseIntPipe) id: number,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): StreamableFile {
    const content = this.attachmentService.getContent(id);
    const disposition = download === '1' ? 'attachment' : 'inline';
    const encodedName = encodeURIComponent(content.originalName);
    response.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodedName}`);
    return new StreamableFile(content.stream, { type: content.mimeType });
  }
}
