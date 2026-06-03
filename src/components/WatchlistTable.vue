<script setup lang="ts">
import { MButton, MTile } from '@mozaic-ds/vue'
import DataTable from '@/components/DataTable.vue'

interface WatchlistRow {
  id: string
  symbol: string
  name: string
  asset_type: string
  currency: string
  currentPrice: number | null
}

defineProps<{
  items: WatchlistRow[]
  loading?: boolean
  pricesLoading?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const headers = [
  { label: 'Symbol', value: 'symbol', render: 'symbol' as const },
  { label: 'Name', value: 'name', render: 'name' as const },
  { label: 'Type', value: 'asset_type', render: 'tag' as const },
  { label: 'Price', value: 'currentPrice', render: 'currency' as const, currencyField: 'currency' },
  { label: '', value: 'actions', sortable: false },
]
</script>

<template>
  <MLoader v-if="loading" size="m" text="Loading watchlist..." />

  <template v-else>
    <MTile v-if="!items.length" bordered class="pt-empty">
      <div class="empty-state">
        <span class="empty-state__icon">⭐</span>
        <h3>No assets in watchlist</h3>
        <p>Search above to add.</p>
      </div>
    </MTile>

    <div v-else>
      <MLoader v-if="pricesLoading" size="s" text="Fetching prices..." style="margin: var(--space-3) var(--space-4)" />
      <DataTable :items="items" :headers="headers">
        <template #cell.actions="{ item }">
          <MButton size="s" variant="secondary" @click="emit('remove', item.id)">Remove</MButton>
        </template>
      </DataTable>
    </div>
  </template>
</template>

<style scoped>
</style>
