<script setup lang="ts">
import { ref } from 'vue'
import PriceSparkline from './PriceSparkline.vue'

defineProps<{ symbol: string; name: string }>()

const hovered = ref(false)
const targetRef = ref<HTMLElement | null>(null)
const popupStyle = ref<Record<string, string>>({})

function onEnter() {
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

function onLeave() {
  hovered.value = false
}
</script>

<template>
  <span
    ref="targetRef"
    class="name-cell"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
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
}

.name-cell__popup {
  pointer-events: none;
}
</style>
