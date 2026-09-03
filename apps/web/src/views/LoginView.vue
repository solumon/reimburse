<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@/features/auth/auth.store';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit(): Promise<void> {
  error.value = '';
  loading.value = true;
  try {
    await authStore.login(password.value);
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/admin/summary';
    await router.replace(redirect);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="card login-card">
    <div class="card-title">管理员登录</div>
    <p class="sub">管理员会话仅保存在 HttpOnly Cookie 中，页面不会存储密码。</p>
    <form @submit.prevent="submit">
      <label class="form-label" for="admin-password">管理员密码</label>
      <input id="admin-password" v-model="password" autocomplete="current-password" required type="password" />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn btn-primary login-button" :disabled="loading" type="submit">
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </form>
  </section>
</template>

<style scoped lang="scss">
.login-card { max-width: 420px; margin: 60px auto; }
.login-button { width: 100%; margin-top: 16px; }
</style>
