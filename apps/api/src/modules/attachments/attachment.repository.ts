import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service.js';

export interface StoredAttachmentRow {
  id: number;
  mimeType: string;
  originalName: string;
  relativePath: string;
}

@Injectable()
export class AttachmentRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findById(id: number): StoredAttachmentRow | undefined {
    return this.databaseService.connection.prepare(`
      SELECT id, mime_type AS mimeType, original_name AS originalName,
             relative_path AS relativePath
      FROM attachments
      WHERE id = ?
    `).get(id) as unknown as StoredAttachmentRow | undefined;
  }
}
