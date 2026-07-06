import type {
  AssessmentHistory,
  AssessmentInsights,
  AssessmentResult,
} from '~~/shared/types/assessment'

export function useAssessmentResults() {
  const { apiFetch } = useApiClient()

  async function getResults(sessionId: string) {
    return await apiFetch<AssessmentResult>(
      `/api/assessment-sessions/${sessionId}/results/`,
    )
  }

  async function getInsights(sessionId: string) {
    return await apiFetch<AssessmentInsights>(
      `/api/assessment-sessions/${sessionId}/insights/`,
    )
  }

  async function getHistory(sessionId: string) {
    return await apiFetch<AssessmentHistory>(
      `/api/assessment-sessions/${sessionId}/history/`,
    )
  }

  return {
    getHistory,
    getInsights,
    getResults,
  }
}
