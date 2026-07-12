import { LOCALE_COOKIE_KEY, PREFERRED_LANGUAGE_KEY } from '~/utils/constants'

export type Locale = 'en' | 'th'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'th'
}

export function useLocale() {
  const localeCookie = useCookie<Locale | null>(LOCALE_COOKIE_KEY, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  })
  const storedLocale = isLocale(localeCookie.value) ? localeCookie.value : null

  const currentLanguage = useState<Locale>('locale', () => storedLocale ?? 'en')
  const localeInitialized = useState<boolean>(
    'locale-initialized',
    () => storedLocale !== null,
  )

  // One-time migration from the old localStorage-only preference.
  onMounted(() => {
    if (localeInitialized.value) return
    const stored = localStorage.getItem(PREFERRED_LANGUAGE_KEY)
    if (isLocale(stored)) {
      selectLanguage(stored)
    }
  })

  function selectLanguage(lang: Locale) {
    currentLanguage.value = lang
    localeInitialized.value = true
    localeCookie.value = lang
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
