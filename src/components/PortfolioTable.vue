<script setup lang="ts">
import { reactive, watch } from 'vue'
import { MButton, MTile, MLoader } from '@mozaic-ds/vue'
import DataTable from '@/components/DataTable.vue'
import ExpandedTransactions from '@/components/ExpandedTransactions.vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import type { PortfolioRow } from '@/types/portfolio'

type EnrichedRow = PortfolioRow & {
  currentPrice: number | null
  currentValue: number | null
  unrealizedPnl: number | null
}

interface TxRowDb {
  id: string
  transaction_type: 'buy' | 'sell'
  quantity: number
  price_per_unit: number
  fees: number
  transaction_date: string
}

interface TxRow extends TxRowDb {
  total: number
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

async function fetchTransactions(assetId: string) {
  if (transactionsByAsset[assetId] || txLoading[assetId]) return
  txLoading[assetId] = true
  try {
    const { data, error: fetchError } = await supabase
      .from('transactions')
      .select('id, transaction_type, quantity, price_per_unit, fees, transaction_date')
      .eq('asset_id', assetId)
      .order('transaction_date', { ascending: true })
    if (fetchError) return
    transactionsByAsset[assetId] = ((data as TxRowDb[]) || []).map((tx) => ({
      ...tx,
      total: tx.quantity * tx.price_per_unit + tx.fees,
    }))
  } finally {
    txLoading[assetId] = false
  }
}

// Lazy-load transactions when row expands
watch(
  () => props.holdings,
  (h) => {
    // Invalidate any removed holdings
    const currentIds = new Set(h.map((row) => row.asset_id))
    for (const id of Object.keys(transactionsByAsset)) {
      if (!currentIds.has(id)) delete transactionsByAsset[id]
    }
  },
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
          <ExpandedTransactions
            :asset-id="item.asset_id"
            :currency="item.currency"
            :transactions="transactionsByAsset[item.asset_id]"
            :loading="txLoading[item.asset_id]"
            :fetch-transactions="fetchTransactions"
          />
        </template>
    </DataTable>
  </div>
</template>

<style scoped>
.pt-actions { display: flex; gap: 6px; justify-content: flex-end; }
</style>
