<script setup lang="ts">
import { useWatchlistStore } from '@/stores/watchlist'
import WatchlistTable from '@/components/WatchlistTable.vue'
import AssetSearch from '@/components/AssetSearch.vue'

const watchlist = useWatchlistStore()

async function handleAssetSelected(asset: { symbol: string; name: string; asset_type: string; currency: string } | null) {
  if (!asset) return
  await watchlist.addToWatchlist(asset.symbol, asset.name, asset.asset_type, asset.currency)
}

async function handleRemove(id: string) {
  await watchlist.removeFromWatchlist(id)
}
</script>

<template>
  <div class="tab">
    <AssetSearch @select="handleAssetSelected" />

    <WatchlistTable
      :items="watchlist.enrichedWatchlist"
      :loading="watchlist.loading"
      :prices-loading="watchlist.pricesLoading"
      @remove="handleRemove"
    />
  </div>
</template>
