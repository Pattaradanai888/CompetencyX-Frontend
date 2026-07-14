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

  return {
    getSkillAssessmentCatalog,
    getSkillAssessmentNextQuestion,
    getSkillAssessmentState,
    saveSkillAssessmentState,
  }
}
