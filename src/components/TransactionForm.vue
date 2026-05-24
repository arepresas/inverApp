<script setup lang="ts">
import { ref, computed } from 'vue'
import { MField, MTextInput, MButton } from '@mozaic-ds/vue'
import AssetSearch from './AssetSearch.vue'
import type { Asset } from '@/types/portfolio'

const props = defineProps<{
  mode: 'buy' | 'sell'
  maxQuantity?: number
  preselectedAsset?: { asset_id: string; symbol: string; name: string }
}>()

const emit = defineEmits<{
  submit: [input: {
    asset_id: string
    transaction_type: 'buy' | 'sell'
    quantity: number
    price_per_unit: number
    fees: number
    transaction_date: string
  }]
  cancel: []
}>()

const selectedAsset = ref<Asset | null>(null)
const quantity = ref('')
const price = ref('')
const fees = ref('0')
function localDateTime() {
  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  const local = new Date(now.getTime() - tzOffset)
  return local.toISOString().slice(0, 16)
}
const date = ref(localDateTime())
const qtyError = ref('')
const priceError = ref('')
const assetError = ref('')

function handleAssetSelect(asset: Asset | null) {
  selectedAsset.value = asset
  assetError.value = ''
}

function validate(): boolean {
  qtyError.value = ''
  priceError.value = ''
  assetError.value = ''

  if (!selectedAsset.value && !props.preselectedAsset) {
    assetError.value = 'Select an asset'
  }
  if (!quantity.value || Number(quantity.value) <= 0) {
    qtyError.value = 'Enter a valid quantity'
  }
  if (props.mode === 'sell' && props.maxQuantity && Number(quantity.value) > props.maxQuantity) {
    qtyError.value = `Max ${props.maxQuantity} available`
  }
  if (!price.value || Number(price.value) <= 0) {
    priceError.value = 'Enter a valid price'
  }

  return !qtyError.value && !priceError.value && !assetError.value
}

function handleSubmit() {
  if (!validate()) return

  const assetId = selectedAsset.value?.id || props.preselectedAsset?.asset_id
  if (!assetId) return

  emit('submit', {
    asset_id: assetId,
    transaction_type: props.mode,
    quantity: Number(quantity.value),
    price_per_unit: Number(price.value),
    fees: Number(fees.value) || 0,
    transaction_date: new Date(date.value).toISOString(),
  })
}

const total = computed(() => {
  if (!quantity.value || !price.value) return null
  return Number(quantity.value) * Number(price.value) + Number(fees.value || 0)
})
</script>

<template>
  <form class="tx-form" @submit.prevent="handleSubmit">
    <h2 class="tx-form__title">{{ mode === 'buy' ? 'Buy' : 'Sell' }} Asset</h2>

    <!-- Asset selection -->
    <div v-if="!preselectedAsset" class="tx-form__field">
      <label class="tx-form__label">Asset</label>
      <AssetSearch @select="handleAssetSelect" />
      <p v-if="assetError" class="tx-form__error">{{ assetError }}</p>
    </div>
    <div v-else class="tx-form__preselected">
      <span class="tx-form__label">Asset</span>
      <span class="tx-form__preselected-value">
        <strong>{{ preselectedAsset.symbol }}</strong> — {{ preselectedAsset.name }}
      </span>
    </div>

    <!-- Quantity -->
    <MField
      id="tx-qty"
      :label="`Quantity${mode === 'sell' && maxQuantity ? ' (max ' + maxQuantity + ')' : ''}`"
      :message="qtyError"
      :is-invalid="!!qtyError"
    >
      <MTextInput
        id="tx-qty"
        v-model="quantity"
        placeholder="0"
        input-type="number"
        :is-invalid="!!qtyError"
      />
    </MField>

    <!-- Price -->
    <MField id="tx-price" label="Price per unit" :message="priceError" :is-invalid="!!priceError">
      <MTextInput
        id="tx-price"
        v-model="price"
        placeholder="0.00"
        input-type="number"
        :is-invalid="!!priceError"
      />
    </MField>

    <!-- Fees -->
    <MField id="tx-fees" label="Fees">
      <MTextInput id="tx-fees" v-model="fees" placeholder="0" input-type="number" />
    </MField>

    <!-- Date -->
    <MField id="tx-date" label="Date">
      <MTextInput id="tx-date" v-model="date" input-type="datetime-local" />
    </MField>

    <!-- Total preview -->
    <div v-if="total !== null" class="tx-form__total">
      Total: {{ total.toFixed(2) }}
    </div>

    <div class="tx-form__actions">
      <MButton variant="secondary" type="button" @click="emit('cancel')">Cancel</MButton>
      <MButton variant="primary" type="submit">{{ mode === 'buy' ? 'Buy' : 'Sell' }}</MButton>
    </div>
  </form>
</template>

<style scoped>
.tx-form {
  background: var(--mu-color-surface, #fff);
  border: 1px solid var(--mu-color-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tx-form__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.tx-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.tx-form__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--mu-color-text, #0f172a);
}

.tx-form__preselected {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.tx-form__preselected-value {
  padding: 0.625rem 0.75rem;
  background: var(--mu-color-surface-hover, #f8fafc);
  border-radius: 0.5rem;
  font-size: 0.9375rem;
}

.tx-form__total {
  padding: 0.75rem;
  background: var(--mu-color-surface-hover, #f8fafc);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}

.tx-form__error {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: #ef4444;
}

.tx-form__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
</style>
