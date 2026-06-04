<script setup lang="ts">
import { onMounted } from 'vue'
import { MLoader } from '@mozaic-ds/vue'
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'
import { getNumberLocale } from '@/lib/locale'

const props = defineProps<{
  assetId: string
  currency: string
  transactions?: any[]
  loading: boolean
  fetchTransactions: (assetId: string) => void
}>()

onMounted(() => {
  props.fetchTransactions(props.assetId)
})

const subHeaders = [
  { label: 'Date', value: 'transaction_date', render: 'date' as const },
  { label: 'Type', value: 'transaction_type', render: 'tag' as const },
  { label: 'Qty', value: 'quantity', render: 'number' as const },
  { label: 'Price', value: 'price_per_unit', render: 'currency' as const, currencyField: 'currency' },
  { label: 'Total', value: 'total', render: 'currency' as const, currencyField: 'currency' },
]
</script>

<template>
  <div v-if="loading" class="ex-loading">
    <MLoader size="s" text="Loading transactions..." />
  </div>
  <div v-else-if="transactions?.length">
    <MDataTable
      :items="transactions"
      :headers="subHeaders"
      :nested="true"
      size="s"
    >
      <template #cell.transaction_date="{ item: tx }">
        {{ new Date(tx.transaction_date).toLocaleDateString(getNumberLocale(), { year:'numeric', month:'short', day:'numeric' }) }}
      </template>
      <template #cell.transaction_type="{ item: tx }">
        <span class="ex-tag" :class="`ex-tag--${tx.transaction_type}`">{{ tx.transaction_type }}</span>
      </template>
      <template #cell.quantity="{ item: tx }">
        <span class="ex-num">{{ new Intl.NumberFormat(getNumberLocale(), { minimumFractionDigits:0, maximumFractionDigits:8 }).format(tx.quantity) }}</span>
      </template>
      <template #cell.price_per_unit="{ item: tx }">
        <span class="ex-num">{{ new Intl.NumberFormat(getNumberLocale(), { style:'currency', currency, minimumFractionDigits:2, maximumFractionDigits:2 }).format(tx.price_per_unit) }}</span>
      </template>
      <template #cell.total="{ item: tx }">
        <span class="ex-num">{{ new Intl.NumberFormat(getNumberLocale(), { style:'currency', currency, minimumFractionDigits:2, maximumFractionDigits:2 }).format(tx.total) }}</span>
      </template>
    </MDataTable>
  </div>
  <div v-else class="ex-empty">No transactions found.</div>
</template>
