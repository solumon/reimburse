import { onBeforeUnmount, ref, watch, type Ref } from 'vue';

export function useAttachmentUrl(file: Ref<File | null>) {
  const url = ref('');
  watch(file, (next) => {
    if (url.value) URL.revokeObjectURL(url.value);
    url.value = next ? URL.createObjectURL(next) : '';
  }, { immediate: true });
  onBeforeUnmount(() => {
    if (url.value) URL.revokeObjectURL(url.value);
  });
  return url;
}
