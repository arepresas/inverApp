import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { upsertAsset, fetchPrices } from '@/lib/yahoo'
import type { WatchlistItem } from '@/types/portfolio'

export const useWatchlistStore = defineStore('watchlist', () => {
  const items = ref<WatchlistItem[]>([])
  const prices = ref<Record<string, number>>({})
  const loading = ref(false)
  const pricesLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchWatchlist() {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('watchlist')
        .select('id, user_id, asset_id, created_at, assets(symbol, name, asset_type, currency)')
        .order('assets(name)', { ascending: true })

      if (err) {
        error.value = err.message
      } else {
        const rows = (data as any[]) || []
        items.value = rows
          .filter((row: any) => row.assets != null && typeof row.assets?.symbol === 'string')
          .map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            asset_id: row.asset_id,
            symbol: row.assets.symbol,
            name: row.assets.name,
            asset_type: row.assets.asset_type,
            currency: row.assets.currency,
            created_at: row.created_at,
          }))
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load watchlist'
    } finally {
      loading.value = false
    }
  }

  async function addToWatchlist(
    symbol: string,
    name: string,
    asset_type: string,
    currency: string,
  ) {
    error.value = null

    try {
      // Ensure the asset exists before adding to watchlist
      const asset = await upsertAsset({ symbol, name, asset_type, currency })

      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        error.value = 'Not authenticated'
        return
      }

      const { error: insertErr } = await supabase.from('watchlist').insert({
        user_id: user.id,
        asset_id: asset.id,
      })

      if (insertErr) {
        // 23505 = unique violation → already on watchlist, silently ignore
        if (String(insertErr.code) === '23505' || insertErr.message?.includes('duplicate')) {
          await fetchWatchlist()
          return
        }
        error.value = insertErr.message
        return
      }

      await fetchWatchlist()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add to watchlist'
    }
  }

  async function removeFromWatchlist(id: string) {
    error.value = null

    try {
      const { error: deleteErr } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id)

      if (deleteErr) {
        error.value = deleteErr.message
        return
      }

      await fetchWatchlist()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to remove from watchlist'
    }
  }

  const enrichedWatchlist = computed(() =>
    items.value.map((item) => ({
      ...item,
      currentPrice: prices.value[item.symbol] ?? null,
    })),
  )

  async function fetchWatchlistPrices() {
    if (!items.value.length) return
    pricesLoading.value = true
    const symbols = [...new Set(items.value.map((item) => item.symbol))]
    try {
      prices.value = await fetchPrices(symbols)
    } finally {
      pricesLoading.value = false
    }
  }

  const watchlistSymbols = computed(() =>
    new Set(items.value.map((item) => item.symbol)),
  )

  const watchlistCount = computed(() => items.value.length)

  return {
    // State
    items,
    prices,
    loading,
    pricesLoading,
    error,

    // Computed
    enrichedWatchlist,
    watchlistSymbols,
    watchlistCount,

    // Actions
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    fetchWatchlistPrices,
  }
})
