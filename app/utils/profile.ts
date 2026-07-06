/**
 * Type-safe accessor utilities for the `profile` JSON field stored on
 * `AssessmentSession`. The backend stores `survey2` state inside
 * `session.profile` as an arbitrary DictField — this module provides
 * typed interfaces and a single access point so callers never need to
 * cast `Record<string, unknown>` manually.
 */

export interface Survey2ProfileState {
  /** Whether the user has submitted the roadmap survey. */
  completed: boolean
  /** Map of question-id → answer value (1–5). */
  answers: Record<string, number>
  /** ISO timestamp when `completed` was set to true, or null. */
  completed_at: string | null
}

/**
 * Reads `profile.survey2` from a session profile object and returns it
 * as a typed `Survey2ProfileState` if the shape is valid, otherwise null.
 */
export function getSurvey2State(
  profile: Record<string, unknown> | null | undefined,
): Survey2ProfileState | null {
  if (!profile) return null
  const raw = profile['survey2']
  if (
    typeof raw !== 'object' ||
    raw === null ||
    typeof (raw as Record<string, unknown>)['completed'] !== 'boolean'
  ) {
    return null
  }
  const s2 = raw as Record<string, unknown>
  return {
    completed: s2['completed'] as boolean,
    answers: (typeof s2['answers'] === 'object' && s2['answers'] !== null
      ? s2['answers']
      : {}) as Record<string, number>,
    completed_at:
      typeof s2['completed_at'] === 'string' ? s2['completed_at'] : null,
  }
}
