<script setup lang="ts">
import { onMounted } from 'vue'
import { watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const auth = useAuthStore()
const settings = useSettingsStore()

onMounted(() => {
  auth.init()
})

watch(
  () => auth.user,
  (user) => {
    if (user) settings.fetchProfile()
  },
  { immediate: true },
)
</script>

<template>
  <RouterView />
</template>
