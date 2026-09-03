import { Injectable } from '@nestjs/common';

import type { ReimbursementQuery, ReimbursementStatus } from '@reimburse/shared';

import { DatabaseService } from '../../database/database.service.js';
import type { StoredAttachmentInput } from '../attachments/file-storage.service.js';
import type {
  ReimbursementAttachmentRow,
  ReimbursementSummaryRow,
} from './reimbursement.mapper.js';

export interface NewReimbursementRow {
  id: string;
  name: string;
  amount: number;
  note: string;
  status: ReimbursementStatus;
  createdAt: number;
}

@Injectable()
export class ReimbursementRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  list(query: ReimbursementQuery): ReimbursementSummaryRow[] {
    const where: string[] = [];
    const parameters: Array<string | number> = [];
    if (query.month) {
      where.push("strftime('%Y-%m', r.created_at / 1000, 'unixepoch', 'localtime') = ?");
      parameters.push(query.month);
    }
    if (query.name) {
      where.push('r.name LIKE ? ESCAPE \'\\\'');
      parameters.push(`%${this.escapeLike(query.name.trim())}%`);
    }
    if (query.status) {
      where.push('r.status = ?');
      parameters.push(query.status);
    }

    const condition = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    return this.databaseService.connection.prepare(`
      SELECT r.id, r.name, r.amount, r.note, r.status, r.created_at AS createdAt,
             SUM(CASE WHEN a.kind = 'clock' THEN 1 ELSE 0 END) AS clockCount,
             SUM(CASE WHEN a.kind = 'voucher' THEN 1 ELSE 0 END) AS voucherCount
      FROM records r
      LEFT JOIN attachments a ON a.record_id = r.id
      ${condition}
      GROUP BY r.id, r.name, r.amount, r.note, r.status, r.created_at
      ORDER BY r.created_at DESC
    `).all(...parameters) as unknown as ReimbursementSummaryRow[];
  }

  findSummary(id: string): ReimbursementSummaryRow | undefined {
    return this.databaseService.connection.prepare(`
      SELECT r.id, r.name, r.amount, r.note, r.status, r.created_at AS createdAt,
             SUM(CASE WHEN a.kind = 'clock' THEN 1 ELSE 0 END) AS clockCount,
             SUM(CASE WHEN a.kind = 'voucher' THEN 1 ELSE 0 END) AS voucherCount
      FROM records r
      LEFT JOIN attachments a ON a.record_id = r.id
      WHERE r.id = ?
      GROUP BY r.id, r.name, r.amount, r.note, r.status, r.created_at
    `).get(id) as unknown as ReimbursementSummaryRow | undefined;
  }

  findAttachments(recordId: string): ReimbursementAttachmentRow[] {
    return this.databaseService.connection.prepare(`
      SELECT id, kind, sort_order AS sortOrder, attachment_type AS type,
             original_name AS originalName, mime_type AS mimeType,
             work_date AS workDate, earliest, latest, hours
      FROM attachments
      WHERE record_id = ?
      ORDER BY CASE kind WHEN 'clock' THEN 0 ELSE 1 END, sort_order
    `).all(recordId) as unknown as ReimbursementAttachmentRow[];
  }

  create(record: NewReimbursementRow, attachments: StoredAttachmentInput[]): void {
    this.databaseService.transaction(() => {
      this.databaseService.connection.prepare(`
        INSERT INTO records(id, name, amount, note, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(record.id, record.name, record.amount, record.note, record.status, record.createdAt);

      const insertAttachment = this.databaseService.connection.prepare(`
        INSERT INTO attachments(
          record_id, kind, sort_order, attachment_type, original_name, mime_type,
          relative_path, work_date, earliest, latest, hours
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const attachment of attachments) {
        insertAttachment.run(
          record.id,
          attachment.kind,
          attachment.sortOrder,
          attachment.type,
          attachment.originalName,
          attachment.mimeType,
          attachment.relativePath,
          attachment.workDate,
          attachment.earliest,
          attachment.latest,
          attachment.hours,
        );
      }
    });
  }

  updateStatus(id: string, status: ReimbursementStatus): boolean {
    const result = this.databaseService.connection
      .prepare('UPDATE records SET status = ? WHERE id = ?')
      .run(status, id);
    return Number(result.changes) > 0;
  }

  delete(id: string): boolean {
    return this.databaseService.transaction(() => {
      const result = this.databaseService.connection
        .prepare('DELETE FROM records WHERE id = ?')
        .run(id);
      return Number(result.changes) > 0;
    });
  }

  count(): number {
    const row = this.databaseService.connection
      .prepare('SELECT COUNT(*) AS count FROM records')
      .get() as unknown as { count: number };
    return Number(row.count);
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (character) => `\\${character}`);
  }
}
