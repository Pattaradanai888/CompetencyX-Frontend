export type Locale = 'en' | 'th'

const SELECTED_LANGUAGE_KEY = 'competencyx:preferred-language'

export function useLocale() {
  const currentLanguage = useState<Locale>('locale', () => 'en')

  onMounted(() => {
    const storedLang = localStorage.getItem(SELECTED_LANGUAGE_KEY)
    if (storedLang === 'th' || storedLang === 'en') {
      currentLanguage.value = storedLang as Locale
    }
  })

  function selectLanguage(lang: Locale) {
    currentLanguage.value = lang
    if (import.meta.client) {
      localStorage.setItem(SELECTED_LANGUAGE_KEY, lang)
    }
  }

  const isThai = computed(() => currentLanguage.value === 'th')

  return {
    currentLanguage,
    selectLanguage,
    isThai,
  }
}
