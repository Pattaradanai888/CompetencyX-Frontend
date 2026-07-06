import { useAssessmentSession } from '~/composables/useAssessmentSession'
import type { AssessmentSession } from '~~/shared/types/assessment'

const DEFAULT_MAX_ATTEMPTS = 4
const DEFAULT_DELAY_MS = 250

/**
 * Polls `getSession` up to `maxAttempts` times (with `delayMs` between each)
 * until the session has a current question in the `'skill'` stage, then
 * returns the hydrated session.
 *
 * This replaces the identical for-loop that was duplicated in
 * `pages/assessment/start.vue` and `pages/results/[sessionId].vue`.
 *
 * @param sessionId - The UUID of the session to poll.
 * @param maxAttempts - Maximum number of poll attempts (default 4).
 * @param delayMs - Milliseconds between attempts (default 250).
 * @returns The hydrated AssessmentSession after the poll resolves.
 */
export function useSessionPolling() {
  const { getSession } = useAssessmentSession()

  async function waitForSkillStage(
    sessionId: string,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    delayMs = DEFAULT_DELAY_MS,
  ): Promise<AssessmentSession> {
    let hydratedSession: AssessmentSession | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      hydratedSession = await getSession(sessionId)
      if (hydratedSession.current_question?.stage === 'skill') {
        break
      }
      if (attempt < maxAttempts - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
      }
    }

    return hydratedSession!
  }

  return { waitForSkillStage }
}
