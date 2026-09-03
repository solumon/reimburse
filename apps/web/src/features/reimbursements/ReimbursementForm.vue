<script setup lang="ts">
import { ref } from 'vue';

import AttachmentUploader from '@/features/attachments/AttachmentUploader.vue';
import type { PendingAttachment } from '@/features/attachments/attachment-form';

import { reimbursementApi } from './reimbursement.api';

const emit = defineEmits<{ submitted: [] }>();
const name = ref(localStorage.getItem('reimburse_submitter_name') ?? '');
const amount = ref<number | null>(null);
const note = ref('');
const clockFiles = ref<PendingAttachment[]>([]);
const voucherFiles = ref<PendingAttachment[]>([]);
const loading = ref(false);
const error = ref('');
const success = ref('');

function validate(): string {
  if (!name.value.trim()) return '请填写姓名';
  if (!amount.value || amount.value <= 0) return '请填写有效报销金额';
  if (clockFiles.value.length === 0) return '请上传企微打卡截图';
  if (voucherFiles.value.length === 0) return '请上传发票或行程单';
  if (!note.value.trim()) return '请填写备注';
  const missing = clockFiles.value.some(({ metadata }) => (
    !metadata.workDate || !metadata.earliest || !metadata.latest || metadata.hours === null
  ));
  return missing ? '请补全每张打卡图的日期、时间和工时' : '';
}

async function submit(): Promise<void> {
  error.value = validate();
  success.value = '';
  if (error.value) return;
  loading.value = true;
  try {
    const body = new FormData();
    body.set('name', name.value.trim());
    body.set('amount', String(amount.value));
    body.set('note', note.value.trim());
    body.set('clockMetadata', JSON.stringify(clockFiles.value.map((item) => item.metadata)));
    clockFiles.value.forEach((item) => body.append('clockFiles', item.file));
    voucherFiles.value.forEach((item) => body.append('voucherFiles', item.file));
    await reimbursementApi.create(body);
    localStorage.setItem('reimburse_submitter_name', name.value.trim());
    [...clockFiles.value, ...voucherFiles.value].forEach((item) => URL.revokeObjectURL(item.url));
    amount.value = null;
    note.value = '';
    clockFiles.value = [];
    voucherFiles.value = [];
    success.value = '报销申请已提交';
    emit('submitted');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '提交失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <div class="form-group">
      <label class="form-label" for="submit-name">姓名<span class="req">*</span></label>
      <input id="submit-name" v-model="name" maxlength="40" placeholder="如：张三" required />
    </div>
    <div class="form-group">
      <label class="form-label" for="submit-amount">报销金额（元）<span class="req">*</span></label>
      <input id="submit-amount" v-model.number="amount" min="0.01" step="0.01" type="number" placeholder="如：58.50（合计）" required />
    </div>
    <div class="form-group">
      <label class="form-label">企微打卡截图（证明晚于 22:00 下班）<span class="req">*</span></label>
      <AttachmentUploader v-model="clockFiles" accept="image/*" kind="clock" :max-count="40" />
    </div>
    <div class="form-group">
      <label class="form-label">打车发票 & 行程单<span class="req">*</span></label>
      <AttachmentUploader v-model="voucherFiles" accept="application/pdf,image/*" kind="voucher" :max-count="20" />
    </div>
    <div class="form-group">
      <label class="form-label" for="submit-note">备注<span class="req">*</span></label>
      <textarea id="submit-note" v-model="note" maxlength="2000" placeholder="如：项目A 紧急上线，加班至 23:40（可注明多日明细）" required />
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
    <button class="btn btn-primary submit-button" :disabled="loading" type="submit">
      {{ loading ? '提交中…' : '提交报销申请' }}
    </button>
  </form>
</template>

<style scoped lang="scss">
.submit-button { width: 100%; margin-top: 4px; }
</style>
