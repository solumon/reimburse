import type {
  CreateReimbursementResponse,
  ReimbursementDetail,
  ReimbursementQuery,
  ReimbursementStatus,
  ReimbursementSummary,
} from '@reimburse/shared';

import { request } from '@/shared/api/http-client';

export const reimbursementApi = {
  create: (body: FormData) => request<CreateReimbursementResponse>('/api/v1/reimbursements', {
    body,
    method: 'POST',
  }),
  delete: (id: string) => request<void>(`/api/v1/reimbursements/${id}`, { method: 'DELETE' }),
  detail: (id: string) => request<ReimbursementDetail>(`/api/v1/reimbursements/${id}`),
  list: (query: ReimbursementQuery = {}) => {
    const parameters = new URLSearchParams();
    if (query.month) parameters.set('month', query.month);
    if (query.name) parameters.set('name', query.name);
    if (query.status) parameters.set('status', query.status);
    const suffix = parameters.size > 0 ? `?${parameters}` : '';
    return request<ReimbursementSummary[]>(`/api/v1/reimbursements${suffix}`);
  },
  updateStatus: (id: string, status: ReimbursementStatus) => request<ReimbursementSummary>(
    `/api/v1/reimbursements/${id}/status`,
    { body: JSON.stringify({ status }), method: 'PATCH' },
  ),
};
