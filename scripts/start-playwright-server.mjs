import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hash } from 'bcryptjs';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reimburse-playwright-'));
const runtimeMarker = path.join(os.tmpdir(), 'reimburse-playwright-18100-runtime-root.txt');
fs.writeFileSync(runtimeMarker, runtimeRoot);
const adminPassword = 'playwright-admin-password';
const child = spawn(process.execPath, ['apps/api/dist/main.js'], {
  cwd: workspaceRoot,
  env: {
    ...process.env,
    ADMIN_PASSWORD_HASH: await hash(adminPassword, 4),
    APP_FILES_DIR: path.join(runtimeRoot, 'files'),
    APP_SQLITE_DIR: path.join(runtimeRoot, 'sqlite'),
    COOKIE_SECURE: 'false',
    HOST: '127.0.0.1',
    NODE_ENV: 'test',
    PORT: '18100',
    SESSION_SECRET: 'playwright-session-secret-with-at-least-32-characters',
  },
  stdio: 'inherit',
});

function stop(signal) {
  child.kill(signal);
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

child.on('exit', (code) => {
  fs.rmSync(runtimeRoot, { force: true, recursive: true });
  fs.rmSync(runtimeMarker, { force: true });
  process.exit(code ?? 0);
});
