<script setup lang="ts">
import { MTile, MLoader } from '@mozaic-ds/vue'
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'
import DataTable from '@/components/DataTable.vue'
import { getNumberLocale } from '@/lib/locale'

interface HistoryTx {
  id: string
  transaction_type: 'buy' | 'sell'
  quantity: number
  price_per_unit: number
  fees: number
  transaction_date: string
  pnl: number
  total: number
}

interface HistoryAsset {
  asset_id: string
  symbol: string
  name: string
  currency: string
  totalBought: number
  totalSold: number
  invested: number
  realizedPnl: number
}

defineProps<{
  assets: HistoryAsset[]
  transactions: Record<string, HistoryTx[]>
  loading?: boolean
}>()

const headers = [
  { label: 'Asset', value: 'symbol', render: 'symbol' as const },
  { label: 'Name', value: 'name', render: 'name' as const },
  { label: 'Bought', value: 'totalBought', render: 'number' as const },
  { label: 'Sold', value: 'totalSold', render: 'number' as const },
  { label: 'Invested', value: 'invested', render: 'currency' as const, currencyField: 'currency' },
  { label: 'Realized P&L', value: 'realizedPnl', render: 'pnl' as const, currencyField: 'currency' },
]

const subHeaders = [
  { label: 'Date', value: 'transaction_date', render: 'date' as const },
  { label: 'Type', value: 'transaction_type', render: 'tag' as const },
  { label: 'Qty', value: 'quantity', render: 'number' as const },
  { label: 'Total', value: 'total', render: 'currency' as const, currencyField: 'currency' },
  { label: 'P&L', value: 'pnl', render: 'pnl' as const, currencyField: 'currency' },
]
</script>

<template>
  <MLoader v-if="loading" size="m" text="Loading history..." />

  <template v-else>
    <MTile v-if="!assets.length" bordered class="pt-empty">
      <div class="empty-state">
        <span class="empty-state__icon">📜</span>
        <h3>No history yet</h3>
        <p>Sold assets will appear here.</p>
      </div>
    </MTile>

    <div v-else>
      <DataTable
        :items="assets"
        :headers="headers"
        :expandable="true"
        data-key-expand="asset_id"
      >
        <template #expandContent="{ item }">
          <MDataTable
            v-if="transactions[item.asset_id]?.length"
            :items="transactions[item.asset_id]"
            :headers="subHeaders"
            :nested="true"
            size="s"
          >
            <template #cell.transaction_date="{ item: tx }">
              {{ new Date(tx.transaction_date).toLocaleDateString(getNumberLocale(), { month:'short', day:'numeric', year:'numeric' }) }}
            </template>
            <template #cell.transaction_type="{ item: tx }">
              <span class="ex-tag" :class="`ex-tag--${tx.transaction_type}`">{{ tx.transaction_type }}</span>
            </template>
            <template #cell.quantity="{ item: tx }">
              <span class="ex-num">{{ tx.quantity }}</span>
            </template>
            <template #cell.total="{ item: tx }">
              <span class="ex-num">{{ new Intl.NumberFormat(getNumberLocale(), { style:'currency', currency: item.currency, minimumFractionDigits:2 }).format(tx.total) }}</span>
            </template>
            <template #cell.pnl="{ item: tx }">
              <span v-if="tx.transaction_type === 'sell'" :class="tx.pnl > 0 ? 'text--gain' : tx.pnl < 0 ? 'text--loss' : ''" class="ex-num">
                {{ new Intl.NumberFormat(getNumberLocale(), { style:'currency', currency: item.currency, minimumFractionDigits:2 }).format(tx.pnl) }}
              </span>
              <span v-else class="text--muted">—</span>
            </template>
          </MDataTable>
        </template>
      </DataTable>
    </div>
  </template>
</template>

<style scoped>
</style>
