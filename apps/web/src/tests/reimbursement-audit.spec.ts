import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { ReimbursementAudit, ReimbursementSummary } from '@reimburse/shared';

import ReimbursementAuditDetail from '@/features/reimbursements/ReimbursementAuditDetail.vue';
import ReimbursementTable from '@/features/reimbursements/ReimbursementTable.vue';

const summary: ReimbursementSummary = {
  amount: 58.5,
  clockCount: 1,
  createdAt: 1788336000000,
  hasAudit: false,
  id: '0123456789abcdef0123456789abcdef',
  name: '测试用户',
  note: '自动化测试',
  status: 'wait',
  voucherCount: 1,
};

describe('预审详情', () => {
  it('未生成结果时置灰入口，生成后可触发查看事件', async () => {
    const wrapper = mount(ReimbursementTable, {
      props: { auditLoadingId: null, loading: false, records: [summary] },
    });
    const button = wrapper.get('button[title="暂无预审结果"]');
    expect(button.attributes('disabled')).toBeDefined();

    await wrapper.setProps({ records: [{ ...summary, hasAudit: true }] });
    const enabledButton = wrapper.get('button[title="查看预审详情"]');
    expect(enabledButton.attributes('disabled')).toBeUndefined();
    await enabledButton.trigger('click');
    expect(wrapper.emitted('audit')?.[0]).toEqual([{ ...summary, hasAudit: true }]);
  });

  it('结构化展示不通过结果、空时间和原因', () => {
    const audit: ReimbursementAudit = {
      auditedAt: '2026-09-03 12:14:26',
      name: '测试用户',
      rejectionReasons: ['这是一个用于验证长文本换行展示的不通过原因'],
      status: '不通过',
      totalAmount: 58.5,
      trips: [{
        amount: 58.5,
        clockInTime: '09:00',
        clockOutTime: null,
        shiftDate: '2026-09-01',
        taxiTime: '23:30',
      }],
    };
    const wrapper = mount(ReimbursementAuditDetail, { props: { audit } });

    expect(wrapper.get('[role="dialog"]').text()).toContain('不通过');
    expect(wrapper.get('[role="dialog"]').text()).toContain('¥58.50');
    expect(wrapper.get('[role="dialog"]').text()).toContain('--');
    expect(wrapper.get('.audit-reasons').text()).toContain(audit.rejectionReasons[0]);
  });

  it('通过且没有原因时隐藏原因区域，并可关闭弹框', async () => {
    const wrapper = mount(ReimbursementAuditDetail, {
      props: {
        audit: {
          auditedAt: '2026-09-03 12:14:26',
          name: '测试用户',
          rejectionReasons: [],
          status: '通过',
          totalAmount: 58.5,
          trips: [],
        },
      },
    });

    expect(wrapper.find('.audit-reasons').exists()).toBe(false);
    expect(wrapper.text()).toContain('暂无行程明细');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
