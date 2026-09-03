import type { AuthSession } from '@reimburse/shared';

import { request } from '@/shared/api/http-client';

export const authApi = {
  login: (password: string) => request<void>('/api/v1/auth/login', {
    body: JSON.stringify({ password }),
    method: 'POST',
  }),
  logout: () => request<void>('/api/v1/auth/logout', { method: 'POST' }),
  session: () => request<AuthSession>('/api/v1/auth/session'),
};
