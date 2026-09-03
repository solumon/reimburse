<script setup lang="ts">
import type { ReimbursementDetail } from '@reimburse/shared';
import { computed, onMounted, ref } from 'vue';

import { exportDetailWorkbook, exportReimbursementWorkbook, exportVoucherWorkbook } from '@/features/exports/excel-export';
import { loadDetails } from '@/features/exports/export-utils';
import { printReimbursements } from '@/features/exports/print-export';
import { exportClockWord } from '@/features/exports/word-export';
import { exportAttachmentZip } from '@/features/exports/zip-export';
import { reimbursementApi } from '@/features/reimbursements/reimbursement.api';

const summaries = ref<Awaited<ReturnType<typeof reimbursementApi.list>>>([]);
const person = ref('__ALL__');
const busy = ref('');
const error = ref('');
const people = computed(() => [...new Set(summaries.value.map((record) => record.name))].sort());

async function selectedDetails(): Promise<ReimbursementDetail[]> {
  const selected = person.value === '__ALL__'
    ? summaries.value
    : summaries.value.filter((record) => record.name === person.value);
  if (selected.length === 0) throw new Error('没有可导出的报销记录');
  return loadDetails(selected.map((record) => record.id));
}

async function run(label: string, action: (records: ReimbursementDetail[]) => Promise<void> | void): Promise<void> {
  error.value = '';
  busy.value = label;
  try { await action(await selectedDetails()); }
  catch (reason) { error.value = reason instanceof Error ? reason.message : '导出失败'; }
  finally { busy.value = ''; }
}

onMounted(async () => { summaries.value = await reimbursementApi.list(); });
</script>

<template>
  <section class="card export-card">
    <div class="card-title">打印 / 导出报销单</div>
    <p class="sub">选择人员后导出报销单、明细表、凭证、附件包或 Word。大型导出依赖仅在点击时加载。</p>
    <div class="row2">
      <div><label class="form-label" for="export-person">选择人员</label><select id="export-person" v-model="person"><option value="__ALL__">全部人员（每人一份）</option><option v-for="name in people" :key="name" :value="name">{{ name }}</option></select></div>
      <div class="primary-action"><button class="btn btn-primary" :disabled="Boolean(busy)" type="button" @click="run('报销单', exportReimbursementWorkbook)">下载报销单 (xlsx)</button></div>
    </div>
    <div class="actions export-actions">
      <button class="btn btn-ghost btn-sm" :disabled="Boolean(busy)" type="button" @click="run('个人明细', exportDetailWorkbook)">下载个人明细表 (xlsx)</button>
      <button class="btn btn-ghost btn-sm" :disabled="Boolean(busy)" type="button" @click="run('票据凭证', exportVoucherWorkbook)">下载票据凭证 (xlsx)</button>
      <button class="btn btn-ghost btn-sm" :disabled="Boolean(busy)" type="button" @click="run('打卡图', (records) => exportAttachmentZip(records, 'clock'))">批量导出打卡图 (zip)</button>
      <button class="btn btn-ghost btn-sm" :disabled="Boolean(busy)" type="button" @click="run('发票行程单', (records) => exportAttachmentZip(records, 'voucher'))">批量导出发票行程单 (zip)</button>
      <button class="btn btn-ghost btn-sm" :disabled="Boolean(busy)" type="button" @click="run('Word', exportClockWord)">导出全员加班截图（每人 Word）</button>
      <button class="btn btn-ghost btn-sm" :disabled="Boolean(busy)" type="button" @click="run('打印', printReimbursements)">打印预览（报销单）</button>
    </div>
    <p v-if="busy" class="muted">正在生成{{ busy }}…</p>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="rule-item note"><span class="rule-check">i</span><span>附件通过已登录会话流式读取，不会转换为 Base64 API 数据。</span></div>
  </section>
</template>

<style scoped lang="scss">
.export-card { max-width: 760px; }
.primary-action { display: flex; align-items: flex-end; .btn { width: 100%; } }
.export-actions { margin-top: 14px; }
.note { margin-top: 16px; }
</style>
