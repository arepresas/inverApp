<script setup lang="ts">
import { ref } from 'vue'
import PriceSparkline from './PriceSparkline.vue'

defineProps<{ symbol: string; name: string }>()

const hovered = ref(false)
const targetRef = ref<HTMLElement | null>(null)
const popupStyle = ref<Record<string, string>>({})

function showPopup() {
  if (!targetRef.value) return
  const rect = targetRef.value.getBoundingClientRect()
  popupStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left + rect.width / 2}px`,
    transform: 'translateX(-50%)',
    zIndex: '9999',
  }
  hovered.value = true
}

function hidePopup() {
  hovered.value = false
}
</script>

<template>
  <span
    ref="targetRef"
    class="name-cell"
    tabindex="0"
    @mouseenter="showPopup"
    @mouseleave="hidePopup"
    @focus="showPopup"
    @blur="hidePopup"
    @keydown.escape="hidePopup"
  >{{ name }}</span>
  <Teleport to="body">
    <div v-if="hovered" :style="popupStyle" class="name-cell__popup">
      <PriceSparkline :symbol="symbol" />
    </div>
  </Teleport>
</template>

<style scoped>
.name-cell {
  cursor: default;
  outline: none;
}

.name-cell:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

.name-cell__popup {
  pointer-events: none;
}
</style>
