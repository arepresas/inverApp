import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { PortfolioRow } from '@/types/portfolio'

export const usePortfolioStore = defineStore('portfolio', () => {
  const holdings = ref<PortfolioRow[]>([])
  const loading = ref(false)
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
    byType,
    fetchPortfolio,
  }
})
