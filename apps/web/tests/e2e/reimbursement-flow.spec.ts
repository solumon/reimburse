import fs from 'node:fs';

import { expect, test } from '@playwright/test';

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('提交报销后可由管理员查看和处理', async ({ page }, testInfo) => {
  const clockPath = testInfo.outputPath('clock.png');
  const voucherPath = testInfo.outputPath('voucher.pdf');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(clockPath, ONE_PIXEL_PNG);
  fs.writeFileSync(voucherPath, '%PDF-1.4\n%%EOF');

  await page.goto('/submit');
  await page.getByLabel('姓名*').fill('自动化测试');
  await page.getByLabel('报销金额（元）*').fill('58.50');
  await page.locator('input[type="file"]').nth(0).setInputFiles(clockPath);
  await page.getByLabel('打卡日期').fill('2026-09-01');
  await page.getByLabel('最早时间').fill('09:00');
  await page.getByLabel('最晚时间').fill('23:30');
  await page.getByLabel('工时').fill('14.5');
  await page.locator('input[type="file"]').nth(1).setInputFiles(voucherPath);
  await page.getByLabel('备注*').fill('Playwright 隔离数据验收');
  await page.getByRole('button', { name: '提交报销申请' }).click();
  await expect(page.getByText('报销申请已提交')).toBeVisible();

  await page.goto('/admin/summary');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('管理员密码').fill('playwright-admin-password');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/summary/);
  await expect(page.getByText('¥58.50').first()).toBeVisible();
  await page.getByRole('button', { name: '查看', exact: true }).first().click();
  await expect(page.getByText('Playwright 隔离数据验收')).toBeVisible();
});
