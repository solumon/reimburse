import { randomUUID } from 'node:crypto';

import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import type {
  CreateReimbursementResponse,
  ReimbursementAudit,
  ReimbursementDetail,
  ReimbursementQuery,
  ReimbursementStatus,
  ReimbursementSummary,
} from '@reimburse/shared';

import { FileStorageService } from '../attachments/file-storage.service.js';
import type { CreateReimbursementDto } from './dto/create-reimbursement.dto.js';
import { mapReimbursementAudit } from './reimbursement-audit.mapper.js';
import { mapDetail, mapSummary } from './reimbursement.mapper.js';
import { ReimbursementRepository } from './reimbursement.repository.js';

export interface ReimbursementUploadGroups {
  clockFiles?: Express.Multer.File[];
  voucherFiles?: Express.Multer.File[];
}

@Injectable()
export class ReimbursementService {
  constructor(
    private readonly repository: ReimbursementRepository,
    private readonly fileStorageService: FileStorageService,
  ) {}

  create(
    dto: CreateReimbursementDto,
    files: ReimbursementUploadGroups,
  ): CreateReimbursementResponse {
    const id = randomUUID().replaceAll('-', '');
    const attachments = this.fileStorageService.persist(
      id,
      files.clockFiles ?? [],
      files.voucherFiles ?? [],
      dto.clockMetadata,
    );

    try {
      this.repository.create({
        amount: dto.amount,
        createdAt: Date.now(),
        id,
        name: dto.name.trim(),
        note: dto.note.trim(),
        status: 'wait',
      }, attachments);
    } catch (error) {
      // 文件已全部落盘但数据库事务失败时，必须回收整条记录目录。
      this.fileStorageService.cleanupRecord(id);
      throw error;
    }

    return { record: this.getSummary(id) };
  }

  list(query: ReimbursementQuery): ReimbursementSummary[] {
    return this.repository.list(query).map((row) => (
      mapSummary(row, this.fileStorageService.hasAudit(row.id))
    ));
  }

  getDetail(id: string): ReimbursementDetail {
    this.ensureId(id);
    const summary = this.repository.findSummary(id);
    if (!summary) throw new NotFoundException('报销记录不存在');
    return mapDetail(
      summary,
      this.repository.findAttachments(id),
      this.fileStorageService.hasAudit(id),
    );
  }

  getAudit(id: string): ReimbursementAudit {
    this.ensureId(id);
    if (!this.repository.findSummary(id)) {
      throw new NotFoundException('报销记录不存在');
    }
    const content = this.fileStorageService.readAudit(id);
    if (content === null) throw new NotFoundException('预审结果不存在');

    let value: unknown;
    try {
      value = JSON.parse(content) as unknown;
    } catch {
      throw new UnprocessableEntityException('预审结果格式无效');
    }
    const audit = mapReimbursementAudit(value);
    if (!audit) throw new UnprocessableEntityException('预审结果格式无效');
    return audit;
  }

  updateStatus(id: string, status: ReimbursementStatus): ReimbursementSummary {
    this.ensureId(id);
    if (!this.repository.updateStatus(id, status)) {
      throw new NotFoundException('报销记录不存在');
    }
    return this.getSummary(id);
  }

  delete(id: string): void {
    this.ensureId(id);
    if (!this.repository.delete(id)) {
      throw new NotFoundException('报销记录不存在');
    }
    // 数据库提交后再删目录；目录残留可恢复，反向顺序会造成不可恢复的数据缺口。
    this.fileStorageService.cleanupRecord(id);
  }

  private getSummary(id: string): ReimbursementSummary {
    const row = this.repository.findSummary(id);
    if (!row) throw new NotFoundException('报销记录不存在');
    return mapSummary(row, this.fileStorageService.hasAudit(id));
  }

  private ensureId(id: string): void {
    if (!/^[0-9a-f]{32}$/.test(id)) {
      throw new NotFoundException('报销记录不存在');
    }
  }
}
