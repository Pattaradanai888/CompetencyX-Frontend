export type Locale = 'en' | 'th'

const SELECTED_LANGUAGE_KEY = 'competencyx:preferred-language'

function readStoredLocale(): Locale | null {
  if (import.meta.client) {
    const stored = localStorage.getItem(SELECTED_LANGUAGE_KEY)
    if (stored === 'th' || stored === 'en') return stored
  }
  return null
}

export function useLocale() {
  const stored = readStoredLocale()
  const currentLanguage = useState<Locale>('locale', () => stored ?? 'en')
  const localeInitialized = useState<boolean>('locale-initialized', () => stored !== null)

  onMounted(() => {
    const lang = readStoredLocale()
    if (lang) {
      currentLanguage.value = lang
      localeInitialized.value = true
    }
  })

  function selectLanguage(lang: Locale) {
    currentLanguage.value = lang
    localeInitialized.value = true
    if (import.meta.client) {
      localStorage.setItem(SELECTED_LANGUAGE_KEY, lang)
    }
  }

  const isThai = computed(() => currentLanguage.value === 'th')

  return {
    currentLanguage,
    selectLanguage,
    isThai,
    localeInitialized,
  }
}
