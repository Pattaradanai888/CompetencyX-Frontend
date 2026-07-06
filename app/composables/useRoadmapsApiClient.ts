import { useApiClient } from '~/composables/useApiClient'
import type {
  RoadmapsCatalog,
  RoadmapsNextQuestionResponse,
  RoadmapsSessionState,
} from '~~/shared/types/assessment'

export function useRoadmapsApiClient() {
  const { apiFetch } = useApiClient()

  async function getRoadmapsCatalog(sessionId: string) {
    return await apiFetch<RoadmapsCatalog>(
      `/api/assessment-sessions/${sessionId}/survey2/catalog/`,
    )
  }

  async function getRoadmapsNextQuestion(
    sessionId: string,
    answers: Record<string, number> = {},
  ) {
    return await apiFetch<RoadmapsNextQuestionResponse>(
      `/api/assessment-sessions/${sessionId}/survey2/next-question/`,
      {
        method: 'POST',
        body: { answers },
      },
    )
  }

  async function getRoadmapsState(sessionId: string) {
    return await apiFetch<RoadmapsSessionState>(
      `/api/assessment-sessions/${sessionId}/survey2/`,
    )
  }

  async function saveRoadmapsState(
    sessionId: string,
    state: RoadmapsSessionState,
  ) {
    return await apiFetch<RoadmapsSessionState>(
      `/api/assessment-sessions/${sessionId}/survey2/`,
      {
        method: 'POST',
        body: state,
      },
    )
  }

  return {
    getRoadmapsCatalog,
    getRoadmapsNextQuestion,
    getRoadmapsState,
    saveRoadmapsState,
  }
}
