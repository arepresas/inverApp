<script setup lang="ts">
import { onMounted, computed, ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { MLoader, MStatusNotification, MTile, MTabs, MButton } from '@mozaic-ds/vue'
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'
import { supabase } from '@/lib/supabase'
import { usePortfolioStore } from '@/stores/portfolio'
import { useWatchlistStore } from '@/stores/watchlist'
import PortfolioTable from '@/components/PortfolioTable.vue'
import AssetSearch from '@/components/AssetSearch.vue'
import SymbolCell from '@/components/SymbolCell.vue'
import NameCell from '@/components/NameCell.vue'
import AppHeader from '@/components/AppHeader.vue'
import type { PortfolioRow, WatchlistItem } from '@/types/portfolio'

const portfolio = usePortfolioStore()
const watchlist = useWatchlistStore()
const router = useRouter()

const activeTab = ref('portfolio')
const searchKey = ref(0)
const tabs = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'watchlist', label: 'Seguimiento' },
  { id: 'history', label: 'History' },
]

// -- History tab state --
interface HistoryAsset {
  asset_id: string
  symbol: string
  name: string
  currency: string
  netQty: number
  totalBought: number
  totalSold: number
  invested: number
  realizedPnl: number
}

interface HistoryTx {
  id: string
  transaction_type: 'buy' | 'sell'
  quantity: number
  price_per_unit: number
  fees: number
  transaction_date: string
  pnl: number
}

const historyAssets = ref<HistoryAsset[]>([])
const historyLoading = ref(false)
const historyError = ref<string | null>(null)
const expandedHistory = reactive<Set<string>>(new Set())
const historyTxs = reactive<Record<string, HistoryTx[]>>({})

onMounted(async () => {
  await portfolio.fetchPortfolio()
  portfolio.fetchMarketPrices()
  portfolio.fetchRealizedPnl()
  await watchlist.fetchWatchlist()
  watchlist.fetchWatchlistPrices()
})

watch(activeTab, (tab) => {
  if (tab === 'history' && !historyAssets.value.length && !historyLoading.value) {
    fetchHistory()
  }
})

async function fetchHistory() {
  historyLoading.value = true
  historyError.value = null
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const { data } = await supabase.rpc('get_transaction_history', { p_user_id: user.id })
    if (!data) { historyAssets.value = []; return }

    const rows = data as any[]
    // Group by asset_id — also cache transactions for expand
    const byAsset: Record<string, { symbol: string; name: string; currency: string; txs: HistoryTx[] }> = {}
    for (const r of rows) {
      if (!byAsset[r.asset_id]) {
        byAsset[r.asset_id] = { symbol: r.symbol, name: r.name, currency: r.currency, txs: [] }
      }
      byAsset[r.asset_id].txs.push({
        id: r.id,
        transaction_type: r.transaction_type,
        quantity: Number(r.quantity),
        price_per_unit: Number(r.price_per_unit),
        fees: Number(r.fees),
        transaction_date: r.transaction_date,
        pnl: Number(r.pnl || 0),
      })
    }

    const result: HistoryAsset[] = []
    for (const [assetId, group] of Object.entries(byAsset)) {
      let netQty = 0
      let totalBought = 0
      let totalSold = 0
      let invested = 0
      let realizedPnl = 0
      for (const tx of group.txs) {
        if (tx.transaction_type === 'buy') {
          netQty += tx.quantity
          totalBought += tx.quantity
          invested += tx.quantity * tx.price_per_unit + tx.fees
        } else {
          netQty -= tx.quantity
          totalSold += tx.quantity
          realizedPnl += tx.pnl
        }
      }
      // Show only fully-sold assets in history
      if (netQty <= 0) {
        result.push({
          asset_id: assetId,
          symbol: group.symbol,
          name: group.name,
          currency: group.currency,
          netQty,
          totalBought,
          totalSold,
          invested,
          realizedPnl,
        })
        // Cache transactions for expand
        historyTxs[assetId] = group.txs
      }
    }
    result.sort((a, b) => a.name.localeCompare(b.name))
    historyAssets.value = result
  } catch (e) {
    historyError.value = e instanceof Error ? e.message : 'Failed to load history'
  } finally {
    historyLoading.value = false
  }
}

function toggleHistoryAsset(assetId: string) {
  if (expandedHistory.has(assetId)) {
    expandedHistory.delete(assetId)
  } else {
    expandedHistory.add(assetId)
  }
}

function formatHistoryCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function historyPnlClass(value: number) {
  if (value > 0) return 'dashboard__pnl--gain'
  if (value < 0) return 'dashboard__pnl--loss'
  return ''
}

function handleBuy(asset: PortfolioRow) {
  router.push({
    name: 'buy',
    query: {
      symbol: asset.symbol,
      name: asset.name,
      asset_type: asset.asset_type,
      currency: asset.currency,
    },
  })
}

function handleSell(asset: PortfolioRow) {
  router.push({
    name: 'sell',
    query: {
      asset_id: asset.asset_id,
      symbol: asset.symbol,
      name: asset.name,
      max_qty: String(asset.quantity),
    },
  })
}

async function handleWatchlistAssetSelected(
  asset: { symbol: string; name: string; asset_type: string; currency: string } | null,
) {
  if (!asset) return
  await watchlist.addToWatchlist(asset.symbol, asset.name, asset.asset_type, asset.currency)
  watchlist.fetchWatchlistPrices()
  searchKey.value++
}

async function handleRemoveWatchlistItem(item: WatchlistItem) {
  if (!confirm(`Remove ${item.symbol} from watchlist?`)) return
  await watchlist.removeFromWatchlist(item.id)
}

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(value)
}

function formatRealizedPnl() {
  const byCurrency = portfolio.realizedPnlByCurrency
  if (!Object.keys(byCurrency).length) return formatCurrency(0)
  if (Object.keys(byCurrency).length === 1) {
    const [cur, val] = Object.entries(byCurrency)[0]
    return formatCurrency(val, cur)
  }
  return Object.entries(byCurrency)
    .map(([cur, val]) => formatCurrency(val, cur))
    .join(' + ')
}

function formatInvested() {
  const byCurrency = portfolio.totalInvestedByCurrency
  if (Object.keys(byCurrency).length === 1) {
    const [cur, val] = Object.entries(byCurrency)[0]
    return formatCurrency(val, cur)
  }
  return Object.entries(byCurrency)
    .map(([cur, val]) => formatCurrency(val, cur))
    .join(' + ')
}

const currentValue = computed(() =>
  portfolio.enrichedHoldings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0),
)

const unrealizedPnl = computed(() =>
  portfolio.enrichedHoldings.reduce((sum, h) => sum + (h.unrealizedPnl ?? 0), 0),
)

function pnlValueClass(value: number) {
  if (value > 0) return 'dashboard__card-value--gain'
  if (value < 0) return 'dashboard__card-value--loss'
  return ''
}

const watchlistHeaders = [
  { label: 'Symbol', value: 'symbol' },
  { label: 'Name', value: 'name' },
  { label: 'Type', value: 'asset_type' },
  { label: 'Price', value: 'currentPrice' },
  { label: '', value: 'actions', sortable: false },
]
</script>

<template>
  <div class="dashboard">
    <AppHeader />

    <main class="dashboard__main">
      <div class="dashboard__tabs">
        <MTabs v-model="activeTab" :tabs="tabs" />
      </div>

      <!-- Portfolio Tab -->
      <div v-if="activeTab === 'portfolio'" class="dashboard__tab-content">
        <MLoader v-if="portfolio.loading" size="m" text="Loading portfolio..." />

        <template v-else>
          <!-- Error -->
          <MStatusNotification
            v-if="portfolio.error"
            status="error"
            :title="portfolio.error"
            description=""
          />

          <!-- Summary cards -->
          <div class="dashboard__summary">
            <MTile bordered class="dashboard__card">
              <span class="dashboard__card-icon">💰</span>
              <div>
                <span class="dashboard__card-value">{{ formatCurrency(currentValue) }}</span>
                <span class="dashboard__card-label">Current Value</span>
              </div>
            </MTile>
            <MTile bordered class="dashboard__card">
              <span class="dashboard__card-icon">📈</span>
              <div>
                <span class="dashboard__card-value" :class="pnlValueClass(unrealizedPnl)">
                  {{ formatCurrency(unrealizedPnl) }}
                </span>
                <span class="dashboard__card-label">Unrealized P&L</span>
              </div>
            </MTile>
            <MTile bordered class="dashboard__card">
              <span class="dashboard__card-icon">💵</span>
              <div>
                <span class="dashboard__card-value">{{ formatRealizedPnl() }}</span>
                <span class="dashboard__card-label">Realized P&L</span>
              </div>
            </MTile>
            <MTile bordered class="dashboard__card">
              <span class="dashboard__card-icon">📦</span>
              <div>
                <span class="dashboard__card-value">{{ formatInvested() }}</span>
                <span class="dashboard__card-label">Total Invested</span>
              </div>
            </MTile>
          </div>

          <h2 class="dashboard__heading">Your Portfolio</h2>
          <PortfolioTable
            :holdings="portfolio.enrichedHoldings"
            :prices-loading="portfolio.pricesLoading"
            @buy="handleBuy"
            @sell="handleSell"
          />
        </template>
      </div>

      <!-- Watchlist Tab -->
      <div v-if="activeTab === 'watchlist'" class="dashboard__tab-content">
        <AssetSearch :key="searchKey" @select="handleWatchlistAssetSelected" />

        <MLoader v-if="watchlist.loading" size="m" text="Loading watchlist..." class="dashboard__watchlist-loader" />

        <template v-else>
          <MStatusNotification
            v-if="watchlist.error"
            status="error"
            :title="watchlist.error"
            description=""
            class="dashboard__watchlist-error"
          />

          <MTile
            v-if="!watchlist.enrichedWatchlist.length"
            bordered
            class="dashboard__watchlist-empty"
          >
            <div class="dashboard__watchlist-empty-content">
              <span class="dashboard__watchlist-empty-icon">⭐</span>
              <h3>No assets in watchlist</h3>
              <p>Search above to add.</p>
            </div>
          </MTile>

          <div v-else class="dashboard__watchlist-table">
            <MLoader
              v-if="watchlist.pricesLoading"
              size="s"
              text="Fetching prices..."
              class="dashboard__prices-loader"
            />
            <MDataTable :items="watchlist.enrichedWatchlist" :headers="watchlistHeaders">
              <template #cell.symbol="{ item }">
                <SymbolCell :symbol="item.symbol" />
              </template>
              <template #cell.name="{ item }">
                <NameCell :symbol="item.symbol" :name="item.name" />
              </template>
              <template #cell.asset_type="{ item }">
                <span class="dashboard__watchlist-type">{{ item.asset_type }}</span>
              </template>
              <template #cell.currentPrice="{ item }">
                <span v-if="item.currentPrice != null">
                  {{ formatCurrency(item.currentPrice, item.currency) }}
                </span>
                <span v-else class="dashboard__watchlist-price--none">—</span>
              </template>
              <template #cell.actions="{ item }">
                <MButton
                  size="s"
                  variant="secondary"
                  @click="handleRemoveWatchlistItem(item)"
                >
                  Remove
                </MButton>
              </template>
            </MDataTable>
          </div>
        </template>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="dashboard__tab-content">
        <MLoader v-if="historyLoading" size="m" text="Loading history..." />

        <template v-else>
          <MStatusNotification
            v-if="historyError"
            status="error"
            :title="historyError"
            description=""
          />

          <MTile
            v-if="!historyAssets.length"
            bordered
            class="dashboard__watchlist-empty"
          >
            <div class="dashboard__watchlist-empty-content">
              <span class="dashboard__watchlist-empty-icon">📜</span>
              <h3>No history yet</h3>
              <p>Sold assets will appear here.</p>
            </div>
          </MTile>

          <div v-else class="dashboard__history-table">
            <table class="dashboard__history-tbl">
              <thead>
                <tr>
                  <th class="pt-expand-col"></th>
                  <th>Asset</th>
                  <th>Name</th>
                  <th>Bought</th>
                  <th>Sold</th>
                  <th>Invested</th>
                  <th>Realized P&L</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="asset in historyAssets" :key="asset.asset_id">
                  <tr class="pt-row" :class="{ 'pt-row--expanded': expandedHistory.has(asset.asset_id) }">
                    <td class="pt-expand-col">
                      <button
                        class="pt-expand-btn"
                        :class="{ 'pt-expand-btn--open': expandedHistory.has(asset.asset_id) }"
                        @click="toggleHistoryAsset(asset.asset_id)"
                      >▶</button>
                    </td>
                    <td><SymbolCell :symbol="asset.symbol" /></td>
                    <td><NameCell :symbol="asset.symbol" :name="asset.name" /></td>
                    <td class="pt-num">{{ asset.totalBought }}</td>
                    <td class="pt-num">{{ asset.totalSold }}</td>
                    <td class="pt-num">{{ formatHistoryCurrency(asset.invested, asset.currency) }}</td>
                    <td class="pt-num">
                      <span :class="historyPnlClass(asset.realizedPnl)">
                        {{ formatHistoryCurrency(asset.realizedPnl, asset.currency) }}
                      </span>
                    </td>
                  </tr>
                  <template v-if="expandedHistory.has(asset.asset_id)">
                    <tr
                      v-for="tx in historyTxs[asset.asset_id]"
                      :key="tx.id"
                      class="pt-subrow"
                      :class="`pt-subrow--${tx.transaction_type}`"
                    >
                      <td class="pt-expand-col"></td>
                      <td class="pt-subrow-indent" colspan="2">
                        <span class="pt-subrow-date">{{ new Date(tx.transaction_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) }}</span>
                        <span class="pt-subrow-type" :class="`pt-subrow-type--${tx.transaction_type}`">
                          {{ tx.transaction_type }}
                        </span>
                      </td>
                      <td class="pt-num pt-subrow-val">{{ tx.transaction_type === 'buy' ? tx.quantity : '' }}</td>
                      <td class="pt-num pt-subrow-val">{{ tx.transaction_type === 'sell' ? tx.quantity : '' }}</td>
                      <td class="pt-num pt-subrow-val">{{ formatHistoryCurrency(tx.quantity * tx.price_per_unit + tx.fees, asset.currency) }}</td>
                      <td class="pt-num pt-subrow-val">
                        <span v-if="tx.transaction_type === 'sell'" :class="historyPnlClass(tx.pnl)">
                          {{ formatHistoryCurrency(tx.pnl, asset.currency) }}
                        </span>
                      </td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--mu-color-surface, #f8fafc);
}

.dashboard__main {
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.dashboard__tabs {
  margin-bottom: 1.5rem;
}

.dashboard__tab-content {
  min-height: 200px;
}

.dashboard__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.dashboard__card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dashboard__card-icon {
  font-size: 1.75rem;
}

.dashboard__card-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--mu-color-text, #0f172a);
}

.dashboard__card-value--gain {
  color: #16a34a;
}

.dashboard__card-value--loss {
  color: #dc2626;
}

.dashboard__card-label {
  font-size: 0.75rem;
  color: var(--mu-color-text-secondary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dashboard__heading {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

/* Watchlist tab */
.dashboard__watchlist-loader {
  margin-top: 1.5rem;
}

.dashboard__watchlist-error {
  margin-top: 1.5rem;
}

.dashboard__watchlist-empty {
  margin-top: 1.5rem;
}

.dashboard__watchlist-empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  text-align: center;
}

.dashboard__watchlist-empty-content h3 {
  margin: 0;
  font-size: 1.125rem;
}

.dashboard__watchlist-empty-content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--mu-color-text-secondary, #64748b);
}

.dashboard__watchlist-empty-icon {
  font-size: 2.5rem;
}

.dashboard__watchlist-table {
  margin-top: 1.5rem;
  background: var(--mu-color-surface, #fff);
  border: 1px solid var(--mu-color-border, #e2e8f0);
  border-radius: 0.75rem;
  overflow: hidden;
}

.dashboard__prices-loader {
  margin: 0.75rem 1rem;
}

.dashboard__watchlist-type {
  font-size: 0.6875rem;
  text-transform: uppercase;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: var(--mu-color-surface-hover, #f1f5f9);
  color: var(--mu-color-text-secondary, #94a3b8);
}

.dashboard__watchlist-price--none {
  color: var(--mu-color-text-secondary, #94a3b8);
}

/* History tab */
.dashboard__history-table {
  background: var(--mu-color-surface, #fff);
  border: 1px solid var(--mu-color-border, #e2e8f0);
  border-radius: 0.75rem;
  overflow: hidden;
}

.dashboard__history-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  table-layout: fixed;
}

.dashboard__history-tbl thead th {
  text-align: left;
  padding: 0.625rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--mu-color-text-secondary, #94a3b8);
  background: var(--mu-color-surface-hover, #f8fafc);
  border-bottom: 1px solid var(--mu-color-border, #e2e8f0);
}

.dashboard__history-tbl .pt-expand-col { width: 2rem; }

.dashboard__pnl--gain { color: #16a34a; font-weight: 600; }
.dashboard__pnl--loss { color: #dc2626; font-weight: 600; }

/* Shared expandable table styles (used by history tab) */
.pt-expand-col { width: 2rem; padding: 0 0.25rem; text-align: center; }

.pt-expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.625rem;
  color: var(--mu-color-text-secondary, #94a3b8);
  padding: 0.25rem;
  transition: transform 0.2s;
}
.pt-expand-btn--open { transform: rotate(90deg); }

.pt-row {
  border-bottom: 1px solid var(--mu-color-border, #e2e8f0);
}
.pt-row td {
  padding: 0.625rem 0.75rem;
  vertical-align: middle;
}
.pt-row--expanded { background: var(--mu-color-surface-hover, #f8fafc); }

.pt-num { white-space: nowrap; }

.pt-subrow {
  background: #fafbfc;
  border-bottom: 1px solid var(--mu-color-border, #e2e8f0);
}
.pt-subrow td { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
.pt-subrow--buy { background: #f0fdf4; }
.pt-subrow--sell { background: #fef2f2; }
.pt-subrow--loading td { text-align: center; padding: 0.75rem; color: var(--mu-color-text-secondary, #94a3b8); }

.pt-subrow-indent { padding-left: 0.25rem !important; }
.pt-subrow-date { color: var(--mu-color-text-secondary, #94a3b8); margin-right: 0.75rem; }
.pt-subrow-type {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.0625rem 0.375rem;
  border-radius: 0.25rem;
}
.pt-subrow-type--buy { background: #dcfce7; color: #16a34a; }
.pt-subrow-type--sell { background: #fecaca; color: #dc2626; }
.pt-subrow-val { color: var(--mu-color-text-secondary, #64748b); }
</style>
