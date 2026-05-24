<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { MStatusNotification } from '@mozaic-ds/vue'
import { useTransactionStore } from '@/stores/transactions'
import TransactionForm from '@/components/TransactionForm.vue'
import AppHeader from '@/components/AppHeader.vue'

function safeQuery(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '')
  return String(value ?? '')
}

const route = useRoute()
const router = useRouter()
const tx = useTransactionStore()

const preselected = route.query.asset_id
  ? {
      asset_id: safeQuery(route.query.asset_id),
      symbol: safeQuery(route.query.symbol),
      name: safeQuery(route.query.name),
    }
  : undefined

const maxQtyRaw = safeQuery(route.query.max_qty)
const maxQty = maxQtyRaw && !Number.isNaN(Number(maxQtyRaw)) ? Number(maxQtyRaw) : undefined

async function handleSubmit(input: {
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
}) {
  await tx.addTransaction(input)
}

function handleCancel() {
  tx.clearMessages()
  router.push('/dashboard')
}
</script>

<template>
  <div class="sell-view">
    <AppHeader />
    <main class="sell-view__main">
      <MStatusNotification
        v-if="tx.success"
        status="success"
        :title="tx.success"
        description=""
      />
      <MStatusNotification
        v-if="tx.error"
        status="error"
        :title="tx.error"
        description=""
      />

      <TransactionForm
        mode="sell"
        :preselected-asset="preselected"
        :max-quantity="maxQty"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </main>
  </div>
</template>

<style scoped>
.sell-view {
  min-height: 100vh;
  background: var(--mu-color-surface, #f8fafc);
}

.sell-view__main {
  max-width: 32rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
</style>
