<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MLoader, MStatusNotification, MTile } from '@mozaic-ds/vue'
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader.vue'

interface TxRow {
  id: string
  symbol: string
  name: string
  currency: string
  transaction_type: 'buy' | 'sell'
  quantity: number
  price_per_unit: number
  fees: number
  transaction_date: string
  avg_cost: number
  pnl: number
}

const rows = ref<TxRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const headers = [
  { label: 'Date', value: 'transaction_date' },
  { label: 'Type', value: 'transaction_type' },
  { label: 'Asset', value: 'symbol' },
  { label: 'Quantity', value: 'quantity' },
  { label: 'Price', value: 'price_per_unit' },
  { label: 'Fees', value: 'fees' },
  { label: 'Avg Cost', value: 'avg_cost' },
  { label: 'P&L', value: 'pnl' },
]

onMounted(async () => {
  loading.value = true
  try {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      error.value = 'Not authenticated'
      return
    }

    const { data, error: err } = await supabase.rpc('get_transaction_history', {
      p_user_id: user.data.user.id,
    })

    if (err) {
      error.value = err.message
    } else {
      rows.value = (data as TxRow[]) || []
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load transactions'
  } finally {
    loading.value = false
  }
})

function formatCurrency(value: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function pnlClass(value: number) {
  if (value > 0) return 'tx-history__pnl--gain'
  if (value < 0) return 'tx-history__pnl--loss'
  return ''
}
</script>

<template>
  <div class="tx-history">
    <AppHeader />
    <main class="tx-history__main">
      <h2 class="tx-history__heading">Transaction History</h2>

      <MLoader v-if="loading" size="m" text="Loading..." />

      <MStatusNotification
        v-if="error"
        status="error"
        :title="error"
        description=""
      />

      <MTile v-if="!loading && !rows.length" bordered class="tx-history__empty">
        <div class="tx-history__empty-content">
          <span class="tx-history__empty-icon">📋</span>
          <h3>No transactions yet</h3>
          <p>Your buy and sell operations will appear here.</p>
        </div>
      </MTile>

      <div v-if="rows.length" class="tx-history__table-wrap">
        <MDataTable :items="rows" :headers="headers">
          <template #cell.transaction_date="{ item }">
            {{ formatDate(item.transaction_date) }}
          </template>
          <template #cell.transaction_type="{ item }">
            <span :class="item.transaction_type === 'buy' ? 'tx-history__type--buy' : 'tx-history__type--sell'">
              {{ item.transaction_type }}
            </span>
          </template>
          <template #cell.quantity="{ item }">
            {{ Number(item.quantity).toFixed(4) }}
          </template>
          <template #cell.price_per_unit="{ item }">
            {{ formatCurrency(Number(item.price_per_unit), item.currency) }}
          </template>
          <template #cell.fees="{ item }">
            {{ formatCurrency(Number(item.fees), item.currency) }}
          </template>
          <template #cell.avg_cost="{ item }">
            {{ item.transaction_type === 'sell' ? formatCurrency(Number(item.avg_cost), item.currency) : '—' }}
          </template>
          <template #cell.pnl="{ item }">
            <span v-if="item.transaction_type === 'sell'" :class="pnlClass(Number(item.pnl))">
              {{ formatCurrency(Number(item.pnl), item.currency) }}
            </span>
            <span v-else class="tx-history__pnl--none">—</span>
          </template>
        </MDataTable>
      </div>
    </main>
  </div>
</template>

<style scoped>
.tx-history {
  min-height: 100vh;
  background: var(--mu-color-surface, #f8fafc);
}

.tx-history__main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.tx-history__heading {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
}

.tx-history__empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  text-align: center;
}

.tx-history__empty-icon {
  font-size: 2.5rem;
}

.tx-history__type--buy {
  color: #16a34a;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.tx-history__type--sell {
  color: #dc2626;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.tx-history__pnl--gain {
  color: #16a34a;
  font-weight: 600;
}

.tx-history__pnl--loss {
  color: #dc2626;
  font-weight: 600;
}

.tx-history__pnl--none {
  color: var(--mu-color-text-secondary, #94a3b8);
}

.tx-history__table-wrap {
  background: var(--mu-color-surface, #fff);
  border: 1px solid var(--mu-color-border, #e2e8f0);
  border-radius: 0.75rem;
  overflow: hidden;
}
</style>
