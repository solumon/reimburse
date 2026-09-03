<script setup lang="ts">
import type { Attachment } from '@reimburse/shared';

defineProps<{ attachment: Attachment | null }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <div v-if="attachment" class="lightbox" role="dialog" aria-modal="true" @click.self="$emit('close')">
    <button class="close" type="button" @click="$emit('close')">×</button>
    <iframe v-if="attachment.type === 'pdf'" :src="attachment.url" :title="attachment.originalName" />
    <img v-else :alt="attachment.originalName" :src="attachment.url" />
    <a class="download" :href="`${attachment.url}?download=1`">下载附件</a>
  </div>
</template>

<style scoped lang="scss">
.lightbox { position: fixed; inset: 0; z-index: 90; display: flex; align-items: center; justify-content: center; padding: 60px 40px; background: rgb(0 0 0 / 90%); }
img, iframe { width: min(1100px, 100%); max-height: calc(100vh - 120px); border: 0; border-radius: 8px; object-fit: contain; background: #fff; }
iframe { height: calc(100vh - 120px); }
.close { position: absolute; top: 16px; right: 16px; width: 40px; height: 40px; border: 0; border-radius: 50%; background: rgb(255 255 255 / 18%); color: #fff; font-size: 24px; }
.download { position: absolute; bottom: 16px; padding: 8px 16px; border-radius: 8px; background: #4f46e5; color: #fff; text-decoration: none; }
</style>
