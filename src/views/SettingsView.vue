<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { MStatusNotification } from '@mozaic-ds/vue'
import AppHeader from '@/components/AppHeader.vue'
import { useSettingsStore, COUNTRIES } from '@/stores/settings'

const FLAGS: Record<string, string> = {
  FR: '🇫🇷', ES: '🇪🇸', US: '🇺🇸', DE: '🇩🇪',
  IT: '🇮🇹', UK: '🇬🇧', JP: '🇯🇵', BR: '🇧🇷',
  MX: '🇲🇽', CN: '🇨🇳', KR: '🇰🇷', IN: '🇮🇳',
  CA: '🇨🇦', AU: '🇦🇺',
}

const CURRENCY: Record<string, string> = {
  FR: 'EUR', ES: 'EUR', DE: 'EUR', IT: 'EUR',
  US: 'USD', UK: 'GBP', JP: 'JPY', BR: 'BRL',
  MX: 'MXN', CN: 'CNY', KR: 'KRW', IN: 'INR',
  CA: 'CAD', AU: 'AUD',
}

const settings = useSettingsStore()

onMounted(() => {
  settings.fetchProfile()
})

const selectedCountry = computed(() =>
  COUNTRIES.find((c) => c.code === settings.country) ?? null,
)

function formatPreview(locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(12345.67)
}

function selectCountry(code: string) {
  if (settings.loading) return
  settings.saveCountry(code)
}
</script>

<template>
  <AppHeader />
  <div class="settings-page">
    <div class="settings">
    <header class="settings__header">
      <h1 class="settings__heading">Settings</h1>
      <p class="settings__subtitle">
        Choose your country to set number and currency formatting across the app.
      </p>
    </header>

    <MStatusNotification
      v-if="settings.error"
      title="Could not save"
      :description="settings.error"
      status="error"
      class="settings__error"
    />

    <section class="settings__section">
      <h2 class="settings__label">Country &amp; Locale</h2>

      <div v-if="selectedCountry" class="settings__active-badge">
        <span class="settings__active-flag">{{ FLAGS[selectedCountry.code] }}</span>
        <span class="settings__active-name">{{ selectedCountry.name }}</span>
        <span class="settings__active-locale">{{ selectedCountry.locale }}</span>
        <span class="settings__active-preview">{{ formatPreview(selectedCountry.locale, CURRENCY[selectedCountry.code]) }}</span>
      </div>

      <div class="settings__grid">
        <button
          v-for="c in COUNTRIES"
          :key="c.code"
          class="settings__card"
          :class="{ 'settings__card--active': settings.country === c.code }"
          :disabled="settings.loading"
          @click="selectCountry(c.code)"
        >
          <span class="settings__card-flag">{{ FLAGS[c.code] }}</span>
          <span class="settings__card-name">{{ c.name }}</span>
          <span class="settings__card-locale">{{ c.locale }}</span>
          <span class="settings__card-preview">{{ formatPreview(c.locale, CURRENCY[c.code]) }}</span>
        </button>
      </div>
    </section>

    <footer class="settings__footer">
      <span class="settings__footer-icon">◈</span>
      <span>Changes saved automatically</span>
    </footer>
  </div>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: var(--color-surface);
}

.settings {
  max-width: 860px;
  margin: 0 auto;
  padding: var(--space-10) var(--space-6) var(--space-12);
}

.settings__header {
  margin-bottom: var(--space-8);
}

.settings__heading {
  margin: 0 0 var(--space-1);
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.settings__subtitle {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.settings__error {
  margin-bottom: var(--space-6);
}

.settings__section {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
}

.settings__label {
  margin: 0 0 var(--space-5);
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

/* Active badge */
.settings__active-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  margin-bottom: var(--space-6);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 500;
}

.settings__active-flag {
  font-size: 1.125rem;
}

.settings__active-preview {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  opacity: 0.85;
  margin-left: var(--space-1);
}

/* Grid */
.settings__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-3);
}

/* Card */
.settings__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: var(--space-4);
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  font-family: inherit;
  text-align: left;
  width: 100%;
}

.settings__card:hover:not(:disabled) {
  border-color: var(--color-primary);
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.12);
  transform: translateY(-2px);
}

.settings__card:active:not(:disabled) {
  transform: translateY(0);
}

.settings__card--active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

.settings__card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings__card-flag {
  font-size: 1.75rem;
  line-height: 1;
}

.settings__card-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.settings__card-locale {
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
}

.settings__card-preview {
  font-size: 0.75rem;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* Footer */
.settings__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-8);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.settings__footer-icon {
  font-size: 0.625rem;
  opacity: 0.4;
}
</style>
