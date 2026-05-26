<script setup lang="ts">
import { onMounted } from 'vue'
import { MButton, MPageHeader } from '@mozaic-ds/vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  auth.init()
})

async function handleLogout() {
  await auth.signOut()
  router.push('/')
}

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <MPageHeader title="InverApp">
    <template v-if="auth.user" #actions>
      <nav class="app-header__nav">
        <router-link to="/dashboard" class="app-header__link" :class="{ 'app-header__link--active': isActive('/dashboard') }">Dashboard</router-link>
        <router-link to="/buy" class="app-header__link" :class="{ 'app-header__link--active': isActive('/buy') }">Buy</router-link>
        <router-link to="/transactions" class="app-header__link" :class="{ 'app-header__link--active': isActive('/transactions') }">History</router-link>
      </nav>
      <span class="app-header__email">{{ auth.user.email }}</span>
      <MButton variant="secondary" size="s" @click="handleLogout">Logout</MButton>
    </template>
  </MPageHeader>
</template>

<style scoped>
.app-header__nav {
  display: flex;
  gap: 0.25rem;
  margin-right: 1rem;
}

.app-header__link {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  text-decoration: none;
  color: var(--mu-color-text-secondary, #64748b);
  font-size: 0.8125rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.app-header__link:hover {
  background: var(--mu-color-surface-hover, #f1f5f9);
  color: var(--mu-color-text, #0f172a);
}

.app-header__link--active {
  background: var(--mu-color-primary, #3b82f6);
  color: #fff;
}

.app-header__email {
  font-size: 0.8125rem;
  color: var(--mu-color-text-secondary, #64748b);
  margin-right: 0.5rem;
}
</style>
