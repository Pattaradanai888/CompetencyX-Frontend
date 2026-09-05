import type { Ref } from 'vue'
import { useCurrentAccount } from '~/composables/useCurrentAccount'
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
  const { isSignedIn, forget } = useCurrentAccount()
  const { markHeldTopic, unmarkHeldTopic } = useSkillAssessmentApiClient()
  const toast = useToast()
  const t = usePageI18n('roadmaps', isThai)

  // The credential cookie is readable during the server render, so a
  // signed-in respondent never sees the signed-out notice flash.
  const canMarkHeld = computed(() => isSignedIn.value)
  const busyTopicKey = ref<string | null>(null)

  /**
   * Only what this account actually marked, because each row carries its undo.
   * A unit held because the respondent rated it highly has no mark to take
   * back, so listing it here would offer a control that does nothing.
   */
  const heldEntries = computed<SkillAssessmentTopicEntry[]>(() => {
    if (!canMarkHeld.value) {
      return []
    }
    return (liveSkillState.value.topic_states ?? []).filter(
      (entry) => entry.state === 'held' && entry.held_by_mark === true,
    )
  })

  function applySkillState(updated: SkillAssessmentSessionState) {
    liveSkillState.value = { ...liveSkillState.value, ...updated }
  }

  function handleMarkingError(error: unknown) {
    const apiError = error as ApiError
    if (apiError?.statusCode === 401 || apiError?.statusCode === 403) {
      // The credential no longer authenticates: drop it, and the notice that
      // marking requires an account takes the control's place.
      forget()
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
