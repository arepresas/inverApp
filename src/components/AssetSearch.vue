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
        v-for="(item, idx) in results"
        :key="item.symbol + '-' + idx"
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
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  margin-top: var(--space-1);
  max-height: 16rem;
  overflow-y: auto;
  list-style: none;
  padding: var(--space-1);
  box-shadow: var(--shadow-lg);
}

.asset-search__option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.1s;
}

.asset-search__option:hover {
  background: var(--color-card-hover);
}

.asset-search__symbol {
  font-weight: 600;
  font-size: 0.875rem;
  min-width: 4rem;
  color: var(--color-text);
}

.asset-search__name {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-search__type {
  font-size: 0.6875rem;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-card-hover);
  color: var(--color-text-muted);
}

.asset-search__currency {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.asset-search__loading {
  margin-top: var(--space-2);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}
</style>
