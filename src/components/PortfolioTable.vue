<script setup lang="ts">
import { MButton, MTile, MLoader } from '@mozaic-ds/vue'
import { useRouter } from 'vue-router'
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'
import type { PortfolioRow } from '@/types/portfolio'

type EnrichedRow = PortfolioRow & {
  currentPrice: number | null
  currentValue: number | null
  unrealizedPnl: number | null
}

const router = useRouter()

defineProps<{
  holdings: EnrichedRow[]
  pricesLoading?: boolean
}>()

const emit = defineEmits<{
  buy: [asset: PortfolioRow]
  sell: [asset: PortfolioRow]
}>()

const headers = [
  { label: 'Asset', value: 'symbol' },
  { label: 'Name', value: 'name' },
  { label: 'Quantity', value: 'quantity' },
  { label: 'Avg Cost', value: 'average_cost' },
  { label: 'Price', value: 'currentPrice' },
  { label: 'Value', value: 'currentValue' },
  { label: 'P&L', value: 'unrealizedPnl' },
  { label: '', value: 'actions', sortable: false },
]

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value)
}

function pnlClass(value: number | null) {
  if (value == null) return 'portfolio-pnl--none'
  if (value > 0) return 'portfolio-pnl--gain'
  if (value < 0) return 'portfolio-pnl--loss'
  return 'portfolio-pnl--none'
}
</script>

<template>
  <MTile v-if="!holdings.length" bordered class="portfolio-empty">
    <div class="portfolio-empty__content">
      <span class="portfolio-empty__icon">📊</span>
      <h3>No holdings yet</h3>
      <p>Start by adding your first purchase.</p>
      <MButton variant="primary" @click="router.push('/buy')">Buy your first asset</MButton>
    </div>
  </MTile>

  <div v-else>
    <MLoader v-if="pricesLoading" size="s" text="Fetching prices..." class="portfolio-prices-loader" />

    <MDataTable :items="holdings" :headers="headers">
      <template #cell.quantity="{ item }">
        {{ formatQuantity(item.quantity) }}
      </template>
      <template #cell.average_cost="{ item }">
        {{ formatCurrency(item.average_cost, item.currency) }}
      </template>
      <template #cell.currentPrice="{ item }">
        <span v-if="item.currentPrice != null">
          {{ formatCurrency(item.currentPrice, item.currency) }}
        </span>
        <span v-else class="portfolio-pnl--none">—</span>
      </template>
      <template #cell.currentValue="{ item }">
        <span v-if="item.currentValue != null">
          {{ formatCurrency(item.currentValue, item.currency) }}
        </span>
        <span v-else class="portfolio-pnl--none">—</span>
      </template>
      <template #cell.unrealizedPnl="{ item }">
        <span :class="pnlClass(item.unrealizedPnl)">
          {{ item.unrealizedPnl != null ? formatCurrency(item.unrealizedPnl, item.currency) : '—' }}
        </span>
      </template>
      <template #cell.actions="{ item }">
        <div class="portfolio-actions">
          <MButton variant="secondary" size="s" @click="emit('buy', item)">Buy</MButton>
          <MButton variant="secondary" size="s" @click="emit('sell', item)">Sell</MButton>
        </div>
      </template>
    </MDataTable>
  </div>
</template>

<style scoped>
.portfolio-empty__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  text-align: center;
}

.portfolio-empty__icon {
  font-size: 2.5rem;
}

.portfolio-empty__content h3 {
  margin: 0;
  font-size: 1.125rem;
}

.portfolio-empty__content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--mu-color-text-secondary, #64748b);
}

.portfolio-prices-loader {
  margin-bottom: 0.75rem;
}

.portfolio-actions {
  display: flex;
  gap: 0.375rem;
}

.portfolio-pnl--gain {
  color: #16a34a;
  font-weight: 600;
}

.portfolio-pnl--loss {
  color: #dc2626;
  font-weight: 600;
}

.portfolio-pnl--none {
  color: var(--mu-color-text-secondary, #94a3b8);
}
</style>
