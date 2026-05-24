import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { TransactionInput } from '@/types/portfolio'
import { usePortfolioStore } from './portfolio'

export const useTransactionStore = defineStore('transactions', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  async function addTransaction(input: TransactionInput) {
    loading.value = true
    error.value = null
    success.value = null

    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      error.value = 'Not authenticated'
      loading.value = false
      return
    }

    const { error: err } = await supabase.from('transactions').insert({
      user_id: user.id,
      asset_id: input.asset_id,
      transaction_type: input.transaction_type,
      quantity: input.quantity,
      price_per_unit: input.price_per_unit,
      fees: input.fees,
      transaction_date: input.transaction_date,
      notes: input.notes || null,
    })

    if (err) {
      error.value = err.message
    } else {
      success.value = `${input.transaction_type === 'buy' ? 'Purchase' : 'Sale'} recorded successfully`
      // Refresh portfolio data
      const portfolio = usePortfolioStore()
      await portfolio.fetchPortfolio()
    }

    loading.value = false
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
