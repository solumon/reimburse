<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/features/auth/auth.store';

const authStore = useAuthStore();
const router = useRouter();
const { authenticated } = storeToRefs(authStore);

onMounted(() => authStore.checkSession());

async function logout(): Promise<void> {
  await authStore.logout();
  await router.push('/submit');
}
</script>

<template>
  <div class="container">
    <header class="page-header">
      <div class="brand">
        <div class="logo-badge">报</div>
        <div>
          <div class="brand-name">研发日常零星报销</div>
          <div class="brand-sub">北京天学网教育科技股份有限公司</div>
        </div>
      </div>
      <nav class="nav-tabs" aria-label="主导航">
        <RouterLink class="nav-tab" to="/submit">提交报销</RouterLink>
        <RouterLink class="nav-tab" to="/admin/summary">汇总统计</RouterLink>
        <RouterLink class="nav-tab" to="/admin/export">导出 / 打印</RouterLink>
      </nav>
      <div>
        <button v-if="authenticated" class="btn btn-ghost btn-sm" type="button" @click="logout">
          管理员·退出
        </button>
        <RouterLink v-else class="btn btn-ghost btn-sm" to="/login">管理员登录</RouterLink>
      </div>
    </header>
    <main><RouterView /></main>
  </div>
</template>
