import path from 'node:path';

import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => {
  const workspaceRoot = path.resolve(import.meta.dirname, '../../../..');

  return {
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? '',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    filesDir: path.resolve(workspaceRoot, process.env.APP_FILES_DIR ?? 'files'),
    host: process.env.HOST ?? '127.0.0.1',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 8000),
    sessionSecret: process.env.SESSION_SECRET ?? '',
    sqliteDir: path.resolve(workspaceRoot, process.env.APP_SQLITE_DIR ?? 'sqlite'),
    webDistDir: path.resolve(workspaceRoot, 'apps/web/dist'),
  };
});
