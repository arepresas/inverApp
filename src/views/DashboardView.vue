<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MLoader, MStatusNotification, MTile } from '@mozaic-ds/vue'
import { usePortfolioStore } from '@/stores/portfolio'
import PortfolioTable from '@/components/PortfolioTable.vue'
import AppHeader from '@/components/AppHeader.vue'
import type { PortfolioRow } from '@/types/portfolio'

const portfolio = usePortfolioStore()
const router = useRouter()

onMounted(() => {
  portfolio.fetchPortfolio()
})

function handleSell(asset: PortfolioRow) {
  router.push({
    name: 'sell',
    query: {
      asset_id: asset.asset_id,
      symbol: asset.symbol,
      name: asset.name,
      max_qty: String(asset.quantity),
    },
  })
}

function formatCurrency(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(value)
}

function formatInvested() {
  const byCurrency = portfolio.totalInvestedByCurrency
  if (Object.keys(byCurrency).length === 1) {
    const [cur, val] = Object.entries(byCurrency)[0]
    return formatCurrency(val, cur)
  }
  return Object.entries(byCurrency)
    .map(([cur, val]) => formatCurrency(val, cur))
    .join(' + ')
}
</script>

<template>
  <div class="dashboard">
    <AppHeader />

    <main class="dashboard__main">
      <MLoader v-if="portfolio.loading" size="m" text="Loading portfolio..." />

      <template v-else>
        <!-- Error -->
        <MStatusNotification
          v-if="portfolio.error"
          status="error"
          :title="portfolio.error"
          description=""
        />

        <!-- Summary cards -->
        <div class="dashboard__summary">
          <MTile bordered class="dashboard__card">
            <span class="dashboard__card-icon">💰</span>
            <div>
              <span class="dashboard__card-value">{{ formatInvested() }}</span>
              <span class="dashboard__card-label">Total Invested</span>
            </div>
          </MTile>
          <MTile bordered class="dashboard__card">
            <span class="dashboard__card-icon">📦</span>
            <div>
              <span class="dashboard__card-value">{{ portfolio.holdingsCount }}</span>
              <span class="dashboard__card-label">Holdings</span>
            </div>
          </MTile>
        </div>

        <h2 class="dashboard__heading">Your Portfolio</h2>
        <PortfolioTable
          :holdings="portfolio.holdings"
          @sell="handleSell"
        />
      </template>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--mu-color-surface, #f8fafc);
}

.dashboard__main {
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.dashboard__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.dashboard__card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dashboard__card-icon {
  font-size: 1.75rem;
}

.dashboard__card-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--mu-color-text, #0f172a);
}

.dashboard__card-label {
  font-size: 0.75rem;
  color: var(--mu-color-text-secondary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dashboard__heading {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem;
}
</style>
