import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface CountryEntry {
  code: string
  name: string
  locale: string
}

export const COUNTRIES: CountryEntry[] = [
  { code: 'FR', name: 'France', locale: 'fr-FR' },
  { code: 'ES', name: 'España', locale: 'es-ES' },
  { code: 'US', name: 'United States', locale: 'en-US' },
  { code: 'DE', name: 'Deutschland', locale: 'de-DE' },
  { code: 'IT', name: 'Italia', locale: 'it-IT' },
  { code: 'UK', name: 'United Kingdom', locale: 'en-GB' },
  { code: 'JP', name: '日本', locale: 'ja-JP' },
  { code: 'BR', name: 'Brasil', locale: 'pt-BR' },
  { code: 'MX', name: 'México', locale: 'es-MX' },
  { code: 'CN', name: '中国', locale: 'zh-CN' },
  { code: 'KR', name: '한국', locale: 'ko-KR' },
  { code: 'IN', name: 'India', locale: 'en-IN' },
  { code: 'CA', name: 'Canada', locale: 'en-CA' },
  { code: 'AU', name: 'Australia', locale: 'en-AU' },
]

const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]))

export const useSettingsStore = defineStore('settings', () => {
  const country = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const locale = computed(() => {
    if (country.value) {
      const entry = COUNTRY_BY_CODE[country.value]
      if (entry) return entry.locale
    }
    const resolved = Intl.DateTimeFormat().resolvedOptions().locale
    if (resolved.includes('-')) return resolved
    const candidates = navigator.languages ?? [navigator.language]
    return candidates.find((l) => l.includes('-')) ?? navigator.language
  })

  async function fetchProfile() {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('profiles')
      .select('country')
      .single()

    if (err) {
      error.value = err.message
    } else if (data) {
      country.value = data.country ?? null
    }

    loading.value = false
  }

  async function saveCountry(code: string) {
    loading.value = true
    error.value = null

    const { error: err } = await supabase
      .from('profiles')
      .update({ country: code })
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .select()

    if (err) {
      error.value = err.message
    } else {
      country.value = code
    }

    loading.value = false
  }

  return {
    country,
    locale,
    loading,
    error,
    fetchProfile,
    saveCountry,
  }
})
