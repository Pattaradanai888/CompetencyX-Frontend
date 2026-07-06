import type { Ref } from 'vue'
import { computed, isRef } from 'vue'
import en from '~/i18n/en'
import th from '~/i18n/th'
import { useLocale } from '~/composables/useLocale'

export type Messages = typeof en
export type PageKey = keyof Messages

export function usePageI18n<K extends PageKey>(
  page: K,
  localIsThai?: Ref<boolean> | (() => boolean),
) {
  const { isThai: globalIsThai } = useLocale()

  return computed(() => {
    let thMode = globalIsThai.value
    if (localIsThai !== undefined) {
      if (isRef(localIsThai)) {
        thMode = localIsThai.value
      } else if (typeof localIsThai === 'function') {
        thMode = localIsThai()
      }
    }
    return thMode ? th[page] : en[page]
  })
}
