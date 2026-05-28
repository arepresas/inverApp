<script setup lang="ts">
defineProps<{ symbol: string }>()
</script>

<template>
  <a
    :href="`https://finance.yahoo.com/quote/${symbol}`"
    target="_blank"
    rel="noopener noreferrer"
    class="symbol-cell__link"
  >{{ symbol }}</a>
</template>

<style scoped>
.symbol-cell__link {
  font-weight: 600;
  color: var(--mu-color-primary, #2563eb);
  text-decoration: none;
}

.symbol-cell__link:hover {
  text-decoration: underline;
}
</style>
