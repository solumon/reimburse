<script setup lang="ts">
import type { ReimbursementSummary } from '@reimburse/shared';
import { computed } from 'vue';

import { formatMoney } from '@/shared/utils/format';

const props = defineProps<{ records: ReimbursementSummary[] }>();
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const total = computed(() => props.records.reduce((sum, item) => sum + item.amount, 0));
const monthRecords = computed(() => props.records.filter((item) => {
  const date = new Date(item.createdAt);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === currentMonth;
}));
</script>

<template>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-value">{{ formatMoney(total) }}</div><div class="kpi-label">累计报销金额</div></div>
    <div class="kpi-card"><div class="kpi-value">{{ records.length }}</div><div class="kpi-label">累计笔数</div></div>
    <div class="kpi-card"><div class="kpi-value">{{ formatMoney(monthRecords.reduce((sum, item) => sum + item.amount, 0)) }}</div><div class="kpi-label">本月金额</div></div>
    <div class="kpi-card"><div class="kpi-value">{{ monthRecords.length }}</div><div class="kpi-label">本月笔数</div></div>
  </div>
</template>
