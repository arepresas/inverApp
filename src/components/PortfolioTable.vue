<script setup lang="ts">
import { reactive } from 'vue'
import { MButton, MTile, MLoader } from '@mozaic-ds/vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import SymbolCell from '@/components/SymbolCell.vue'
import NameCell from '@/components/NameCell.vue'
import type { PortfolioRow } from '@/types/portfolio'

type EnrichedRow = PortfolioRow & {
  currentPrice: number | null
  currentValue: number | null
  unrealizedPnl: number | null
}

interface TxRow {
  id: string
  transaction_type: 'buy' | 'sell'
  quantity: number
  price_per_unit: number
  fees: number
  transaction_date: string
}

const router = useRouter()

defineProps<{
  holdings: EnrichedRow[]
  pricesLoading?: boolean
}>()

const emit = defineEmits<{
  buy: [asset: PortfolioRow]
  sell: [asset: PortfolioRow]
}>()

const expandedAssets = reactive<Set<string>>(new Set())
const transactionsByAsset = reactive<Record<string, TxRow[]>>({})
const txLoading = reactive<Record<string, boolean>>({})

const headers = [
  'Asset',
  'Name',
  'Quantity',
  'Avg Cost',
  'Price',
  'Value',
  'P&L',
  '',
]

function toggleExpand(assetId: string) {
  if (expandedAssets.has(assetId)) {
    expandedAssets.delete(assetId)
  } else {
    expandedAssets.add(assetId)
    if (!transactionsByAsset[assetId]) {
      fetchTransactions(assetId)
    }
  }
}

async function fetchTransactions(assetId: string) {
  txLoading[assetId] = true
  try {
    const { data } = await supabase
      .from('transactions')
      .select('id, transaction_type, quantity, price_per_unit, fees, transaction_date')
      .eq('asset_id', assetId)
      .order('transaction_date', { ascending: true })

    transactionsByAsset[assetId] = (data as TxRow[]) || []
  } finally {
    txLoading[assetId] = false
  }
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function txTotal(row: TxRow) {
  return row.quantity * row.price_per_unit + row.fees
}

function pnlClass(value: number | null) {
  if (value == null) return 'pt-pnl--none'
  if (value > 0) return 'pt-pnl--gain'
  if (value < 0) return 'pt-pnl--loss'
  return 'pt-pnl--none'
}
</script>

<template>
  <MTile v-if="!holdings.length" bordered class="pt-empty">
    <div class="pt-empty__content">
      <span class="pt-empty__icon">📊</span>
      <h3>No holdings yet</h3>
      <p>Start by adding your first purchase.</p>
      <MButton variant="primary" @click="router.push('/buy')">Buy your first asset</MButton>
    </div>
  </MTile>

  <div v-else>
    <MLoader v-if="pricesLoading" size="s" text="Fetching prices..." class="pt-prices-loader" />

    <div class="pt-table-wrap">
      <table class="pt-table">
        <thead>
          <tr>
            <th class="pt-expand-col"></th>
            <th v-for="h in headers" :key="h" class="pt-th">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in holdings" :key="row.asset_id">
            <!-- Main row -->
            <tr class="pt-row" :class="{ 'pt-row--expanded': expandedAssets.has(row.asset_id) }">
              <td class="pt-expand-col">
                <button
                  class="pt-expand-btn"
                  :class="{ 'pt-expand-btn--open': expandedAssets.has(row.asset_id) }"
                  @click="toggleExpand(row.asset_id)"
                  :aria-label="expandedAssets.has(row.asset_id) ? 'Collapse' : 'Expand'"
                >▶</button>
              </td>
              <td><SymbolCell :symbol="row.symbol" /></td>
              <td><NameCell :symbol="row.symbol" :name="row.name" /></td>
              <td class="pt-num">{{ formatQuantity(row.quantity) }}</td>
              <td class="pt-num">{{ formatCurrency(row.average_cost, row.currency) }}</td>
              <td class="pt-num">
                <span v-if="row.currentPrice != null">{{ formatCurrency(row.currentPrice, row.currency) }}</span>
                <span v-else class="pt-pnl--none">—</span>
              </td>
              <td class="pt-num">
                <span v-if="row.currentValue != null">{{ formatCurrency(row.currentValue, row.currency) }}</span>
                <span v-else class="pt-pnl--none">—</span>
              </td>
              <td class="pt-num">
                <span :class="pnlClass(row.unrealizedPnl)">
                  {{ row.unrealizedPnl != null ? formatCurrency(row.unrealizedPnl, row.currency) : '—' }}
                </span>
              </td>
              <td>
                <div class="pt-actions">
                  <MButton variant="secondary" size="s" @click="emit('buy', row)">Buy</MButton>
                  <MButton variant="secondary" size="s" @click="emit('sell', row)">Sell</MButton>
                </div>
              </td>
            </tr>

            <!-- Sub-rows: transactions -->
            <template v-if="expandedAssets.has(row.asset_id)">
              <tr v-if="txLoading[row.asset_id]" class="pt-subrow pt-subrow--loading">
                <td :colspan="headers.length + 1">
                  <MLoader size="s" text="Loading transactions..." />
                </td>
              </tr>
              <template v-else>
                <tr
                  v-for="tx in transactionsByAsset[row.asset_id]"
                  :key="tx.id"
                  class="pt-subrow"
                  :class="`pt-subrow--${tx.transaction_type}`"
                >
                  <td class="pt-expand-col"></td>
                  <td class="pt-subrow-indent" colspan="2">
                    <span class="pt-subrow-date">{{ formatDate(tx.transaction_date) }}</span>
                    <span class="pt-subrow-type" :class="`pt-subrow-type--${tx.transaction_type}`">
                      {{ tx.transaction_type }}
                    </span>
                  </td>
                  <td class="pt-num pt-subrow-val">{{ formatQuantity(tx.quantity) }}</td>
                  <td class="pt-num pt-subrow-val">{{ formatCurrency(tx.price_per_unit, row.currency) }}</td>
                  <td class="pt-num pt-subrow-val">—</td>
                  <td class="pt-num pt-subrow-val">{{ formatCurrency(txTotal(tx), row.currency) }}</td>
                  <td class="pt-num pt-subrow-val">—</td>
                  <td></td>
                </tr>
                <tr v-if="!transactionsByAsset[row.asset_id]?.length && !txLoading[row.asset_id]" class="pt-subrow pt-subrow--empty">
                  <td :colspan="headers.length + 1">No transactions found.</td>
                </tr>
              </template>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.pt-empty__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  text-align: center;
}
.pt-empty__icon { font-size: 2.5rem; }
.pt-empty__content h3 { margin: 0; font-size: 1.125rem; }
.pt-empty__content p { margin: 0; font-size: 0.875rem; color: var(--mu-color-text-secondary, #64748b); }
.pt-prices-loader { margin-bottom: 0.75rem; }

.pt-table-wrap {
  background: var(--mu-color-surface, #fff);
  border: 1px solid var(--mu-color-border, #e2e8f0);
  border-radius: 0.75rem;
  overflow: hidden;
}

.pt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.pt-th {
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

.pt-actions { display: flex; gap: 0.375rem; justify-content: flex-end; }

/* Sub-rows */
.pt-subrow {
  background: #fafbfc;
  border-bottom: 1px solid var(--mu-color-border, #e2e8f0);
}
.pt-subrow td { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
.pt-subrow--buy { background: #f0fdf4; }
.pt-subrow--sell { background: #fef2f2; }
.pt-subrow--loading td,
.pt-subrow--empty td { text-align: center; padding: 0.75rem; color: var(--mu-color-text-secondary, #94a3b8); }

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

.pt-pnl--gain { color: #16a34a; font-weight: 600; }
.pt-pnl--loss { color: #dc2626; font-weight: 600; }
.pt-pnl--none { color: var(--mu-color-text-secondary, #94a3b8); }
</style>
