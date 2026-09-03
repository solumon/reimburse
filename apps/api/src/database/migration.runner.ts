import type { DatabaseSync } from 'node:sqlite';

import { Logger } from '@nestjs/common';

import { applyBaselineMigration, BASELINE_VERSION } from './migrations/001-baseline.js';

export class MigrationRunner {
  private readonly logger = new Logger(MigrationRunner.name);

  run(db: DatabaseSync): void {
    applyBaselineMigration(db);

    const applied = db.prepare('SELECT version FROM schema_migrations WHERE version = ?')
      .get(BASELINE_VERSION);
    if (!applied) {
      db.prepare('INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)')
        .run(BASELINE_VERSION, new Date().toISOString());
      this.logger.log(`数据库基线迁移已登记：v${BASELINE_VERSION}`);
    }

    const violations = db.prepare('PRAGMA foreign_key_check').all();
    if (violations.length > 0) {
      throw new Error(`数据库外键校验失败，共 ${violations.length} 项`);
    }
  }
}
