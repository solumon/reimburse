<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

import type { ReimbursementAudit, ReimbursementSummary } from '@reimburse/shared';

import { exportCsv } from '@/features/exports/csv-export';
import ReimbursementAuditDetail from '@/features/reimbursements/ReimbursementAuditDetail.vue';
import ReimbursementDetail from '@/features/reimbursements/ReimbursementDetail.vue';
import ReimbursementSummaryPanel from '@/features/reimbursements/ReimbursementSummary.vue';
import ReimbursementTable from '@/features/reimbursements/ReimbursementTable.vue';
import { reimbursementApi } from '@/features/reimbursements/reimbursement.api';
import { useReimbursementStore } from '@/features/reimbursements/reimbursement.store';

const store = useReimbursementStore();
const { detail, loading, records } = storeToRefs(store);
const auditDetail = ref<ReimbursementAudit | null>(null);
const auditLoadingId = ref<string | null>(null);
const month = ref('');
const name = ref('');
const error = ref('');

async function refresh(): Promise<void> {
  error.value = '';
  try { await store.load({ month: month.value || undefined, name: name.value.trim() || undefined }); }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '加载失败'; }
}

async function view(record: ReimbursementSummary): Promise<void> {
  try { await store.loadDetail(record.id); }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '附件加载失败'; }
}

async function viewAudit(record: ReimbursementSummary): Promise<void> {
  if (!record.hasAudit || auditLoadingId.value !== null) return;
  error.value = '';
  auditDetail.value = null;
  auditLoadingId.value = record.id;
  try { auditDetail.value = await reimbursementApi.audit(record.id); }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '预审详情加载失败'; }
  finally { auditLoadingId.value = null; }
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
      <p class="sub">可按月份、姓名筛选，查看附件与预审结果并更新报销状态。</p>
      <ReimbursementSummaryPanel :records="records" />
    </article>
    <article class="card">
      <div class="filters">
        <div class="f"><label class="form-label">按月份</label><input v-model="month" type="month" /></div>
        <div class="f"><label class="form-label">按姓名</label><input v-model="name" placeholder="输入姓名筛选" @keyup.enter="refresh" /></div>
        <button class="btn btn-ghost btn-sm" type="button" @click="exportCsv(records)">导出 CSV</button>
        <button class="btn btn-primary btn-sm" type="button" @click="refresh">查询</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <ReimbursementTable
        :audit-loading-id="auditLoadingId"
        :loading="loading"
        :records="records"
        @audit="viewAudit"
        @remove="remove"
        @toggle="toggle"
        @view="view"
      />
    </article>
    <ReimbursementDetail v-if="detail" :detail="detail" @close="detail = null" />
    <ReimbursementAuditDetail v-if="auditDetail" :audit="auditDetail" @close="auditDetail = null" />
  </section>
</template>
