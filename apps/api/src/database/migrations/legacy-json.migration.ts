import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

interface LegacyAttachment {
  data?: string;
  date?: string;
  earliest?: string;
  hours?: number | string;
  latest?: string;
  name?: string;
  type?: string;
}

interface LegacyRecord {
  amount?: number | string;
  clockImgs?: Array<LegacyAttachment | string>;
  createdAt?: number;
  id?: string;
  name?: string;
  note?: string;
  status?: string;
  voucherImgs?: Array<LegacyAttachment | string>;
}

interface LegacyAttachmentRow {
  attachmentType: 'img' | 'pdf';
  earliest: string;
  hours: number | null;
  kind: 'clock' | 'voucher';
  latest: string;
  mimeType: string;
  originalName: string;
  relativePath: string;
  sortOrder: number;
  workDate: string;
}

const EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function migrateLegacyJson(db: DatabaseSync, sqliteDir: string, filesDir: string): void {
  const marker = db.prepare("SELECT value FROM app_meta WHERE key = 'legacy_json_migrated'").get();
  if (marker) return;
  const source = path.join(sqliteDir, 'records.json');
  if (!fs.existsSync(source)) {
    markComplete(db);
    return;
  }

  const records = JSON.parse(fs.readFileSync(source, 'utf8')) as unknown;
  if (!Array.isArray(records)) throw new Error('旧 records.json 不是数组');
  for (const raw of records as LegacyRecord[]) migrateRecord(db, filesDir, raw);
  markComplete(db);
}

function migrateRecord(db: DatabaseSync, filesDir: string, record: LegacyRecord): void {
  const id = normalizeId(record.id);
  if (db.prepare('SELECT 1 FROM records WHERE id = ?').get(id)) return;
  const name = String(record.name ?? '').trim().slice(0, 40);
  const amount = Number(record.amount);
  if (!name || !(amount > 0)) throw new Error('旧 JSON 包含无效报销记录');

  const directory = resolveInside(filesDir, id);
  fs.rmSync(directory, { force: true, recursive: true });
  fs.mkdirSync(directory, { recursive: true });
  try {
    // JSON 解析、附件写入和数据库落库共用一个清理边界，避免迁移失败留下半个记录目录。
    const rows = [
      ...parseGroup(filesDir, id, 'clock', record.clockImgs ?? []),
      ...parseGroup(filesDir, id, 'voucher', record.voucherImgs ?? []),
    ];
    db.exec('BEGIN IMMEDIATE');
    db.prepare(`INSERT INTO records(id, name, amount, note, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, name, amount, String(record.note ?? ''), record.status === 'done' ? 'done' : 'wait', Number(record.createdAt) || Date.now());
    const insert = db.prepare(`INSERT INTO attachments(
      record_id, kind, sort_order, attachment_type, original_name, mime_type,
      relative_path, work_date, earliest, latest, hours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    rows.forEach((row) => insert.run(
      id, row.kind, row.sortOrder, row.attachmentType, row.originalName,
      row.mimeType, row.relativePath, row.workDate, row.earliest, row.latest, row.hours,
    ));
    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* 保留原始迁移异常。 */ }
    fs.rmSync(path.join(filesDir, id), { force: true, recursive: true });
    throw error;
  }
}

function parseGroup(
  filesDir: string,
  id: string,
  kind: 'clock' | 'voucher',
  items: Array<LegacyAttachment | string>,
): LegacyAttachmentRow[] {
  return items.map((raw, index) => {
    const item = typeof raw === 'string' ? { data: raw } : raw;
    const match = String(item.data ?? '').match(/^data:([^;,]+);base64,([\s\S]+)$/i);
    if (!match) throw new Error('旧 JSON 附件数据格式无效');
    const mimeType = match[1]!.toLowerCase();
    const attachmentType = item.type === 'pdf' || mimeType === 'application/pdf' ? 'pdf' : 'img';
    const extension = EXTENSIONS[mimeType] ?? (attachmentType === 'pdf' ? 'pdf' : 'jpg');
    const filename = `${kind}-${String(index + 1).padStart(3, '0')}.${extension}`;
    const relativePath = path.posix.join(id, filename);
    const bytes = Buffer.from(match[2]!.replace(/\s/g, ''), 'base64');
    fs.writeFileSync(resolveInside(filesDir, relativePath), bytes, { flag: 'wx' });
    return {
      attachmentType,
      earliest: String(item.earliest ?? '').slice(0, 20),
      hours: item.hours === '' || item.hours === undefined ? null : Number(item.hours),
      kind,
      latest: String(item.latest ?? '').slice(0, 20),
      mimeType,
      originalName: String(item.name ?? filename).slice(0, 255),
      relativePath,
      sortOrder: index,
      workDate: String(item.date ?? '').slice(0, 20),
    };
  });
}

function resolveInside(rootDirectory: string, relativePath: string): string {
  const root = `${path.resolve(rootDirectory)}${path.sep}`;
  const target = path.resolve(rootDirectory, relativePath);
  if (!target.startsWith(root)) throw new Error('旧数据附件路径越界');
  return target;
}

function normalizeId(value: string | undefined): string {
  const compact = String(value ?? '').replaceAll('-', '').toLowerCase();
  return /^[0-9a-f]{32}$/.test(compact) ? compact : randomUUID().replaceAll('-', '');
}

function markComplete(db: DatabaseSync): void {
  db.prepare("INSERT OR REPLACE INTO app_meta(key, value) VALUES ('legacy_json_migrated', ?)")
    .run(new Date().toISOString());
}
