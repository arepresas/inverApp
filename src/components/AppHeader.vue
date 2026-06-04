<script setup lang="ts">
import { onMounted } from 'vue'
import { MPageHeader, MPopover, MButton } from '@mozaic-ds/vue'
import { Settings32, LogOut32, ChevronDown32 } from '@mozaic-ds/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  auth.init()
})

function goSettings() {
  router.push('/settings')
}

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
      </nav>

      <MPopover position="bottom" appearance="standard" :pointer="true" size="s" :closable="false">
        <template #activator="{ id }">
          <button type="button" class="app-header__user-btn" :popovertarget="id">
            <span class="app-header__avatar">{{ auth.user.email?.[0]?.toUpperCase() }}</span>
            <span class="app-header__email">{{ auth.user.email }}</span>
            <ChevronDown32 class="app-header__chevron" />
          </button>
        </template>
        <div class="app-header__menu">
          <div class="app-header__menu-header">{{ auth.user.email }}</div>
          <div class="app-header__menu-divider" />
          <MButton appearance="standard" size="s" ghost icon-position="left" class="app-header__menu-btn" @click="goSettings">
            <template #icon>
              <Settings32 />
            </template>
            Settings
          </MButton>
          <button type="button" class="app-header__menu-item app-header__menu-item--danger" @click="handleLogout">
            <LogOut32 />
            Sign out
          </button>
        </div>
      </MPopover>
    </template>
  </MPageHeader>
</template>

<style>
/* Unscoped — MPopover teleports content to body */

.app-header__user-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 10px var(--space-1) var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-card);
  font-family: inherit;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.app-header__user-btn:hover {
  border-color: #d4d4d4;
  box-shadow: var(--shadow-sm);
}

.app-header__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
}

.app-header__email {
  font-size: 0.8125rem;
  color: var(--color-text);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__chevron {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  color: var(--color-text-muted);
}

/* Menu inside popover */
.app-header__menu {
  min-width: 200px;
  padding: var(--space-1);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-header__menu-header {
  padding: var(--space-2) var(--space-3) var(--space-1);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__menu-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-1) 0;
}

.app-header__menu-btn {
  justify-content: flex-start !important;
  width: 100%;
}

.app-header__menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;
}

.app-header__menu-item svg {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
}

.app-header__menu-item:hover {
  background: var(--color-card-hover);
}

.app-header__menu-item--danger:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.app-header__menu-item--danger:hover svg {
  color: var(--color-danger);
}
</style>

<style scoped>
.app-header__nav {
  display: flex;
  gap: var(--space-1);
  margin-right: var(--space-4);
}

.app-header__link {
  padding: 6px var(--space-3);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.app-header__link:hover {
  background: var(--color-card-hover);
  color: var(--color-text);
}

.app-header__link--active {
  background: var(--color-primary);
  color: #fff;
}
</style>
