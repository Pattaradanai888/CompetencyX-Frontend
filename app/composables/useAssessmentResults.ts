import type { AssessmentResult } from '~~/shared/types/assessment'

export function useAssessmentResults() {
  const { apiFetch } = useApiClient()

  async function getResults(sessionId: string) {
    return await apiFetch<AssessmentResult>(
      `/api/v1/assessment-sessions/${sessionId}/results/`,
    )
  }

  return {
    getResults,
  }
}
