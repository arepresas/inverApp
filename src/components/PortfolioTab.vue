<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { MLoader, MStatusNotification, MTile } from '@mozaic-ds/vue'
import { getNumberLocale } from '@/lib/locale'
import { usePortfolioStore } from '@/stores/portfolio'
import PortfolioTable from '@/components/PortfolioTable.vue'
import type { PortfolioRow } from '@/types/portfolio'

const portfolio = usePortfolioStore()
const router = useRouter()

const currentValue = computed(() =>
  portfolio.enrichedHoldings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0),
)

const unrealizedPnl = computed(() =>
  portfolio.enrichedHoldings.reduce((sum, h) => sum + (h.unrealizedPnl ?? 0), 0),
)

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat(getNumberLocale(), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(value)
}

function formatRealizedPnl() {
  const byCurrency = portfolio.realizedPnlByCurrency
  if (!Object.keys(byCurrency).length) return formatCurrency(0)
  if (Object.keys(byCurrency).length === 1) {
    const [cur, val] = Object.entries(byCurrency)[0] as [string, number]
    return formatCurrency(val, cur)
  }
  return (Object.entries(byCurrency) as [string, number][])
    .map(([cur, val]) => formatCurrency(val, cur))
    .join(' + ')
}

function formatInvested() {
  const byCurrency = portfolio.totalInvestedByCurrency
  if (!Object.keys(byCurrency).length) return formatCurrency(0)
  if (Object.keys(byCurrency).length === 1) {
    const [cur, val] = Object.entries(byCurrency)[0] as [string, number]
    return formatCurrency(val, cur)
  }
  return (Object.entries(byCurrency) as [string, number][])
    .map(([cur, val]) => formatCurrency(val, cur))
    .join(' + ')
}

function pnlValueClass(value: number) {
  if (value > 0) return 'text--gain'
  if (value < 0) return 'text--loss'
  return ''
}

function handleBuy(asset: PortfolioRow) {
  router.push({
    path: '/buy',
    query: { symbol: asset.symbol, name: asset.name, asset_type: asset.asset_type, currency: asset.currency },
  })
}

function handleSell(asset: PortfolioRow) {
  router.push({
    path: '/sell',
    query: { asset_id: asset.asset_id, symbol: asset.symbol, name: asset.name, max_qty: String(asset.quantity) },
  })
}
</script>

<template>
  <div class="tab">
    <MLoader v-if="portfolio.loading" size="m" text="Loading portfolio..." />

    <template v-else>
      <MStatusNotification
        v-if="portfolio.error"
        status="error"
        :title="portfolio.error"
        description=""
      />

      <div class="tab__summary">
        <MTile bordered class="tab__card">
          <span class="tab__card-icon tab__card-icon--value">$</span>
          <div class="tab__card-info">
            <span class="tab__card-value">{{ formatCurrency(currentValue) }}</span>
            <span class="tab__card-label">Current Value</span>
          </div>
        </MTile>
        <MTile bordered class="tab__card">
          <span class="tab__card-icon tab__card-icon--unrealized">%</span>
          <div class="tab__card-info">
            <span class="tab__card-value" :class="pnlValueClass(unrealizedPnl)">
              {{ formatCurrency(unrealizedPnl) }}
            </span>
            <span class="tab__card-label">Unrealized P&amp;L</span>
          </div>
        </MTile>
        <MTile bordered class="tab__card">
          <span class="tab__card-icon tab__card-icon--realized">+</span>
          <div class="tab__card-info">
            <span class="tab__card-value">{{ formatRealizedPnl() }}</span>
            <span class="tab__card-label">Realized P&amp;L</span>
          </div>
        </MTile>
        <MTile bordered class="tab__card">
          <span class="tab__card-icon tab__card-icon--invested">↓</span>
          <div class="tab__card-info">
            <span class="tab__card-value">{{ formatInvested() }}</span>
            <span class="tab__card-label">Total Invested</span>
          </div>
        </MTile>
      </div>

      <h2 class="tab__heading">Your Portfolio</h2>
      <PortfolioTable
        :holdings="portfolio.enrichedHoldings"
        :prices-loading="portfolio.pricesLoading"
        @buy="handleBuy"
        @sell="handleSell"
      />
    </template>
  </div>
</template>

<style scoped>
.tab__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}
.tab__card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.tab__card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-sm);
  font-size: 1.25rem;
  flex-shrink: 0;
}
.tab__card-icon--value { background: var(--color-primary-light); }
.tab__card-icon--unrealized { background: var(--color-warning-bg); }
.tab__card-icon--realized { background: var(--color-success-bg); }
.tab__card-icon--invested { background: var(--color-purple-bg); }
.tab__card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tab__card-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.01em;
}
.tab__card-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.tab__heading {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 var(--space-4);
  color: var(--color-text);
}
</style>
