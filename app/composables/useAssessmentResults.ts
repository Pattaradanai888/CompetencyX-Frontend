import type {
  AssessmentHistory,
  AssessmentInsights,
  AssessmentResult,
  Survey2SessionState,
} from '~/shared/types/assessment'

export function useAssessmentResults() {
  const { apiFetch } = useApiClient()

  async function getResults(sessionId: string) {
    return await apiFetch<AssessmentResult>(`/api/assessment-sessions/${sessionId}/results/`)
  }

  async function getInsights(sessionId: string) {
    return await apiFetch<AssessmentInsights>(`/api/assessment-sessions/${sessionId}/insights/`)
  }

  async function getHistory(sessionId: string) {
    return await apiFetch<AssessmentHistory>(`/api/assessment-sessions/${sessionId}/history/`)
  }

  async function getSurvey2State(sessionId: string) {
    return await apiFetch<Survey2SessionState>(`/api/assessment-sessions/${sessionId}/survey2/`)
  }

  async function saveSurvey2State(sessionId: string, payload: Survey2SessionState) {
    return await apiFetch<Survey2SessionState>(`/api/assessment-sessions/${sessionId}/survey2/`, {
      method: 'POST',
      body: payload,
    })
  }

  return {
    getHistory,
    getInsights,
    getResults,
    getSurvey2State,
    saveSurvey2State,
  }
}
