import fs from 'node:fs';

import { Injectable, NotFoundException } from '@nestjs/common';

import { AttachmentRepository } from './attachment.repository.js';
import { FileStorageService } from './file-storage.service.js';

export interface AttachmentContent {
  mimeType: string;
  originalName: string;
  stream: fs.ReadStream;
}

@Injectable()
export class AttachmentService {
  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly repository: AttachmentRepository,
  ) {}

  getContent(id: number): AttachmentContent {
    const attachment = this.repository.findById(id);
    if (!attachment) throw new NotFoundException('附件不存在');

    const absolutePath = this.fileStorageService.resolveStored(attachment.relativePath);
    if (!fs.existsSync(absolutePath)) throw new NotFoundException('附件文件不存在');

    return {
      mimeType: attachment.mimeType,
      originalName: attachment.originalName,
      stream: fs.createReadStream(absolutePath),
    };
  }
}
