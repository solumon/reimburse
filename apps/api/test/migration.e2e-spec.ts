import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { MigrationRunner } from '../src/database/migration.runner.js';
import { migrateLegacyJson } from '../src/database/migrations/legacy-json.migration.js';

describe('旧 JSON 数据迁移', () => {
  it('保留业务字段、附件相对路径并且幂等', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'reimburse-migration-'));
    const sqliteDir = path.join(root, 'sqlite');
    const filesDir = path.join(root, 'files');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.mkdirSync(filesDir, { recursive: true });
    const id = '0123456789abcdef0123456789abcdef';
    fs.writeFileSync(path.join(sqliteDir, 'records.json'), JSON.stringify([{
      amount: 36.5,
      clockImgs: [{ data: 'data:image/jpeg;base64,/9j/4AAQ', date: '2026-08-31', earliest: '09:00', hours: 14, latest: '23:00', name: 'clock.jpg' }],
      createdAt: 1788163200000,
      id,
      name: '脱敏用户',
      note: '兼容性测试',
      status: 'wait',
      voucherImgs: [{ data: 'data:application/pdf;base64,JVBERi0xLjQKJSVFT0Y=', name: 'voucher.pdf', type: 'pdf' }],
    }]));
    const db = new DatabaseSync(path.join(sqliteDir, 'reimburse.sqlite3'));
    new MigrationRunner().run(db);
    migrateLegacyJson(db, sqliteDir, filesDir);
    migrateLegacyJson(db, sqliteDir, filesDir);
    const record = db.prepare('SELECT * FROM records').all();
    const attachments = db.prepare('SELECT relative_path FROM attachments ORDER BY kind').all() as Array<{ relative_path: string }>;
    expect(record).toHaveLength(1);
    expect(attachments).toHaveLength(2);
    expect(attachments.every((item) => item.relative_path.startsWith(`${id}/`))).toBe(true);
    db.close();
    fs.rmSync(root, { force: true, recursive: true });
  });
});
