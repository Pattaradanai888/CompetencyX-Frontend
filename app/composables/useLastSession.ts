import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useRoadmapsApiClient } from '~/composables/useRoadmapsApiClient'
import { useLocale } from '~/composables/useLocale'
import type { AssessmentSession } from '~~/shared/types/assessment'

/**
 * Provides smart session-resumption helpers used across the landing page,
 * start page, and preferred-role gate.
 *
 * - `lastSessionSnapshot` is populated on mount from the stored session ID.
 * - `isSurvey2Complete` checks whether the user has completed the roadmap
 *   survey (survey2), fetched from the survey2 endpoint.
 * - `lastSessionRoute` picks the correct resume URL based on session state.
 * - `resumeLabel` returns a localised label for the resume button.
 */
export function useLastSession(
  resumeBtnKey: { th: string; en: string } = {
    th: 'กลับไปทำเซสชันล่าสุด',
    en: 'Resume previous session',
  },
) {
  const { getSession, lastSessionId } = useAssessmentSession()
  const { getRoadmapsState } = useRoadmapsApiClient()
  const { isThai } = useLocale()
  const lastSessionSnapshot = ref<AssessmentSession | null>(null)
  const survey2Completed = ref(false)

  const isSurvey2Complete = computed(() => survey2Completed.value)

  const lastSessionRoute = computed(() => {
    if (!lastSessionId.value) return null
    const snap = lastSessionSnapshot.value
    if (!snap) return `/assessment/${lastSessionId.value}`

    if (isSurvey2Complete.value || snap.preferred_role)
      return `/roadmaps/${lastSessionId.value}`

    if (snap.status === 'completed') return `/results/${lastSessionId.value}`

    return `/assessment/${lastSessionId.value}`
  })

  const resumeLabel = computed(() => {
    if (!lastSessionSnapshot.value)
      return isThai.value ? resumeBtnKey.th : resumeBtnKey.en
    if (isSurvey2Complete.value) {
      return isThai.value ? 'ดูผลลัพธ์เซสชันล่าสุด' : 'View last session result'
    }
    if (lastSessionSnapshot.value.status === 'completed') {
      return isThai.value ? 'ดูผลการประเมินล่าสุด' : 'View last evaluation'
    }
    return isThai.value ? resumeBtnKey.th : resumeBtnKey.en
  })

  onMounted(async () => {
    if (!lastSessionId.value) return
    try {
      lastSessionSnapshot.value = await getSession(lastSessionId.value)
    } catch {
      lastSessionSnapshot.value = null
      return
    }
    try {
      const s2 = await getRoadmapsState(lastSessionId.value)
      survey2Completed.value = s2.completed === true
    } catch {
      survey2Completed.value = false
    }
  })

  return {
    lastSessionSnapshot,
    isSurvey2Complete,
    lastSessionRoute,
    resumeLabel,
  }
}
