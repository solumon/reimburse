import fs from 'node:fs';

import { BadRequestException, Injectable } from '@nestjs/common';

import type { AttachmentType } from '@reimburse/shared';

export interface ValidatedFile {
  extension: string;
  mimeType: string;
  source: Express.Multer.File;
  type: AttachmentType;
}

@Injectable()
export class FileValidator {
  validate(file: Express.Multer.File): ValidatedFile {
    const handle = fs.openSync(file.path, 'r');
    const head = Buffer.alloc(16);
    try {
      fs.readSync(handle, head, 0, head.length, 0);
    } finally {
      fs.closeSync(handle);
    }

    const detected = this.detect(head);
    if (!detected) {
      throw new BadRequestException(`不支持或损坏的附件：${file.originalname}`);
    }
    if (!this.mimeCompatible(file.mimetype, detected.mimeType)) {
      throw new BadRequestException(`附件类型与内容不一致：${file.originalname}`);
    }

    return { ...detected, source: file };
  }

  private detect(head: Buffer): Omit<ValidatedFile, 'source'> | null {
    if (head.subarray(0, 5).toString() === '%PDF-') {
      return { extension: 'pdf', mimeType: 'application/pdf', type: 'pdf' };
    }
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
      return { extension: 'jpg', mimeType: 'image/jpeg', type: 'img' };
    }
    if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return { extension: 'png', mimeType: 'image/png', type: 'img' };
    }
    if (head.subarray(0, 6).toString() === 'GIF87a' || head.subarray(0, 6).toString() === 'GIF89a') {
      return { extension: 'gif', mimeType: 'image/gif', type: 'img' };
    }
    if (head.subarray(0, 4).toString() === 'RIFF' && head.subarray(8, 12).toString() === 'WEBP') {
      return { extension: 'webp', mimeType: 'image/webp', type: 'img' };
    }
    return null;
  }

  private mimeCompatible(input: string, detected: string): boolean {
    // 不接受空 MIME 或通用二进制类型，确保浏览器声明与文件签名同时通过。
    if (!input || input === 'application/octet-stream') return false;
    if (detected === 'image/jpeg') return input === 'image/jpeg' || input === 'image/jpg';
    return input === detected;
  }
}
