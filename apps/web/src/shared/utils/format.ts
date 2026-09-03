export function formatMoney(value: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
}

export function formatDate(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function safeFilename(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || '未命名';
}
