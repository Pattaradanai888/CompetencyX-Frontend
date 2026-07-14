import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useRoadmapsApiClient } from '~/composables/useRoadmapsApiClient'
import { useLocale } from '~/composables/useLocale'
import type { AssessmentSession } from '~~/shared/types/assessment'

// Deduplicates concurrent snapshot fetches when several components (e.g.
// AppHeader and a page) mount this composable on the same page. Cleared once
// resolved so a later page visit still refreshes the snapshot.
let inflightSnapshotFetch: Promise<void> | null = null

/**
 * Seed the last-session state from data a page already fetched in its
 * useAsyncData handler (e.g. the roadmaps page loads both the session and the
 * survey2 state), so useLastSession consumers such as AppHeader do not
 * re-request the same endpoints after hydration. Call during setup.
 */
export function seedLastSessionState(
  session: AssessmentSession | null,
  survey2Completed?: boolean,
) {
  if (!session) return
  useState<AssessmentSession | null>('last-session-snapshot', () => null).value =
    session
  if (survey2Completed !== undefined) {
    useState<boolean>('last-session-survey2-completed', () => false).value =
      survey2Completed
    useState<string | null>('last-session-survey2-seeded-id', () => null).value =
      session.id
  }
}

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
  const { getSession, lastSessionId, session } = useAssessmentSession()
  const { getRoadmapsState } = useRoadmapsApiClient()
  const { isThai } = useLocale()
  const lastSessionSnapshot = useState<AssessmentSession | null>(
    'last-session-snapshot',
    () => null,
  )
  const survey2Completed = useState<boolean>(
    'last-session-survey2-completed',
    () => false,
  )
  const survey2SeededId = useState<string | null>(
    'last-session-survey2-seeded-id',
    () => null,
  )

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

  onMounted(() => {
    const sessionId = lastSessionId.value
    if (!sessionId || inflightSnapshotFetch) return

    // Reuse data the current page already fetched during SSR: the shared
    // session state covers the snapshot, and pages that also loaded the
    // survey2 state seed it via seedLastSessionState().
    const hasSession =
      lastSessionSnapshot.value?.id === sessionId ||
      session.value?.id === sessionId
    if (session.value?.id === sessionId) {
      lastSessionSnapshot.value = session.value
    }
    const hasSurvey2 = survey2SeededId.value === sessionId
    if (hasSession && hasSurvey2) return

    inflightSnapshotFetch = (async () => {
      if (!hasSession) {
        try {
          lastSessionSnapshot.value = await getSession(sessionId)
        } catch {
          lastSessionSnapshot.value = null
          return
        }
      }
      if (!hasSurvey2) {
        try {
          const s2 = await getRoadmapsState(sessionId)
          survey2Completed.value = s2.completed === true
        } catch {
          survey2Completed.value = false
        }
      }
    })().finally(() => {
      inflightSnapshotFetch = null
    })
  })

  return {
    lastSessionSnapshot,
    isSurvey2Complete,
    lastSessionRoute,
    resumeLabel,
  }
}
