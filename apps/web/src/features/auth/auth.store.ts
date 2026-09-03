import { defineStore } from 'pinia';
import { ref } from 'vue';

import { authApi } from './auth.api';

export const useAuthStore = defineStore('auth', () => {
  const authenticated = ref(false);
  const checked = ref(false);

  async function checkSession(): Promise<void> {
    try {
      authenticated.value = (await authApi.session()).authenticated;
    } catch {
      authenticated.value = false;
    } finally {
      checked.value = true;
    }
  }

  async function login(password: string): Promise<void> {
    await authApi.login(password);
    authenticated.value = true;
    checked.value = true;
  }

  async function logout(): Promise<void> {
    await authApi.logout();
    authenticated.value = false;
  }

  window.addEventListener('auth:expired', () => {
    authenticated.value = false;
    checked.value = true;
  });

  return { authenticated, checkSession, checked, login, logout };
});
