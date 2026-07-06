import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { navigateTo } from '#app'
import type { SessionCreatePayload } from '~~/shared/types/assessment'

export function useSessionCreate() {
  const { createSession, isSubmitting } = useAssessmentSession()

  async function createAndNavigate(payload: SessionCreatePayload) {
    const session = await createSession(payload)
    await navigateTo(`/roadmaps/${session.id}`)
  }

  return { createAndNavigate, isSubmitting }
}
