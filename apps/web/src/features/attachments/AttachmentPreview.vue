<script setup lang="ts">
import type { Attachment } from '@reimburse/shared';

defineProps<{ attachment: Attachment }>();
defineEmits<{ open: [] }>();
</script>

<template>
  <button class="attachment" type="button" @click="$emit('open')">
    <span v-if="attachment.type === 'pdf'" class="pdf">PDF</span>
    <img v-else :alt="attachment.originalName" :src="attachment.url" loading="lazy" />
    <span class="name">{{ attachment.originalName }}</span>
    <small v-if="attachment.kind === 'clock'">
      {{ attachment.workDate }} {{ attachment.earliest }} - {{ attachment.latest }}
      <template v-if="attachment.hours !== null">· {{ attachment.hours }} 小时</template>
    </small>
  </button>
</template>

<style scoped lang="scss">
.attachment { width: 150px; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; text-align: left; }
img, .pdf { display: grid; width: 100%; height: 96px; place-items: center; object-fit: cover; background: #eef2ff; color: #4f46e5; font-size: 22px; font-weight: 700; }
.name, small { display: block; overflow: hidden; padding: 7px 8px 0; text-overflow: ellipsis; white-space: nowrap; }
small { padding-bottom: 7px; color: #6b7280; font-size: 10px; }
</style>
