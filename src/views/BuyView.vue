<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MStatusNotification } from '@mozaic-ds/vue'
import { useTransactionStore } from '@/stores/transactions'
import TransactionForm from '@/components/TransactionForm.vue'
import AppHeader from '@/components/AppHeader.vue'

const tx = useTransactionStore()
const router = useRouter()

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

      <TransactionForm mode="buy" @submit="handleSubmit" @cancel="handleCancel" />
    </main>
  </div>
</template>

<style scoped>
.buy-view {
  min-height: 100vh;
  background: var(--mu-color-surface, #f8fafc);
}

.buy-view__main {
  max-width: 32rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
</style>
