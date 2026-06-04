<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { supabase } from '@/lib/supabase'
import HistoryTable from '@/components/HistoryTable.vue'

interface HistoryAsset {
  asset_id: string
  symbol: string
  name: string
  currency: string
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
  total: number
}

const assets = ref<HistoryAsset[]>([])
const transactions = reactive<Record<string, HistoryTx[]>>({})
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(() => {
  fetchHistory()
})

async function fetchHistory() {
  loading.value = true
  error.value = null
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const { data, error: rpcError } = await supabase.rpc('get_transaction_history', { p_user_id: user.id })
    if (rpcError) {
      error.value = rpcError.message
      return
    }
    if (!data) { assets.value = []; return }

    const rows = data as any[]
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
        total: Number(r.quantity) * Number(r.price_per_unit) + Number(r.fees),
      })
    }

    const result: HistoryAsset[] = []
    for (const [assetId, group] of Object.entries(byAsset)) {
      let netQty = 0, totalBought = 0, totalSold = 0, invested = 0, realizedPnl = 0
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
      if (netQty <= 0) {
        result.push({ asset_id: assetId, symbol: group.symbol, name: group.name, currency: group.currency, totalBought, totalSold, invested, realizedPnl })
        transactions[assetId] = group.txs
      }
    }
    result.sort((a, b) => a.name.localeCompare(b.name))
    assets.value = result
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load history'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="tab">
    <div v-if="error" class="tab__error">
      Failed to load history: {{ error }}
    </div>
    <HistoryTable :assets="assets" :transactions="transactions" :loading="loading" />
  </div>
</template>

<style scoped>
.tab__error {
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}
</style>
