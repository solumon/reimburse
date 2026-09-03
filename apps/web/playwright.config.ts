import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  expect: { timeout: 8_000 },
  fullyParallel: false,
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  reporter: 'list',
  testDir: './tests/e2e',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:18100',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node ../../scripts/start-playwright-server.mjs',
    reuseExistingServer: false,
    timeout: 30_000,
    url: 'http://127.0.0.1:18100/api/v1/health',
  },
});
