<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { MStatusNotification } from '@mozaic-ds/vue'
import { useTransactionStore } from '@/stores/transactions'
import TransactionForm from '@/components/TransactionForm.vue'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const router = useRouter()
const tx = useTransactionStore()

onMounted(() => {
  tx.clearMessages()
})

const preselected = route.query.symbol
  ? {
      symbol: String(route.query.symbol),
      name: String(route.query.name ?? route.query.symbol),
      asset_type: String(route.query.asset_type ?? 'stock'),
      currency: String(route.query.currency ?? 'USD'),
    }
  : undefined

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
  if (!tx.error) {
    router.push('/dashboard')
  }
}

function handleCancel() {
  tx.clearMessages()
  router.push('/dashboard')
}
</script>

<template>
  <div class="buy-view">
    <AppHeader />
    <main class="buy-view__main">
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

      <TransactionForm mode="buy" :preselected-asset="preselected" @submit="handleSubmit" @cancel="handleCancel" />
    </main>
  </div>
</template>

<style scoped>
.buy-view {
  min-height: 100vh;
  background: var(--color-surface);
}

.buy-view__main {
  max-width: 40rem;
  margin: 0 auto;
  padding: var(--space-6) var(--space-6);
}
</style>
