import fs from 'node:fs';

import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { AttachmentController } from './attachment.controller.js';
import { AttachmentRepository } from './attachment.repository.js';
import { AttachmentService } from './attachment.service.js';
import { FileStorageService } from './file-storage.service.js';
import { FileValidator } from './file.validator.js';

@Module({
  controllers: [AttachmentController],
  exports: [FileStorageService, MulterModule],
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const tempDir = `${configService.getOrThrow<string>('app.filesDir')}/.tmp`;
        fs.mkdirSync(tempDir, { recursive: true });
        return {
          limits: { fileSize: 10 * 1024 * 1024, files: 60 },
          storage: diskStorage({ destination: tempDir }),
        };
      },
    }),
  ],
  providers: [AttachmentRepository, AttachmentService, FileStorageService, FileValidator],
})
export class AttachmentModule {}
