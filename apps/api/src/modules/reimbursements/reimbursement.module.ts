import { Module } from '@nestjs/common';

import { UploadedFilesCleanupInterceptor } from '../../common/interceptors/uploaded-files-cleanup.interceptor.js';
import { AttachmentModule } from '../attachments/attachment.module.js';
import { ReimbursementController } from './reimbursement.controller.js';
import { ReimbursementRepository } from './reimbursement.repository.js';
import { ReimbursementService } from './reimbursement.service.js';

@Module({
  controllers: [ReimbursementController],
  exports: [ReimbursementRepository],
  imports: [AttachmentModule],
  providers: [
    ReimbursementRepository,
    ReimbursementService,
    UploadedFilesCleanupInterceptor,
  ],
})
export class ReimbursementModule {}
