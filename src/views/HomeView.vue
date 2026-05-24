<script setup lang="ts">
import { onMounted } from 'vue'
import { MButton } from '@mozaic-ds/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  auth.init()
})

function handleLogin() {
  auth.signInWithGoogle()
}

function handleLogout() {
  auth.signOut()
}
</script>

<template>
  <div class="landing">
    <header class="landing__header">
      <h1 class="landing__title">InverApp</h1>
      <p class="landing__subtitle">Track your investments. Know your portfolio.</p>
    </header>

    <main class="landing__main">
      <div class="landing__card">
        <div v-if="auth.loading" class="landing__loading">
          Loading...
        </div>

        <template v-else-if="auth.user">
          <p class="landing__welcome">
            Welcome, <strong>{{ auth.user.email }}</strong>
          </p>
          <MButton variant="primary" @click="handleLogout">
            Sign Out
          </MButton>
        </template>

        <template v-else>
          <p class="landing__description">
            Log in with your Google account to start tracking your investments.
          </p>
          <MButton variant="primary" @click="handleLogin">
            Login with Google
          </MButton>
          <p v-if="auth.error" class="landing__error">{{ auth.error }}</p>
        </template>
      </div>
    </main>

    <footer class="landing__footer">
      <p>InverApp &mdash; Built with Vue &amp; Mozaic</p>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.landing__header {
  margin-bottom: 2rem;
}

.landing__title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.landing__subtitle {
  font-size: 1.125rem;
  color: var(--mu-color-text-secondary, #666);
  margin: 0;
}

.landing__main {
  width: 100%;
  max-width: 28rem;
}

.landing__card {
  background: var(--mu-color-surface, #fff);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.landing__description {
  margin: 0 0 1.5rem;
  color: var(--mu-color-text-secondary, #666);
  line-height: 1.5;
}

.landing__welcome {
  margin: 0 0 1.5rem;
}

.landing__loading {
  padding: 1rem;
  color: var(--mu-color-text-secondary, #666);
}

.landing__error {
  margin-top: 1rem;
  color: var(--mu-color-error, #d32f2f);
  font-size: 0.875rem;
}

.landing__footer {
  margin-top: 3rem;
  color: var(--mu-color-text-secondary, #666);
  font-size: 0.875rem;
}
</style>
