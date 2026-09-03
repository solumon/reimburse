<script setup lang="ts">
import type { ReimbursementAudit } from '@reimburse/shared';

import { formatMoney } from '@/shared/utils/format';

defineProps<{ audit: ReimbursementAudit }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <div class="modal" role="dialog" aria-labelledby="audit-dialog-title" aria-modal="true" @click.self="$emit('close')">
    <article class="modal-card">
      <header>
        <h2 id="audit-dialog-title">预审详情</h2>
        <button class="btn btn-ghost btn-sm" type="button" @click="$emit('close')">关闭</button>
      </header>

      <div class="audit-summary">
        <div class="summary-item"><span>审核状态</span><strong class="audit-status" :class="audit.status === '通过' ? 'passed' : 'rejected'">{{ audit.status }}</strong></div>
        <div class="summary-item"><span>姓名</span><strong>{{ audit.name }}</strong></div>
        <div class="summary-item"><span>审核时间</span><strong>{{ audit.auditedAt }}</strong></div>
        <div class="summary-item"><span>批次 ID</span><strong>{{ audit.batchId }}</strong></div>
        <div class="summary-item"><span>发票金额</span><strong>{{ formatMoney(audit.invoiceAmount) }}</strong></div>
        <div class="summary-item"><span>报销金额</span><strong>{{ formatMoney(audit.reimbursementAmount) }}</strong></div>
      </div>

      <h3>行程明细</h3>
      <div v-if="audit.trips.length" class="table-wrap">
        <table class="table">
          <thead><tr><th>班次日期</th><th>上班打卡</th><th>下班打卡</th><th>打车时间</th><th>金额</th><th>行程审核</th><th>发票号码</th><th>开票日期</th></tr></thead>
          <tbody>
            <tr v-for="(trip, index) in audit.trips" :key="`${trip.shiftDate}-${index}`">
              <td>{{ trip.shiftDate || '--' }}</td>
              <td>{{ trip.clockInTime || '--' }}</td>
              <td>{{ trip.clockOutTime || '--' }}</td>
              <td>{{ trip.taxiTime || '--' }}</td>
              <td>{{ formatMoney(trip.amount) }}</td>
              <td>{{ trip.status }}</td>
              <td>{{ trip.invoiceNumber || '--' }}</td>
              <td>{{ trip.invoiceDate || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty">暂无行程明细</div>

      <section v-if="audit.status === '不通过' && audit.rejectionReasons.length" class="audit-reasons">
        <h3>不通过原因</h3>
        <ol>
          <li v-for="(reason, index) in audit.rejectionReasons" :key="index">{{ reason }}</li>
        </ol>
      </section>
    </article>
  </div>
</template>

<style scoped lang="scss">
.modal { position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgb(0 0 0 / 50%); }
.modal-card { width: min(720px, 100%); max-height: 88vh; overflow: auto; padding: 22px; border-radius: 12px; background: #fff; box-shadow: 0 20px 60px rgb(0 0 0 / 20%); }
header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
h2 { font-size: 17px; }
h3 { margin: 20px 0 10px; font-size: 14px; }
.audit-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
.summary-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; border-radius: 8px; background: #f9fafb;
  span { color: #6b7280; white-space: nowrap; }
  strong { text-align: right; word-break: break-word; }
}
.audit-status { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px;
  &.passed { background: #d1fae5; color: #059669; }
  &.rejected { background: #fee2e2; color: #dc2626; }
}
.table { min-width: 900px; }
.audit-reasons { margin-top: 18px; padding: 14px 16px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2;
  h3 { margin-top: 0; color: #b91c1c; }
  ol { padding-left: 20px; color: #991b1b; }
  li + li { margin-top: 8px; }
}

@media (max-width: 640px) {
  .modal { align-items: flex-start; padding: 12px; }
  .modal-card { padding: 16px; }
  .audit-summary { grid-template-columns: 1fr; }
}
</style>
