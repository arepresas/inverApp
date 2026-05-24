<script setup lang="ts">
import { ref, watch } from 'vue'
import { MTextInput, MField } from '@mozaic-ds/vue'
import { searchAssets } from '@/lib/yahoo'

const emit = defineEmits<{
  select: [asset: { symbol: string; name: string; asset_type: string; currency: string } | null]
}>()

const search = ref('')
const results = ref<{ symbol: string; name: string; asset_type: string; currency: string }[]>([])
const loading = ref(false)
const selected = ref(false)
const open = ref(false)
let skipWatch = false

let debounce: ReturnType<typeof setTimeout> | null = null

watch(search, (value) => {
  if (skipWatch) {
    skipWatch = false
    return
  }
  if (selected.value) {
    selected.value = false
    emit('select', null)
  }
  if (debounce) clearTimeout(debounce)
  if (!value || value.length < 2) {
    results.value = []
    return
  }
  debounce = setTimeout(() => fetchResults(value), 300)
})

async function fetchResults(query: string) {
  loading.value = true
  try {
    results.value = await searchAssets(query)
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function selectResult(item: (typeof results.value)[0]) {
  skipWatch = true
  selected.value = true
  search.value = `${item.symbol} — ${item.name}`
  open.value = false
  results.value = []
  emit('select', item)
}

function handleBlur() {
  setTimeout(() => { open.value = false }, 150)
}
</script>

<template>
  <div class="asset-search">
    <MField id="asset-search" label="Asset">
      <div class="asset-search__wrap">
        <MTextInput
          id="asset-search"
          v-model="search"
          placeholder="Search symbol or name (e.g. AAPL, Bitcoin)"
          :is-clearable="!!search"
          @focus="open = true"
          @blur="handleBlur"
        />
      </div>
    </MField>

    <ul v-if="open && results.length" class="asset-search__dropdown">
      <li
        v-for="item in results"
        :key="item.symbol"
        class="asset-search__option"
        @mousedown.prevent="selectResult(item)"
      >
        <span class="asset-search__symbol">{{ item.symbol }}</span>
        <span class="asset-search__name">{{ item.name }}</span>
        <span class="asset-search__type">{{ item.asset_type }}</span>
        <span class="asset-search__currency">{{ item.currency }}</span>
      </li>
    </ul>

    <p v-if="loading" class="asset-search__loading">Searching Yahoo Finance...</p>
  </div>
</template>

<style scoped>
.asset-search {
  position: relative;
}

.asset-search__wrap {
  width: 100%;
}

.asset-search__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--mu-color-surface, #fff);
  border: 1px solid var(--mu-color-border, #e2e8f0);
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  max-height: 16rem;
  overflow-y: auto;
  list-style: none;
  padding: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.asset-search__option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.1s;
}

.asset-search__option:hover {
  background: var(--mu-color-surface-hover, #f1f5f9);
}

.asset-search__symbol {
  font-weight: 600;
  font-size: 0.875rem;
  min-width: 4rem;
}

.asset-search__name {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--mu-color-text-secondary, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-search__type {
  font-size: 0.6875rem;
  text-transform: uppercase;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: var(--mu-color-surface-hover, #f1f5f9);
  color: var(--mu-color-text-secondary, #94a3b8);
}

.asset-search__currency {
  font-size: 0.6875rem;
  color: var(--mu-color-text-secondary, #94a3b8);
}

.asset-search__loading {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--mu-color-text-secondary, #94a3b8);
}
</style>
