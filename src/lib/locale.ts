import { useSettingsStore } from '@/stores/settings'

/**
 * Returns locale for number/currency formatting.
 * Priority: user's selected country → OS region → browser language.
 */
export function getNumberLocale(): string {
  const settings = useSettingsStore()
  return settings.locale
}
