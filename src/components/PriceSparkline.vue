<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = defineProps<{ symbol: string }>()

interface ChartPoint {
  date: number
  close: number
}

const data = ref<ChartPoint[] | null>(null)
const loading = ref(false)

const width = 180
const height = 40
const padding = 4

const viewBox = computed(() => `0 0 ${width} ${height}`)

const points = computed(() => {
  if (!data.value?.length) return ''
  const vals = data.value.map((d) => d.close)
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  const range = max - min || 1
  const xStep = (width - padding * 2) / (vals.length - 1)

  return vals
    .map((v, i) => {
      const x = padding + i * xStep
      const y = padding + (1 - (v - min) / range) * (height - padding * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const isUp = computed(() => {
  if (!data.value?.length) return false
  return data.value[data.value.length - 1].close >= data.value[0].close
})

const color = computed(() => (isUp.value ? '#16a34a' : '#dc2626'))

const latestPrice = computed(() => {
  if (!data.value?.length) return ''
  const last = data.value[data.value.length - 1]
  return last.close.toFixed(2)
})

const change = computed(() => {
  if (!data.value?.length) return ''
  const first = data.value[0].close
  const last = data.value[data.value.length - 1].close
  const pct = ((last - first) / first) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
})

onMounted(async () => {
  loading.value = true
  try {
    const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(props.symbol)}?range=3mo&interval=1d`
    const res = await fetch(url)
    if (!res.ok) return
    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) return
    const timestamps: number[] = result.timestamp ?? []
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? []
    data.value = timestamps.map((t, i) => ({ date: t * 1000, close: closes[i] })).filter((d) => d.close != null)
  } catch {
    // silently fail — just don't show chart
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="data?.length" class="sparkline">
    <div class="sparkline__header">
      <span class="sparkline__symbol">{{ symbol }}</span>
      <span class="sparkline__label">3 months</span>
    </div>
    <div class="sparkline__body">
      <svg :width="width" :height="height" :viewBox="viewBox" class="sparkline__svg">
        <polyline
          :points="points"
          fill="none"
          :stroke="color"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div class="sparkline__info">
        <span class="sparkline__price">{{ latestPrice }}</span>
        <span class="sparkline__change" :style="{ color }">{{ change }}</span>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="sparkline sparkline--loading">
    <svg :width="width" :height="height" :viewBox="viewBox" class="sparkline__svg" />
  </div>
</template>

<style scoped>
.sparkline {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  white-space: nowrap;
  overflow: hidden;
}

.sparkline__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-card-hover);
}

.sparkline__symbol {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.sparkline__label {
  font-size: 0.625rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.sparkline__body {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px var(--space-2);
}

.sparkline__svg {
  flex-shrink: 0;
}

.sparkline__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.sparkline__price {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text);
}

.sparkline__change {
  font-size: 0.6875rem;
  font-weight: 600;
}
</style>
