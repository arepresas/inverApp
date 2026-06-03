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
  background: var(--color-surface);
}

.landing__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12) var(--space-6) var(--space-10);
  text-align: center;
  width: 100%;
  max-width: 32rem;
}

.landing__logo {
  font-size: 3rem;
  margin-bottom: var(--space-4);
  opacity: 0.9;
}

.landing__title {
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0 0 var(--space-2);
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.landing__subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-8);
  line-height: 1.7;
}

.landing__card {
  width: 100%;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-md);
}

.landing__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
}

.landing__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.landing__description {
  margin: 0 0 var(--space-5);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.landing__welcome {
  margin: 0 0 var(--space-5);
  font-size: 1rem;
  color: var(--color-text);
}

.landing__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

.landing__error {
  margin-top: var(--space-4);
  color: var(--color-danger);
  font-size: 0.8125rem;
}

.landing__features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-6);
  padding: var(--space-8) var(--space-6);
  max-width: 56rem;
  width: 100%;
}

.landing__feature {
  text-align: center;
  padding: var(--space-6);
}

.landing__feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  font-size: 1.25rem;
  margin-bottom: var(--space-4);
}

.landing__feature:nth-child(1) .landing__feature-icon { background: var(--color-primary-light); }
.landing__feature:nth-child(2) .landing__feature-icon { background: #fef3c7; }
.landing__feature:nth-child(3) .landing__feature-icon { background: #f3e8ff; }

.landing__feature h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 var(--space-1);
  color: var(--color-text);
}

.landing__feature p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.landing__footer {
  margin-top: auto;
  padding: var(--space-6);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
</style>
