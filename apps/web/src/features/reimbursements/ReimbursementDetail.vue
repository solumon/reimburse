<script setup lang="ts">
import type { Attachment, ReimbursementDetail } from '@reimburse/shared';
import { ref } from 'vue';

import AttachmentLightbox from '@/features/attachments/AttachmentLightbox.vue';
import AttachmentPreview from '@/features/attachments/AttachmentPreview.vue';
import { formatDate, formatMoney } from '@/shared/utils/format';

defineProps<{ detail: ReimbursementDetail }>();
defineEmits<{ close: [] }>();
const current = ref<Attachment | null>(null);
</script>

<template>
  <div class="modal" role="dialog" aria-modal="true" @click.self="$emit('close')">
    <article class="modal-card">
      <header><h2>{{ detail.name }}·{{ formatMoney(detail.amount) }}</h2><button class="btn btn-ghost btn-sm" type="button" @click="$emit('close')">关闭</button></header>
      <p class="muted">{{ formatDate(detail.createdAt) }}·{{ detail.note }}</p>
      <h3>打卡截图</h3>
      <div class="attachments"><AttachmentPreview v-for="item in detail.attachments.filter((attachment) => attachment.kind === 'clock')" :key="item.id" :attachment="item" @open="current = item" /></div>
      <h3>发票与行程单</h3>
      <div class="attachments"><AttachmentPreview v-for="item in detail.attachments.filter((attachment) => attachment.kind === 'voucher')" :key="item.id" :attachment="item" @open="current = item" /></div>
    </article>
    <AttachmentLightbox :attachment="current" @close="current = null" />
  </div>
</template>

<style scoped lang="scss">
.modal { position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgb(0 0 0 / 50%); }
.modal-card { width: min(720px, 100%); max-height: 88vh; overflow: auto; padding: 22px; border-radius: 12px; background: #fff; box-shadow: 0 20px 60px rgb(0 0 0 / 20%); }
header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
h2 { font-size: 17px; } h3 { margin: 20px 0 10px; font-size: 14px; }
.attachments { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 10px; }
</style>
