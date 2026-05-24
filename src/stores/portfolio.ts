import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { fetchPrices } from '@/lib/yahoo'
import type { PortfolioRow } from '@/types/portfolio'

export const usePortfolioStore = defineStore('portfolio', () => {
  const holdings = ref<PortfolioRow[]>([])
  const prices = ref<Record<string, number>>({})
  const loading = ref(false)
  const pricesLoading = ref(false)
  const realizedPnl = ref(0)
  const realizedPnlByCurrency = ref<Record<string, number>>({})
  const error = ref<string | null>(null)

  async function fetchPortfolio() {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('portfolio')
        .select('*')
        .order('symbol')

      if (err) {
        error.value = err.message
      } else {
        holdings.value = (data as PortfolioRow[]) || []
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load portfolio'
    } finally {
      loading.value = false
    }
  }

  const totalInvested = computed(() =>
    holdings.value.reduce((sum, h) => sum + (h.total_invested || 0), 0),
  )

  const totalInvestedByCurrency = computed(() => {
    const map: Record<string, number> = {}
    for (const h of holdings.value) {
      map[h.currency] = (map[h.currency] || 0) + (h.total_invested || 0)
    }
    return map
  })

  const holdingsCount = computed(() => holdings.value.length)

  const enrichedHoldings = computed(() =>
    holdings.value.map((h) => ({
      ...h,
      currentPrice: prices.value[h.symbol] ?? null,
      currentValue: prices.value[h.symbol] != null ? prices.value[h.symbol] * h.quantity : null,
      unrealizedPnl: prices.value[h.symbol] != null ? (prices.value[h.symbol] - h.average_cost) * h.quantity : null,
    })),
  )

  async function fetchMarketPrices() {
    if (!holdings.value.length) return
    pricesLoading.value = true
    const symbols = [...new Set(holdings.value.map((h) => h.symbol))]
    prices.value = await fetchPrices(symbols)
    pricesLoading.value = false
  }

  async function fetchRealizedPnl() {
    const user = await supabase.auth.getUser()
    if (!user.data.user) return
    try {
      const { data, error: err } = await supabase.rpc('get_transaction_history', {
        p_user_id: user.data.user.id,
      })
      if (err) throw err
      if (data) {
        const rows = data as { pnl: number; transaction_type: string; currency: string }[]
        const sells = rows.filter((r) => r.transaction_type === 'sell')
        realizedPnl.value = sells.reduce((sum, r) => sum + Number(r.pnl || 0), 0)

        const byCur: Record<string, number> = {}
        for (const r of sells) {
          byCur[r.currency] = (byCur[r.currency] || 0) + Number(r.pnl || 0)
        }
        realizedPnlByCurrency.value = byCur
      }
    } catch {
      // Silently ignore — card will show 0
    }
  }

  // Group holdings by asset type
  const byType = computed(() => {
    const map: Record<string, PortfolioRow[]> = {}
    for (const h of holdings.value) {
      if (!map[h.asset_type]) map[h.asset_type] = []
      map[h.asset_type].push(h)
    }
    return map
  })

  return {
    holdings,
    loading,
    error,
    totalInvested,
    totalInvestedByCurrency,
    holdingsCount,
    prices,
    pricesLoading,
    realizedPnl,
    realizedPnlByCurrency,
    enrichedHoldings,
    byType,
    fetchPortfolio,
    fetchMarketPrices,
    fetchRealizedPnl,
  }
})
