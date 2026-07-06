import { computed } from 'vue'
import type { Question } from '~~/shared/types/assessment'
import { useLocale } from './useLocale'

const STANDARD_SCALES: Record<string, Record<string, string>> = {
  likert_5: {
    strongly_agree: 'เห็นด้วยอย่างยิ่ง',
    agree: 'เห็นด้วย',
    neutral: 'เป็นกลาง',
    disagree: 'ไม่เห็นด้วย',
    strongly_disagree: 'ไม่เห็นด้วยอย่างยิ่ง',
  },
  yes_no: {
    yes: 'ใช่',
    no: 'ไม่ใช่',
  },
  yes_no_maybe: {
    yes: 'ใช่',
    no: 'ไม่ใช่',
    maybe: 'อาจจะ',
  },
}

export function useQuestionI18n(questionRef: () => any | null) {
  const { isThai, currentLanguage } = useLocale()

  const localizedPrompt = computed(() => {
    const q = questionRef()
    if (!q) return ''
    const lang = currentLanguage.value
    if (lang !== 'en' && q.translations?.[lang]?.prompt) {
      return q.translations[lang].prompt
    }
    return q.prompt
  })

  const localizedHelpText = computed(() => {
    const q = questionRef()
    if (!q) return ''
    const lang = currentLanguage.value
    if (lang !== 'en' && q.translations?.[lang]?.help_text) {
      return q.translations[lang].help_text
    }
    return q.help_text || ''
  })

  const localizedOptions = computed<any[]>(() => {
    const q = questionRef()
    if (!q || !q.options) return []

    return q.options.map((opt: any) => {
      let label = opt.label
      
      if (isThai.value) {
        const key = (opt.key || '').trim().toLowerCase()
        const optLabel = (opt.label || '').trim().toLowerCase()
        const normalized = key || optLabel

        if (normalized === 'true' || optLabel === 'true') label = 'จริง'
        else if (normalized === 'false' || optLabel === 'false') label = 'เท็จ'
        else if (normalized === 'maybe' || optLabel === 'maybe') label = 'ไม่แน่ใจ'
        else if (normalized === 'yes' || optLabel === 'yes') label = 'ใช่'
        else if (normalized === 'no' || optLabel === 'no') label = 'ไม่ใช่'
        else if (q.question_type) {
          const scale = STANDARD_SCALES[q.question_type as string]
          if (scale && scale[opt.key as string]) {
            label = scale[opt.key as string]!
          }
        }
      }
      
      return { ...opt, label }
    })
  })

  const localizedResponseScale = computed<any[]>(() => {
    const q = questionRef()
    if (!q || !q.response_scale) return []

    return q.response_scale.map((opt: any) => {
      let label = opt.label
      if (isThai.value && STANDARD_SCALES.likert_5 && STANDARD_SCALES.likert_5[opt.key]) {
        label = STANDARD_SCALES.likert_5[opt.key]
      } else if (isThai.value) {
        switch (opt.value) {
          case -2: label = 'ไม่เห็นด้วยอย่างยิ่ง'; break
          case -1: label = 'ไม่เห็นด้วย'; break
          case 0: label = 'เป็นกลาง'; break
          case 1: label = 'เห็นด้วย'; break
          case 2: label = 'เห็นด้วยอย่างยิ่ง'; break
        }
      }
      return { ...opt, label }
    })
  })

  return {
    localizedPrompt,
    localizedHelpText,
    localizedOptions,
    localizedResponseScale,
  }
}
