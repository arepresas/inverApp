<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MButton } from '@mozaic-ds/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

onMounted(() => {
  auth.init()
})

async function handleLogin() {
  await auth.signInWithGoogle()
}

async function handleLogout() {
  await auth.signOut()
  router.push('/')
}
</script>

<template>
  <div class="landing">
    <div class="landing__hero">
      <div class="landing__logo">📈</div>
      <h1 class="landing__title">InverApp</h1>
      <p class="landing__subtitle">
        Track your investments.<br />Know your portfolio.
      </p>

      <div class="landing__card">
        <div v-if="auth.loading" class="landing__state">
          <span class="landing__spinner"></span>
          Loading...
        </div>

        <template v-else-if="auth.user">
          <p class="landing__welcome">
            Welcome back, <strong>{{ auth.user.email }}</strong>
          </p>
          <div class="landing__actions">
            <MButton variant="primary" @click="router.push('/dashboard')">
              Go to Dashboard
            </MButton>
            <MButton variant="secondary" @click="handleLogout">
              Sign Out
            </MButton>
          </div>
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
    </div>

    <div class="landing__features">
      <div class="landing__feature">
        <span class="landing__feature-icon">📊</span>
        <h3>Portfolio Tracking</h3>
        <p>Track all your assets in one place — stocks, crypto, ETFs, and more.</p>
      </div>
      <div class="landing__feature">
        <span class="landing__feature-icon">📈</span>
        <h3>Performance Insights</h3>
        <p>See your average costs and total invested at a glance.</p>
      </div>
      <div class="landing__feature">
        <span class="landing__feature-icon">🔒</span>
        <h3>Secure & Private</h3>
        <p>Your data is protected with Google OAuth and row-level security.</p>
      </div>
    </div>

    <footer class="landing__footer">
      <p>InverApp &mdash; Built with Vue &amp; Mozaic</p>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.landing__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 1.5rem 3rem;
  text-align: center;
  width: 100%;
  max-width: 32rem;
}

.landing__logo {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

.landing__title {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.landing__subtitle {
  font-size: 1.125rem;
  color: var(--mu-color-text-secondary, #64748b);
  margin: 0 0 2rem;
  line-height: 1.6;
}

.landing__card {
  width: 100%;
  background: var(--mu-color-surface, #fff);
  border: 1px solid var(--mu-color-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.landing__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--mu-color-text-secondary, #64748b);
}

.landing__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.landing__description {
  margin: 0 0 1.25rem;
  color: var(--mu-color-text-secondary, #64748b);
  line-height: 1.5;
}

.landing__welcome {
  margin: 0 0 1.25rem;
  font-size: 1rem;
}

.landing__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.landing__error {
  margin-top: 1rem;
  color: #ef4444;
  font-size: 0.8125rem;
}

.landing__features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 2rem 1.5rem;
  max-width: 56rem;
  width: 100%;
}

.landing__feature {
  text-align: center;
  padding: 1.5rem;
}

.landing__feature-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.75rem;
}

.landing__feature h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.375rem;
  color: var(--mu-color-text, #0f172a);
}

.landing__feature p {
  font-size: 0.875rem;
  color: var(--mu-color-text-secondary, #64748b);
  margin: 0;
  line-height: 1.5;
}

.landing__footer {
  margin-top: auto;
  padding: 1.5rem;
  color: var(--mu-color-text-secondary, #94a3b8);
  font-size: 0.8125rem;
}
</style>
