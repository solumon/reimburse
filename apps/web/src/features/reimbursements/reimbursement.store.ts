import type { ReimbursementDetail, ReimbursementQuery, ReimbursementSummary } from '@reimburse/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { reimbursementApi } from './reimbursement.api';

export const useReimbursementStore = defineStore('reimbursements', () => {
  const detail = ref<ReimbursementDetail | null>(null);
  const loading = ref(false);
  const query = ref<ReimbursementQuery>({});
  const records = ref<ReimbursementSummary[]>([]);

  async function load(nextQuery: ReimbursementQuery = query.value): Promise<void> {
    loading.value = true;
    query.value = { ...nextQuery };
    try {
      records.value = await reimbursementApi.list(query.value);
    } finally {
      loading.value = false;
    }
  }

  async function loadDetail(id: string): Promise<void> {
    detail.value = await reimbursementApi.detail(id);
  }

  async function updateStatus(record: ReimbursementSummary): Promise<void> {
    await reimbursementApi.updateStatus(record.id, record.status === 'done' ? 'wait' : 'done');
    await load();
  }

  async function remove(id: string): Promise<void> {
    await reimbursementApi.delete(id);
    if (detail.value?.id === id) detail.value = null;
    await load();
  }

  return { detail, load, loadDetail, loading, query, records, remove, updateStatus };
});
