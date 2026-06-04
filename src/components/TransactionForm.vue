<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { MField, MTextInput, MButton, MDatepicker } from '@mozaic-ds/vue'
import AssetSearch from './AssetSearch.vue'
import { fetchPrices } from '@/lib/yahoo'

type SelectedAsset = { symbol: string; name: string; asset_type: string; currency: string }

const props = defineProps<{
  mode: 'buy' | 'sell'
  maxQuantity?: number
  preselectedAsset?: { asset_id?: string; symbol: string; name: string; asset_type?: string; currency?: string }
}>()

const emit = defineEmits<{
  submit: [input: {
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
  }]
  cancel: []
}>()

const selectedAsset = ref<SelectedAsset | null>(null)

// Auto-fill price with current market price when asset is selected
watch(selectedAsset, async (asset) => {
  if (!asset) return
  try {
    const prices = await fetchPrices([asset.symbol])
    if (prices[asset.symbol] != null) {
      price.value = String(prices[asset.symbol])
    }
  } catch {
    // Silently ignore — user can enter price manually
  }
})

// Auto-fill price and quantity for preselected asset (sell from dashboard)
onMounted(async () => {
  if (props.preselectedAsset) {
    const prices = await fetchPrices([props.preselectedAsset.symbol])
    if (prices[props.preselectedAsset.symbol] != null) {
      price.value = String(prices[props.preselectedAsset.symbol])
    }
  }
  // Auto-fill max quantity in sell mode
  if (props.mode === 'sell' && props.maxQuantity != null) {
    quantity.value = String(props.maxQuantity)
  }
})

const quantity = ref('')
const price = ref('')
const fees = ref('0')
const date = ref(new Date().toISOString().slice(0, 10))
const qtyError = ref('')
const priceError = ref('')
const assetError = ref('')
const dateError = ref('')
const feesError = ref('')

function handleAssetSelect(asset: SelectedAsset | null) {
  selectedAsset.value = asset
  assetError.value = ''
}

function validate(): boolean {
  qtyError.value = ''
  priceError.value = ''
  assetError.value = ''
  dateError.value = ''
  feesError.value = ''

  if (!selectedAsset.value && !props.preselectedAsset) {
    assetError.value = 'Select an asset'
  }
  if (!quantity.value || Number(quantity.value) <= 0) {
    qtyError.value = 'Enter a valid quantity'
  }
  if (props.mode === 'sell' && props.maxQuantity != null && Number(quantity.value) > props.maxQuantity) {
    qtyError.value = `Max ${props.maxQuantity} available`
  }
  if (!price.value || Number(price.value) <= 0) {
    priceError.value = 'Enter a valid price'
  }
  if (Number.isNaN(Number(fees.value)) || Number(fees.value) < 0) {
    feesError.value = 'Fees must be >= 0'
  }
  const parsed = new Date(date.value)
  if (!date.value || Number.isNaN(parsed.getTime())) {
    dateError.value = 'Enter a valid date'
  }

  return !qtyError.value && !priceError.value && !assetError.value && !dateError.value && !feesError.value
}

function handleSubmit() {
  if (!validate()) return

  if (props.preselectedAsset) {
    emit('submit', {
      symbol: props.preselectedAsset.symbol,
      name: props.preselectedAsset.name,
      asset_type: props.preselectedAsset.asset_type || 'stock',
      currency: props.preselectedAsset.currency || 'USD',
      asset_id: props.preselectedAsset.asset_id,
      transaction_type: props.mode,
      quantity: Number(quantity.value),
      price_per_unit: Number(price.value),
      fees: Number(fees.value) || 0,
      transaction_date: new Date(date.value).toISOString(),
    })
    return
  }

  const asset = selectedAsset.value
  if (!asset) return

  emit('submit', {
    symbol: asset.symbol,
    name: asset.name,
    asset_type: asset.asset_type,
    currency: asset.currency,
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
      :label="`Quantity${mode === 'sell' && maxQuantity != null ? ' (max ' + maxQuantity + ')' : ''}`"
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
    <MField id="tx-fees" label="Fees" :message="feesError" :is-invalid="!!feesError">
      <MTextInput id="tx-fees" v-model="fees" placeholder="0" input-type="number" :is-invalid="!!feesError" />
    </MField>

    <!-- Date -->
    <MField id="tx-date" label="Date" :message="dateError" :is-invalid="!!dateError">
      <MDatepicker id="tx-date" v-model="date" />
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
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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
  color: var(--color-text);
}

.tx-form__preselected-value {
  padding: 10px var(--space-3);
  background: var(--color-card-hover);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
}

.tx-form__total {
  padding: var(--space-3);
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  color: var(--color-primary);
}

.tx-form__error {
  margin: var(--space-1) 0 0;
  font-size: 0.75rem;
  color: var(--color-danger);
}

.tx-form__preselected {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tx-form__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
</style>
