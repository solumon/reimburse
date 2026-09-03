import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { ConfigService } from '@nestjs/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { MigrationRunner } from './migration.runner.js';
import { migrateLegacyJson } from './migrations/legacy-json.migration.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private database?: DatabaseSync;

  constructor(private readonly configService: ConfigService) {}

  get connection(): DatabaseSync {
    if (!this.database) {
      throw new Error('数据库尚未初始化');
    }
    return this.database;
  }

  get databaseFile(): string {
    const sqliteDir = this.configService.getOrThrow<string>('app.sqliteDir');
    return path.join(sqliteDir, 'reimburse.sqlite3');
  }

  onModuleInit(): void {
    fs.mkdirSync(path.dirname(this.databaseFile), { recursive: true });
    this.database = new DatabaseSync(this.databaseFile);
    new MigrationRunner().run(this.database);
    const filesDir = this.configService.getOrThrow<string>('app.filesDir');
    migrateLegacyJson(this.database, path.dirname(this.databaseFile), filesDir);
    this.verifyAttachmentFiles(filesDir);
  }

  onModuleDestroy(): void {
    this.database?.close();
    this.database = undefined;
  }

  transaction<T>(action: () => T): T {
    this.connection.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      this.connection.exec('COMMIT');
      return result;
    } catch (error) {
      try {
        this.connection.exec('ROLLBACK');
      } catch {
        // 原始异常更有诊断价值，回滚异常不覆盖它。
      }
      throw error;
    }
  }

  private verifyAttachmentFiles(filesDir: string): void {
    const rows = this.connection.prepare('SELECT relative_path AS relativePath FROM attachments').all() as Array<{ relativePath: string }>;
    const root = `${path.resolve(filesDir)}${path.sep}`;
    const missing = rows.filter(({ relativePath }) => {
      const target = path.resolve(filesDir, relativePath);
      return !target.startsWith(root) || !fs.existsSync(target);
    });
    if (missing.length > 0) {
      throw new Error(`附件完整性校验失败，共 ${missing.length} 项`);
    }
  }
}
