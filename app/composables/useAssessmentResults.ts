import type {
  AssessmentHistory,
  AssessmentResult,
} from '~~/shared/types/assessment'

export function useAssessmentResults() {
  const { apiFetch } = useApiClient()

  async function getResults(sessionId: string) {
    return await apiFetch<AssessmentResult>(
      `/api/v1/assessment-sessions/${sessionId}/results/`,
    )
  }

  async function getHistory(sessionId: string) {
    return await apiFetch<AssessmentHistory>(
      `/api/v1/assessment-sessions/${sessionId}/history/`,
    )
  }

  return {
    getHistory,
    getResults,
  }
}
