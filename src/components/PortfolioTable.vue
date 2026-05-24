<script setup lang="ts">
import { MButton, MTile } from '@mozaic-ds/vue'
import { useRouter } from 'vue-router'
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'
import type { PortfolioRow } from '@/types/portfolio'

const router = useRouter()

defineProps<{
  holdings: PortfolioRow[]
}>()

const emit = defineEmits<{
  sell: [asset: PortfolioRow]
}>()

const headers = [
  { label: 'Asset', value: 'symbol' },
  { label: 'Name', value: 'name' },
  { label: 'Quantity', value: 'quantity' },
  { label: 'Avg Cost', value: 'average_cost' },
  { label: 'Invested', value: 'total_invested' },
  { label: '', value: 'actions', sortable: false },
]

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value)
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

  <MDataTable v-else :items="holdings" :headers="headers">
    <template #cell.quantity="{ item }">
      {{ formatQuantity(item.quantity) }}
    </template>
    <template #cell.average_cost="{ item }">
      {{ formatCurrency(item.average_cost, item.currency) }}
    </template>
    <template #cell.total_invested="{ item }">
      {{ formatCurrency(item.total_invested, item.currency) }}
    </template>
    <template #cell.actions="{ item }">
      <MButton variant="secondary" size="s" @click="emit('sell', item)">Sell</MButton>
    </template>
  </MDataTable>
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
</style>
