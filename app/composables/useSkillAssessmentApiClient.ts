import { useApiClient } from '~/composables/useApiClient'
import type {
  SkillAssessmentCatalog,
  SkillAssessmentNextQuestionResponse,
  SkillAssessmentSessionState,
} from '~~/shared/types/assessment'

export function useSkillAssessmentApiClient() {
  const { apiFetch } = useApiClient()

  async function getSkillAssessmentCatalog(sessionId: string) {
    return await apiFetch<SkillAssessmentCatalog>(
      `/api/v1/assessment-sessions/${sessionId}/skill-assessment/catalog/`,
    )
  }

  /**
   * The next item to ask, decided from the answers handed in -- saved or not.
   * `next_question` is null once the assessment should stop: the suggestions
   * have settled, or the ceiling was reached, or nothing is left to ask.
   */
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
    state: Pick<SkillAssessmentSessionState, 'completed' | 'answers'>,
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
   * the suggestions visibly react. The account credential travels with every
   * request through the API client.
   */
  async function markHeldTopic(sessionId: string, topicKey: string) {
    return await apiFetch<SkillAssessmentSessionState>(
      `/api/v1/assessment-sessions/${sessionId}/skill-assessment/held-topics/`,
      {
        method: 'POST',
        body: { topic_key: topicKey },
      },
    )
  }

  async function unmarkHeldTopic(sessionId: string, topicKey: string) {
    return await apiFetch<SkillAssessmentSessionState>(
      `/api/v1/assessment-sessions/${sessionId}/skill-assessment/held-topics/${encodeURIComponent(topicKey)}/`,
      {
        method: 'DELETE',
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
