import type { DatabaseSync } from 'node:sqlite';

export const BASELINE_VERSION = 1;

export function applyBaselineMigration(db: DatabaseSync): void {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'wait' CHECK (status IN ('wait', 'done')),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('clock', 'voucher')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      attachment_type TEXT NOT NULL CHECK (attachment_type IN ('img', 'pdf')),
      original_name TEXT NOT NULL DEFAULT '',
      mime_type TEXT NOT NULL,
      relative_path TEXT NOT NULL UNIQUE,
      work_date TEXT NOT NULL DEFAULT '',
      earliest TEXT NOT NULL DEFAULT '',
      latest TEXT NOT NULL DEFAULT '',
      hours REAL,
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_attachments_record ON attachments(record_id, kind, sort_order);

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}
