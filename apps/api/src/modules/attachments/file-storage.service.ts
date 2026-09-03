import fs from 'node:fs';
import path from 'node:path';

import { ConfigService } from '@nestjs/config';
import { BadRequestException, Injectable } from '@nestjs/common';

import type { AttachmentKind, ClockMetadata } from '@reimburse/shared';

import { FileValidator } from './file.validator.js';

export interface StoredAttachmentInput {
  kind: AttachmentKind;
  sortOrder: number;
  type: 'img' | 'pdf';
  originalName: string;
  mimeType: string;
  relativePath: string;
  workDate: string;
  earliest: string;
  latest: string;
  hours: number | null;
}

@Injectable()
export class FileStorageService {
  private readonly filesDir: string;

  constructor(
    configService: ConfigService,
    private readonly fileValidator: FileValidator,
  ) {
    this.filesDir = configService.getOrThrow<string>('app.filesDir');
    fs.mkdirSync(this.filesDir, { recursive: true });
    fs.mkdirSync(this.tempDir, { recursive: true });
  }

  get tempDir(): string {
    return path.join(this.filesDir, '.tmp');
  }

  persist(
    recordId: string,
    clockFiles: Express.Multer.File[],
    voucherFiles: Express.Multer.File[],
    clockMetadata: ClockMetadata[],
  ): StoredAttachmentInput[] {
    if (clockFiles.length === 0 || voucherFiles.length === 0) {
      throw new BadRequestException('打卡截图和发票行程单均不能为空');
    }
    if (clockFiles.length > 40 || voucherFiles.length > 20) {
      throw new BadRequestException('附件数量超过限制');
    }
    const totalSize = [...clockFiles, ...voucherFiles]
      .reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 60 * 1024 * 1024) {
      throw new BadRequestException('附件总大小不能超过 60 MB');
    }
    if (clockMetadata.length !== clockFiles.length) {
      throw new BadRequestException('打卡信息数量与附件数量不一致');
    }

    const recordDir = this.resolveRelative(recordId);
    fs.mkdirSync(recordDir, { recursive: false });
    const rows: StoredAttachmentInput[] = [];

    try {
      this.persistGroup(recordId, 'clock', clockFiles, clockMetadata, rows);
      this.persistGroup(recordId, 'voucher', voucherFiles, [], rows);
      return rows;
    } catch (error) {
      fs.rmSync(recordDir, { force: true, recursive: true });
      throw error;
    } finally {
      this.cleanupTemporary([...clockFiles, ...voucherFiles]);
    }
  }

  cleanupRecord(recordId: string): void {
    fs.rmSync(this.resolveRelative(recordId), { force: true, recursive: true });
  }

  cleanupTemporary(files: Express.Multer.File[]): void {
    for (const file of files) {
      try {
        fs.rmSync(file.path, { force: true });
      } catch {
        // 清理失败由下一次启动时的临时目录维护任务兜底。
      }
    }
  }

  resolveStored(relativePath: string): string {
    return this.resolveRelative(relativePath);
  }

  private persistGroup(
    recordId: string,
    kind: AttachmentKind,
    files: Express.Multer.File[],
    metadata: ClockMetadata[],
    rows: StoredAttachmentInput[],
  ): void {
    files.forEach((file, index) => {
      const validated = this.fileValidator.validate(file);
      const filename = `${kind}-${String(index + 1).padStart(3, '0')}.${validated.extension}`;
      const relativePath = path.posix.join(recordId, filename);
      fs.renameSync(file.path, this.resolveRelative(relativePath));
      const meta = metadata[index];

      rows.push({
        earliest: meta?.earliest ?? '',
        hours: meta?.hours ?? null,
        kind,
        latest: meta?.latest ?? '',
        mimeType: validated.mimeType,
        originalName: file.originalname.slice(0, 255),
        relativePath,
        sortOrder: index,
        type: validated.type,
        workDate: meta?.workDate ?? '',
      });
    });
  }

  private resolveRelative(relativePath: string): string {
    const target = path.resolve(this.filesDir, relativePath);
    const root = `${path.resolve(this.filesDir)}${path.sep}`;
    if (!target.startsWith(root)) {
      throw new BadRequestException('附件路径越界');
    }
    return target;
  }
}
