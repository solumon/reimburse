<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

import PendingAttachmentPreview from './PendingAttachmentPreview.vue';
import { emptyClockMetadata, type PendingAttachment } from './attachment-form';
import { compressImage } from './use-image-compression';

const props = defineProps<{
  accept: string;
  kind: 'clock' | 'voucher';
  maxCount: number;
  modelValue: PendingAttachment[];
}>();
const emit = defineEmits<{ 'update:modelValue': [items: PendingAttachment[]] }>();
const input = ref<HTMLInputElement | null>(null);
const busy = ref(false);

async function select(event: Event): Promise<void> {
  const selected = Array.from((event.target as HTMLInputElement).files ?? []);
  if (selected.length === 0) return;
  busy.value = true;
  try {
    const available = Math.max(0, props.maxCount - props.modelValue.length);
    const converted = await Promise.all(selected.slice(0, available).map(async (file) => {
      const next = await compressImage(file);
      return { file: next, metadata: emptyClockMetadata(), url: URL.createObjectURL(next) };
    }));
    emit('update:modelValue', [...props.modelValue, ...converted]);
  } finally {
    busy.value = false;
    if (input.value) input.value.value = '';
  }
}

function remove(index: number): void {
  URL.revokeObjectURL(props.modelValue[index]!.url);
  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
}

onBeforeUnmount(() => props.modelValue.forEach((item) => URL.revokeObjectURL(item.url)));
</script>

<template>
  <div>
    <button class="upload" type="button" :disabled="busy" @click="input?.click()">
      <span class="upload-icon">⇧</span>
      <span>{{ busy ? '处理中…' : (kind === 'clock' ? '点击上传打卡截图' : '点击上传发票与行程单') }}</span>
      <small>{{ kind === 'clock' ? `最多 ${maxCount} 张` : `支持 PDF / 图片，最多 ${maxCount} 个` }}</small>
    </button>
    <input ref="input" hidden multiple type="file" :accept="accept" @change="select" />
    <div class="previews">
      <PendingAttachmentPreview
        v-for="(item, index) in modelValue"
        :key="item.url"
        :item="item"
        :kind="kind"
        @remove="remove(index)"
        @update-metadata="(metadata) => emit('update:modelValue', modelValue.map((current, itemIndex) => itemIndex === index ? { ...current, metadata } : current))"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.upload { display: flex; width: 100%; flex-direction: column; align-items: center; gap: 4px; padding: 24px; border: 1px dashed #d1d5db; border-radius: 8px; background: #fafafa; color: #374151;
  &:hover { border-color: #4f46e5; background: #f5f3ff; }
  small { color: #9ca3af; }
}
.upload-icon { color: #9ca3af; font-size: 28px; }
.previews { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-top: 10px; }
</style>
