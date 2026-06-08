import type {
  AssessmentHistory,
  AssessmentInsights,
  AssessmentResult,
  ApiError,
  RoadmapsCatalog,
  RoadmapsNextQuestionResponse,
  RoadmapsSessionState,
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

  async function fetchRoadmapsEndpoint<T>(
    sessionId: string,
    suffix = '',
    options?: Parameters<typeof apiFetch<T>>[1],
  ) {
    const roadmapsPath = `/api/assessment-sessions/${sessionId}/roadmaps/${suffix}`

    try {
      return await apiFetch<T>(roadmapsPath, options)
    } catch (error) {
      if ((error as ApiError).statusCode !== 404) {
        throw error
      }

      return await apiFetch<T>(
        `/api/assessment-sessions/${sessionId}/survey2/${suffix}`,
        options,
      )
    }
  }

  async function getRoadmapsState(sessionId: string) {
    return await fetchRoadmapsEndpoint<RoadmapsSessionState>(sessionId)
  }

  async function getRoadmapsCatalog(sessionId: string) {
    return await fetchRoadmapsEndpoint<RoadmapsCatalog>(sessionId, 'catalog/')
  }

  async function saveRoadmapsState(
    sessionId: string,
    payload: RoadmapsSessionState,
  ) {
    return await fetchRoadmapsEndpoint<RoadmapsSessionState>(sessionId, '', {
      method: 'POST',
      body: payload,
    })
  }

  async function getRoadmapsNextQuestion(
    sessionId: string,
    answers: Record<string, number>,
  ) {
    return await fetchRoadmapsEndpoint<RoadmapsNextQuestionResponse>(
      sessionId,
      'next-question/',
      {
        method: 'POST',
        body: { answers },
      },
    )
  }

  return {
    getHistory,
    getInsights,
    getResults,
    getRoadmapsCatalog,
    getRoadmapsState,
    getRoadmapsNextQuestion,
    saveRoadmapsState,
  }
}
