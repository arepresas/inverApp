<script setup lang="ts">
defineProps<{ symbol: string }>()
</script>

<template>
  <a
    :href="`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`"
    target="_blank"
    rel="noopener noreferrer"
    class="symbol-cell__link"
  >{{ symbol }}</a>
</template>

<style scoped>
.symbol-cell__link {
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}

.symbol-cell__link:hover {
  text-decoration: underline;
}
</style>
