import { PREFERRED_LANGUAGE_KEY } from '~/utils/constants'

export type Locale = 'en' | 'th'

function readStoredLocale(): Locale | null {
  if (import.meta.client) {
    const stored = localStorage.getItem(PREFERRED_LANGUAGE_KEY)
    if (stored === 'th' || stored === 'en') return stored
  }
  return null
}

export function useLocale() {
  const currentLanguage = useState<Locale>('locale', () => 'en')
  const localeInitialized = useState<boolean>('locale-initialized', () => false)

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
      localStorage.setItem(PREFERRED_LANGUAGE_KEY, lang)
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
