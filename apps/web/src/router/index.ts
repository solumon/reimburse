import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '@/features/auth/auth.store';
import ExportView from '@/views/ExportView.vue';
import LoginView from '@/views/LoginView.vue';
import SubmitView from '@/views/SubmitView.vue';
import SummaryView from '@/views/SummaryView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/submit' },
    { component: SubmitView, path: '/submit' },
    { component: SummaryView, meta: { requiresAdmin: true }, path: '/admin/summary' },
    { component: ExportView, meta: { requiresAdmin: true }, path: '/admin/export' },
    { component: LoginView, path: '/login' },
    { path: '/:pathMatch(.*)*', redirect: '/submit' },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  if (!authStore.checked) await authStore.checkSession();
  if (to.meta.requiresAdmin && !authStore.authenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.path === '/login' && authStore.authenticated) return '/admin/summary';
  return true;
});
