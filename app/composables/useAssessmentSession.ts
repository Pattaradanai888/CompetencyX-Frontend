import type {
  AnswerSubmitPayload,
  AssessmentSession,
  SessionCreatePayload,
} from '~/shared/types/assessment'

const STORAGE_KEY = 'competencyx:last-session-id'

export function useAssessmentSession() {
  const { apiFetch } = useApiClient()
  const session = useState<AssessmentSession | null>(
    'assessment-session',
    () => null,
  )
  const isSubmitting = useState<boolean>('assessment-submitting', () => false)
  const lastSessionId = useState<string | null>(
    'assessment-last-session-id',
    () => null,
  )

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      lastSessionId.value = stored
    }
  })

  function rememberSession(nextSession: AssessmentSession) {
    session.value = nextSession
    lastSessionId.value = nextSession.id
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, nextSession.id)
    }
    return nextSession
  }

  async function createSession(payload: SessionCreatePayload = {}) {
    const nextSession = await apiFetch<AssessmentSession>(
      '/api/assessment-sessions/',
      {
        method: 'POST',
        body: payload,
      },
    )

    return rememberSession(nextSession)
  }

  async function getSession(sessionId: string) {
    const nextSession = await apiFetch<AssessmentSession>(
      `/api/assessment-sessions/${sessionId}/`,
    )
    return rememberSession(nextSession)
  }

  async function submitAnswer(sessionId: string, payload: AnswerSubmitPayload) {
    if (isSubmitting.value) {
      return session.value
    }

    isSubmitting.value = true

    try {
      const nextSession = await apiFetch<AssessmentSession>(
        `/api/assessment-sessions/${sessionId}/answers/`,
        {
          method: 'POST',
          body: payload,
        },
      )

      return rememberSession(nextSession)
    } finally {
      isSubmitting.value = false
    }
  }

  function clearSession() {
    session.value = null
    isSubmitting.value = false
    lastSessionId.value = null
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return {
    clearSession,
    createSession,
    getSession,
    isSubmitting,
    lastSessionId,
    session,
    submitAnswer,
  }
}
