import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('提交报销后可由管理员查看和处理', async ({ page }, testInfo) => {
  const name = `自动化测试-${testInfo.project.name}`;
  const clockPath = testInfo.outputPath('clock.png');
  const voucherPath = testInfo.outputPath('voucher.pdf');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(clockPath, ONE_PIXEL_PNG);
  fs.writeFileSync(voucherPath, '%PDF-1.4\n%%EOF');

  await page.goto('/submit');
  await page.getByLabel('姓名*').fill(name);
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
  await expect(page.getByText('个人报销明细', { exact: true })).toHaveCount(0);
  await expect(page.getByText('¥58.50').first()).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: name });
  const auditButton = row.getByRole('button', { name: '预审详情' });
  await expect(auditButton).toBeDisabled();

  const listResponse = await page.request.get('/api/v1/reimbursements');
  expect(listResponse.ok()).toBe(true);
  const records = await listResponse.json() as Array<{ id: string; name: string }>;
  const record = records.find((item) => item.name === name);
  expect(record).toBeDefined();
  const runtimeMarker = path.join(os.tmpdir(), 'reimburse-playwright-18100-runtime-root.txt');
  const runtimeRoot = fs.readFileSync(runtimeMarker, 'utf8');
  fs.writeFileSync(`${runtimeRoot}/files/${record!.id}/audit.json`, JSON.stringify({
    不通过原因: ['行程对应的下班打卡时间为空，这是一段用于验证长文本展示的说明'],
    姓名: name,
    审核时间: '2026-09-03 12:14:26',
    审核状态: '不通过',
    报销总金额: 58.5,
    行程列表: [{
      上班打卡时间: '09:00',
      下班打卡时间: null,
      打车时间: '23:30',
      班次日期: '2026-09-01',
      金额: 58.5,
    }],
  }));

  await page.getByRole('button', { name: '查询' }).click();
  await expect(auditButton).toBeEnabled();
  await auditButton.click();
  const auditDialog = page.getByRole('dialog', { name: '预审详情' });
  await expect(auditDialog).toContainText('不通过');
  await expect(auditDialog).toContainText('¥58.50');
  await expect(auditDialog).toContainText('--');
  await expect(auditDialog).toContainText('行程对应的下班打卡时间为空');
  await auditDialog.getByRole('button', { name: '关闭' }).click();
  await expect(auditDialog).toBeHidden();

  await row.getByRole('button', { name: '查看', exact: true }).click();
  await expect(page.getByText('Playwright 隔离数据验收')).toBeVisible();
});
