import type { Ref } from 'vue'
import { useAccountToken } from '~/composables/useAccountToken'
import { useSkillAssessmentApiClient } from '~/composables/useSkillAssessmentApiClient'
import { getErrorMessage } from '~/utils/api'
import type {
  ApiError,
  SkillAssessmentSessionState,
  SkillAssessmentTopicEntry,
} from '~~/shared/types/assessment'

/**
 * Marking a Held Topic: the respondent's own statement about themself, so it
 * belongs to their account rather than a browser (ADR-0003). A respondent who
 * is not signed in is told plainly instead of being given a control that
 * cannot work; every successful mark or unmark replaces the live
 * skill-assessment state with the backend's recomputed response, so the
 * suggestions react without a page reload.
 */
export function useHeldTopicMarking(
  sessionId: () => string,
  liveSkillState: Ref<SkillAssessmentSessionState>,
  isThai?: () => boolean,
) {
  const { getToken, clearToken } = useAccountToken()
  const { markHeldTopic, unmarkHeldTopic } = useSkillAssessmentApiClient()
  const toast = useToast()
  const { t } = usePageI18n('roadmaps', isThai)

  // Initialised during setup so a client render never flashes the
  // signed-out notice for someone holding a credential.
  const canMarkHeld = ref(import.meta.client ? getToken() !== null : false)
  const busyTopicKey = ref<string | null>(null)

  /** Every unit this account says it can already do, newest last. */
  const heldEntries = computed<SkillAssessmentTopicEntry[]>(() =>
    (liveSkillState.value.topic_states ?? []).filter(
      (entry) => entry.state === 'held',
    ),
  )

  function applySkillState(updated: SkillAssessmentSessionState) {
    liveSkillState.value = { ...liveSkillState.value, ...updated }
  }

  function handleMarkingError(error: unknown) {
    const apiError = error as ApiError
    if (apiError?.statusCode === 401 || apiError?.statusCode === 403) {
      clearToken()
      canMarkHeld.value = false
      return
    }
    toast.add({
      title: t.value.markErrorTitle,
      description: getErrorMessage(apiError) ?? undefined,
      color: 'error',
    })
  }

  async function markTopicHeld(topicKey: string) {
    if (!canMarkHeld.value || busyTopicKey.value) return
    busyTopicKey.value = topicKey
    try {
      applySkillState(await markHeldTopic(sessionId(), topicKey))
    } catch (error) {
      handleMarkingError(error)
    } finally {
      busyTopicKey.value = null
    }
  }

  async function unmarkTopicHeld(topicKey: string) {
    if (!canMarkHeld.value || busyTopicKey.value) return
    busyTopicKey.value = topicKey
    try {
      applySkillState(await unmarkHeldTopic(sessionId(), topicKey))
    } catch (error) {
      handleMarkingError(error)
    } finally {
      busyTopicKey.value = null
    }
  }

  return {
    canMarkHeld,
    busyTopicKey,
    heldEntries,
    markTopicHeld,
    unmarkTopicHeld,
  }
}
