import { useAccountToken } from '~/composables/useAccountToken'
import { useApiClient } from '~/composables/useApiClient'
import type {
  SkillAssessmentCatalog,
  SkillAssessmentNextQuestionResponse,
  SkillAssessmentSessionState,
} from '~~/shared/types/assessment'

export function useSkillAssessmentApiClient() {
  const { apiFetch } = useApiClient()
  const { getToken } = useAccountToken()

  function authHeaders(): Record<string, string> | undefined {
    const token = getToken()
    return token ? { Authorization: `Token ${token}` } : undefined
  }

  async function getSkillAssessmentCatalog(sessionId: string) {
    return await apiFetch<SkillAssessmentCatalog>(
      `/api/v1/assessment-sessions/${sessionId}/skill-assessment/catalog/`,
    )
  }

  async function getSkillAssessmentNextQuestion(
    sessionId: string,
    answers: Record<string, number> = {},
  ) {
    return await apiFetch<SkillAssessmentNextQuestionResponse>(
      `/api/v1/assessment-sessions/${sessionId}/skill-assessment/next-question/`,
      {
        method: 'POST',
        body: { answers },
      },
    )
  }

  async function getSkillAssessmentState(sessionId: string) {
    return await apiFetch<SkillAssessmentSessionState>(
      `/api/v1/assessment-sessions/${sessionId}/skill-assessment/`,
    )
  }

  async function saveSkillAssessmentState(
    sessionId: string,
    state: SkillAssessmentSessionState,
  ) {
    return await apiFetch<SkillAssessmentSessionState>(
      `/api/v1/assessment-sessions/${sessionId}/skill-assessment/`,
      {
        method: 'POST',
        body: state,
      },
    )
  }

  /**
   * Marking is the respondent's own statement about themself, so it belongs
   * to their account; the response is the updated skill-assessment state so
   * the suggestions visibly react.
   */
  async function markHeldTopic(sessionId: string, topicKey: string) {
    return await apiFetch<SkillAssessmentSessionState>(
      `/api/v1/assessment-sessions/${sessionId}/skill-assessment/held-topics/`,
      {
        method: 'POST',
        body: { topic_key: topicKey },
        headers: authHeaders(),
      },
    )
  }

  async function unmarkHeldTopic(sessionId: string, topicKey: string) {
    return await apiFetch<SkillAssessmentSessionState>(
      `/api/v1/assessment-sessions/${sessionId}/skill-assessment/held-topics/${encodeURIComponent(topicKey)}/`,
      {
        method: 'DELETE',
        headers: authHeaders(),
      },
    )
  }

  return {
    getSkillAssessmentCatalog,
    getSkillAssessmentNextQuestion,
    getSkillAssessmentState,
    saveSkillAssessmentState,
    markHeldTopic,
    unmarkHeldTopic,
  }
}
