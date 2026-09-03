<script setup lang="ts">
import type { ClockMetadata } from '@reimburse/shared';

import type { PendingAttachment } from './attachment-form';

defineProps<{ item: PendingAttachment; kind: 'clock' | 'voucher' }>();
const emit = defineEmits<{
  remove: [];
  updateMetadata: [metadata: ClockMetadata];
}>();

function update(metadata: ClockMetadata, key: keyof ClockMetadata, value: string): void {
  emit('updateMetadata', {
    ...metadata,
    [key]: key === 'hours' ? (value === '' ? null : Number(value)) : value,
  });
}
</script>

<template>
  <article class="thumb">
    <iframe v-if="item.file.type === 'application/pdf'" :src="item.url" title="PDF 预览" />
    <img v-else :alt="item.file.name" :src="item.url" />
    <button class="remove" type="button" aria-label="删除附件" @click="$emit('remove')">×</button>
    <div v-if="kind === 'clock'" class="metadata">
      <input :value="item.metadata.workDate" aria-label="打卡日期" required type="date" @input="update(item.metadata, 'workDate', ($event.target as HTMLInputElement).value)" />
      <div class="metadata-row">
        <input :value="item.metadata.earliest" aria-label="最早时间" required type="time" @input="update(item.metadata, 'earliest', ($event.target as HTMLInputElement).value)" />
        <input :value="item.metadata.latest" aria-label="最晚时间" required type="time" @input="update(item.metadata, 'latest', ($event.target as HTMLInputElement).value)" />
      </div>
      <input :value="item.metadata.hours ?? ''" aria-label="工时" max="24" min="0" required step="0.1" type="number" placeholder="工时" @input="update(item.metadata, 'hours', ($event.target as HTMLInputElement).value)" />
    </div>
  </article>
</template>

<style scoped lang="scss">
.thumb { position: relative; width: 160px; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; }
img, iframe { display: block; width: 100%; height: 96px; border: 0; object-fit: cover; }
.remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border: 0; border-radius: 50%; background: rgb(0 0 0 / 65%); color: #fff; }
.metadata { display: flex; flex-direction: column; gap: 6px; padding: 8px; border-top: 1px solid #e5e7eb; background: #fafafa; }
.metadata input { padding: 5px 7px; font-size: 12px; }
.metadata-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
</style>
