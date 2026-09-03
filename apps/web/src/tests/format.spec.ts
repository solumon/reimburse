import { describe, expect, it } from 'vitest';

import { formatMoney, safeFilename } from '@/shared/utils/format';

describe('导出公共工具', () => {
  it('格式化金额并清理文件名中的非法字符', () => {
    expect(formatMoney(58.5)).toContain('58.50');
    expect(safeFilename('张三/报销:9月')).toBe('张三_报销_9月');
  });
});
