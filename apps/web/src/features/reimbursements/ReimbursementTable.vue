<script setup lang="ts">
import type { ReimbursementSummary } from '@reimburse/shared';

import { formatDate, formatMoney } from '@/shared/utils/format';

defineProps<{
  auditLoadingId: string | null;
  loading: boolean;
  records: ReimbursementSummary[];
}>();
defineEmits<{
  audit: [record: ReimbursementSummary];
  remove: [record: ReimbursementSummary];
  toggle: [record: ReimbursementSummary];
  view: [record: ReimbursementSummary];
}>();
</script>

<template>
  <div v-if="loading" class="empty">正在加载…</div>
  <div v-else-if="records.length === 0" class="empty">没有符合条件的记录</div>
  <div v-else class="table-wrap">
    <table class="table">
      <thead><tr><th>编号</th><th>提交时间</th><th>姓名</th><th>金额</th><th>附件</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="record in records" :key="record.id">
          <td class="record-id">{{ record.id.slice(0, 8) }}</td>
          <td>{{ formatDate(record.createdAt) }}</td>
          <td>{{ record.name }}</td>
          <td>{{ formatMoney(record.amount) }}</td>
          <td>{{ record.clockCount }} / {{ record.voucherCount }}</td>
          <td><span class="pill" :class="record.status">{{ record.status === 'done' ? '已报销' : '待报销' }}</span></td>
          <td><div class="actions">
            <button class="btn btn-ghost btn-sm" type="button" @click="$emit('view', record)">查看</button>
            <button
              class="btn btn-ghost btn-sm"
              type="button"
              :disabled="!record.hasAudit || auditLoadingId === record.id"
              :title="record.hasAudit ? '查看预审详情' : '暂无预审结果'"
              @click="$emit('audit', record)"
            >{{ auditLoadingId === record.id ? '加载中…' : '预审详情' }}</button>
            <button class="btn btn-ghost btn-sm" type="button" @click="$emit('toggle', record)">{{ record.status === 'done' ? '撤销' : '标记已报' }}</button>
            <button class="btn btn-danger btn-sm" type="button" @click="$emit('remove', record)">删除</button>
          </div></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
