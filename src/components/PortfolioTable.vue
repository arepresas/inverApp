<script setup lang="ts">
import { reactive, watch } from 'vue'
import { MButton, MTile, MLoader } from '@mozaic-ds/vue'
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'
import DataTable from '@/components/DataTable.vue'
import { getNumberLocale } from '@/lib/locale'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import type { PortfolioRow } from '@/types/portfolio'

type EnrichedRow = PortfolioRow & {
  currentPrice: number | null
  currentValue: number | null
  unrealizedPnl: number | null
}

interface TxRow {
  id: string
  transaction_type: 'buy' | 'sell'
  quantity: number
  price_per_unit: number
  fees: number
  transaction_date: string
}

const router = useRouter()

const props = defineProps<{
  holdings: EnrichedRow[]
  pricesLoading?: boolean
}>()

const emit = defineEmits<{
  buy: [asset: PortfolioRow]
  sell: [asset: PortfolioRow]
}>()

const transactionsByAsset = reactive<Record<string, TxRow[]>>({})
const txLoading = reactive<Record<string, boolean>>({})

const headers = [
  { label: 'Symbol', value: 'symbol', render: 'symbol' as const },
  { label: 'Name', value: 'name', render: 'name' as const },
  { label: 'Qty', value: 'quantity', render: 'number' as const },
  { label: 'Avg Cost', value: 'average_cost', render: 'currency' as const, currencyField: 'currency' },
  { label: 'Price', value: 'currentPrice', render: 'currency' as const, currencyField: 'currency' },
  { label: 'Value', value: 'currentValue', render: 'currency' as const, currencyField: 'currency' },
  { label: 'P&L', value: 'unrealizedPnl', render: 'pnl' as const, currencyField: 'currency' },
  { label: '', value: 'actions', sortable: false },
]

const subHeaders = [
  { label: 'Date', value: 'transaction_date', render: 'date' as const },
  { label: 'Type', value: 'transaction_type', render: 'tag' as const },
  { label: 'Qty', value: 'quantity', render: 'number' as const },
  { label: 'Price', value: 'price_per_unit', render: 'currency' as const, currencyField: 'currency' },
  { label: 'Total', value: 'total', render: 'currency' as const, currencyField: 'currency' },
]

async function fetchTransactions(assetId: string) {
  if (transactionsByAsset[assetId] || txLoading[assetId]) return
  txLoading[assetId] = true
  try {
    const { data } = await supabase
      .from('transactions')
      .select('id, transaction_type, quantity, price_per_unit, fees, transaction_date')
      .eq('asset_id', assetId)
      .order('transaction_date', { ascending: true })
    transactionsByAsset[assetId] = ((data as TxRow[]) || []).map((tx) => ({
      ...tx,
      total: tx.quantity * tx.price_per_unit + tx.fees,
    }))
  } finally {
    txLoading[assetId] = false
  }
}

// Pre-fetch transactions for all holdings
watch(
  () => props.holdings,
  (h) => h.forEach((row) => fetchTransactions(row.asset_id)),
  { immediate: true },
)
</script>

<template>
  <MTile v-if="!holdings.length" bordered class="pt-empty">
    <div class="empty-state">
      <span class="empty-state__icon">📊</span>
      <h3>No holdings yet</h3>
      <p>Start by adding your first purchase.</p>
      <MButton variant="primary" @click="router.push('/buy')">Buy your first asset</MButton>
    </div>
  </MTile>

  <div v-else>
    <MLoader v-if="pricesLoading" size="s" text="Fetching prices..." style="margin-bottom: var(--space-3)" />

    <DataTable
      :items="holdings"
      :headers="headers"
      :expandable="true"
      data-key-expand="asset_id"
    >
        <template #cell.actions="{ item }">
          <div class="pt-actions">
            <MButton variant="secondary" size="s" @click="emit('buy', item)">Buy</MButton>
            <MButton variant="secondary" size="s" @click="emit('sell', item)">Sell</MButton>
          </div>
        </template>

        <template #expandContent="{ item }">
          <div v-if="txLoading[item.asset_id]" class="ex-loading">
            <MLoader size="s" text="Loading transactions..." />
          </div>
          <div v-else-if="transactionsByAsset[item.asset_id]?.length">
            <MDataTable
              :items="transactionsByAsset[item.asset_id]"
              :headers="subHeaders"
              :nested="true"
              size="s"
            >
              <template #cell.transaction_date="{ item: tx }">
                {{ new Date(tx.transaction_date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) }}
              </template>
              <template #cell.transaction_type="{ item: tx }">
                <span class="ex-tag" :class="`ex-tag--${tx.transaction_type}`">{{ tx.transaction_type }}</span>
              </template>
              <template #cell.quantity="{ item: tx }">
                <span class="ex-num">{{ new Intl.NumberFormat(getNumberLocale(), { minimumFractionDigits:0, maximumFractionDigits:8 }).format(tx.quantity) }}</span>
              </template>
              <template #cell.price_per_unit="{ item: tx }">
                <span class="ex-num">{{ new Intl.NumberFormat(getNumberLocale(), { style:'currency', currency: item.currency, minimumFractionDigits:2, maximumFractionDigits:2 }).format(tx.price_per_unit) }}</span>
              </template>
              <template #cell.total="{ item: tx }">
                <span class="ex-num">{{ new Intl.NumberFormat(getNumberLocale(), { style:'currency', currency: item.currency, minimumFractionDigits:2, maximumFractionDigits:2 }).format(tx.total) }}</span>
              </template>
            </MDataTable>
          </div>
          <div v-else class="ex-empty">No transactions found.</div>
        </template>
    </DataTable>
  </div>
</template>

<style scoped>
.pt-actions { display: flex; gap: 6px; justify-content: flex-end; }
</style>
