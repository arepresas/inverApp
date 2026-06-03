<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MTabs } from '@mozaic-ds/vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useWatchlistStore } from '@/stores/watchlist'
import PortfolioTab from '@/components/PortfolioTab.vue'
import WatchlistTab from '@/components/WatchlistTab.vue'
import HistoryTab from '@/components/HistoryTab.vue'
import AppHeader from '@/components/AppHeader.vue'

const portfolio = usePortfolioStore()
const watchlist = useWatchlistStore()

const activeTab = ref('portfolio')
const tabs = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'watchlist', label: 'Seguimiento' },
  { id: 'history', label: 'History' },
]

onMounted(async () => {
  await portfolio.fetchPortfolio()
  portfolio.fetchMarketPrices()
  portfolio.fetchRealizedPnl()
  await watchlist.fetchWatchlist()
  watchlist.fetchWatchlistPrices()
})
</script>

<template>
  <div class="dashboard">
    <AppHeader />
    <main class="dashboard__main">
      <div class="dashboard__tabs">
        <MTabs v-model="activeTab" :tabs="tabs" />
      </div>
      <div class="dashboard__tab-content">
        <PortfolioTab v-if="activeTab === 'portfolio'" />
        <WatchlistTab v-if="activeTab === 'watchlist'" />
        <HistoryTab v-if="activeTab === 'history'" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--color-surface);
}
.dashboard__main {
  max-width: 64rem;
  margin: 0 auto;
  padding: var(--space-6) var(--space-6);
}
.dashboard__tabs {
  margin-bottom: var(--space-6);
}
.dashboard__tab-content {
  min-height: 200px;
}
</style>
