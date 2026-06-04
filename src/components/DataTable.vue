<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { MDataTable } from '@mozaic-ds/datatable-vue'
import '@mozaic-ds/datatable-vue/style.css'
import SymbolCell from '@/components/SymbolCell.vue'
import NameCell from '@/components/NameCell.vue'
import { getNumberLocale } from '@/lib/locale'

export interface HeaderDef {
  label: string
  value: string
  sortable?: boolean
  render?: 'symbol' | 'name' | 'number' | 'currency' | 'pnl' | 'date' | 'tag'
  currencyField?: string
}

const props = defineProps<{
  items: any[]
  headers: HeaderDef[]
  expandable?: boolean
  dataKeyExpand?: string
  size?: string
  nested?: boolean
}>()

const slots = useSlots()

const passthroughSlots = computed(() =>
  Object.keys(slots).filter((k) => !props.headers.some((h) => k === `cell.${h.value}`)),
)

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat(getNumberLocale(), { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}
function formatQuantity(value: number) {
  return new Intl.NumberFormat(getNumberLocale(), { minimumFractionDigits: 0, maximumFractionDigits: 8 }).format(value)
}
function pnlClass(value: number | null) {
  if (value == null) return 'text--muted'
  if (value > 0) return 'text--gain'
  if (value < 0) return 'text--loss'
  return 'text--muted'
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(getNumberLocale(), { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div :class="{ 'table-wrap': !nested }">
    <slot v-if="!nested" name="before" />
    <MDataTable
      :items="items"
      :headers="headers"
      :expandable="expandable"
      :data-key-expand="dataKeyExpand"
      :size="size ?? 's'"
      :nested="nested"
    >
      <template v-for="h in headers" :key="h.value" #[`cell.${h.value}`]="{ item }">
        <slot :name="`cell.${h.value}`" :item="item">
          <SymbolCell v-if="h.render === 'symbol'" :symbol="item[h.value]" />
          <NameCell v-else-if="h.render === 'name'" :symbol="item.symbol ?? item[h.value]" :name="item[h.value]" />
          <span v-else-if="h.render === 'number'" class="pt-num">{{ formatQuantity(item[h.value]) }}</span>
          <span v-else-if="h.render === 'currency'" class="pt-num">
            <template v-if="item[h.value] != null">{{ formatCurrency(item[h.value], item[h.currencyField ?? 'currency'] ?? 'USD') }}</template>
            <template v-else>—</template>
          </span>
          <span v-else-if="h.render === 'pnl'" :class="pnlClass(item[h.value])">
            {{ item[h.value] != null ? formatCurrency(item[h.value], item[h.currencyField ?? 'currency'] ?? 'USD') : '—' }}
          </span>
          <span v-else-if="h.render === 'date'">{{ formatDate(item[h.value]) }}</span>
          <span v-else-if="h.render === 'tag'" class="ex-tag" :class="`ex-tag--${item[h.value]}`">{{ item[h.value] }}</span>
        </slot>
      </template>

      <template v-for="name in passthroughSlots" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope || {}" />
      </template>
    </MDataTable>
  </div>
</template>

<style>
.ex-loading { padding: var(--space-6); text-align: center; }
.ex-empty { padding: var(--space-6); text-align: center; color: var(--color-text-muted); font-size: 0.8125rem; }
.ex-num { white-space: nowrap; }
.ex-tag {
  font-size: 0.625rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 1px 6px; border-radius: 4px;
}
.ex-tag--buy { background: var(--color-success-tag-bg); color: var(--color-success); }
.ex-tag--sell { background: var(--color-danger-tag-bg); color: var(--color-danger); }
</style>
