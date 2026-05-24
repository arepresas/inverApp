import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { upsertAsset } from '@/lib/yahoo'
import { usePortfolioStore } from './portfolio'

type SubmitInput = {
  symbol: string
  name: string
  asset_type: string
  currency: string
  transaction_type: 'buy' | 'sell'
  quantity: number
  price_per_unit: number
  fees: number
  transaction_date: string
  asset_id?: string
}

export const useTransactionStore = defineStore('transactions', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  async function addTransaction(input: SubmitInput) {
    loading.value = true
    error.value = null
    success.value = null

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) {
        error.value = 'Not authenticated'
        return
      }

      // Auto-add asset to Supabase if it doesn't exist yet
      let assetId = input.asset_id
      if (!assetId) {
        const asset = await upsertAsset({
          symbol: input.symbol,
          name: input.name,
          asset_type: input.asset_type,
          currency: input.currency,
        })
        assetId = asset.id
      }

      // Oversell guard
      if (input.transaction_type === 'sell') {
        const portfolio = usePortfolioStore()
        await portfolio.fetchPortfolio()
        const holding = portfolio.holdings.find((h) => h.asset_id === assetId)
        if (!holding || holding.quantity < input.quantity) {
          error.value = `Insufficient quantity. You only have ${holding?.quantity ?? 0} available.`
          return
        }
      }

      const { error: err } = await supabase.from('transactions').insert({
        user_id: user.id,
        asset_id: assetId,
        transaction_type: input.transaction_type,
        quantity: input.quantity,
        price_per_unit: input.price_per_unit,
        fees: input.fees,
        transaction_date: input.transaction_date,
        notes: null,
      })

      if (err) {
        error.value = err.message
      } else {
        success.value = `${input.transaction_type === 'buy' ? 'Purchase' : 'Sale'} recorded successfully`
        const portfolio = usePortfolioStore()
        await portfolio.fetchPortfolio()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Transaction failed'
    } finally {
      loading.value = false
    }
  }

  function clearMessages() {
    error.value = null
    success.value = null
  }

  return {
    loading,
    error,
    success,
    addTransaction,
    clearMessages,
  }
})
