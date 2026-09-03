<script setup lang="ts">
import type { ReimbursementSummary } from '@reimburse/shared';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import { exportCsv } from '@/features/exports/csv-export';
import ReimbursementDetail from '@/features/reimbursements/ReimbursementDetail.vue';
import ReimbursementSummaryPanel from '@/features/reimbursements/ReimbursementSummary.vue';
import ReimbursementTable from '@/features/reimbursements/ReimbursementTable.vue';
import { useReimbursementStore } from '@/features/reimbursements/reimbursement.store';
import { formatMoney } from '@/shared/utils/format';

const store = useReimbursementStore();
const { detail, loading, records } = storeToRefs(store);
const month = ref('');
const name = ref('');
const error = ref('');
const personRows = computed(() => {
  const grouped = new Map<string, { amount: number; count: number }>();
  records.value.forEach((record) => {
    const row = grouped.get(record.name) ?? { amount: 0, count: 0 };
    row.amount += record.amount;
    row.count += 1;
    grouped.set(record.name, row);
  });
  return [...grouped].sort((left, right) => right[1].amount - left[1].amount);
});

async function refresh(): Promise<void> {
  error.value = '';
  try { await store.load({ month: month.value || undefined, name: name.value.trim() || undefined }); }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '加载失败'; }
}

async function view(record: ReimbursementSummary): Promise<void> {
  try { await store.loadDetail(record.id); }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '附件加载失败'; }
}

async function toggle(record: ReimbursementSummary): Promise<void> {
  try { await store.updateStatus(record); }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '更新失败'; }
}

async function remove(record: ReimbursementSummary): Promise<void> {
  if (!window.confirm(`确认删除 ${record.name} 的这笔报销吗？此操作无法撤销。`)) return;
  try { await store.remove(record.id); }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '删除失败'; }
}

onMounted(refresh);
</script>

<template>
  <section class="main-col">
    <article class="card">
      <div class="card-title">汇总统计</div>
      <p class="sub">可按月份、姓名筛选，查看附件并更新报销状态。</p>
      <ReimbursementSummaryPanel :records="records" />
    </article>
    <article class="card">
      <div class="card-title">个人报销明细</div>
      <div v-if="personRows.length" class="table-wrap"><table class="table"><thead><tr><th>姓名</th><th>金额</th><th>笔数</th></tr></thead><tbody><tr v-for="[person, row] in personRows" :key="person"><td>{{ person }}</td><td>{{ formatMoney(row.amount) }}</td><td>{{ row.count }}</td></tr></tbody></table></div>
      <div v-else class="empty">暂无数据</div>
    </article>
    <article class="card">
      <div class="filters">
        <div class="f"><label class="form-label">按月份</label><input v-model="month" type="month" /></div>
        <div class="f"><label class="form-label">按姓名</label><input v-model="name" placeholder="输入姓名筛选" @keyup.enter="refresh" /></div>
        <button class="btn btn-ghost btn-sm" type="button" @click="exportCsv(records)">导出 CSV</button>
        <button class="btn btn-primary btn-sm" type="button" @click="refresh">查询</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <ReimbursementTable :loading="loading" :records="records" @remove="remove" @toggle="toggle" @view="view" />
    </article>
    <ReimbursementDetail v-if="detail" :detail="detail" @close="detail = null" />
  </section>
</template>
