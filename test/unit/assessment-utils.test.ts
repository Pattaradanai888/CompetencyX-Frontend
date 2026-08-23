import { describe, expect, it } from 'vitest'
import {
  formatConfidencePercent,
  getAlignmentLabel,
  getQuestionTypeLabel,
  isSessionComplete,
} from '../../app/utils/assessment'
import type {
  AssessmentResult,
  AssessmentSession,
} from '../../shared/types/assessment'

const baseSession: AssessmentSession = {
  id: 'session-1',
  status: 'in_progress',
  phase: 'role_discovery',
  best_fit_confidence: 0.42,
  preferred_role: null,
  current_role: null,
  best_fit_role: null,
  profile: null,
  started_at: '2026-04-17T04:00:00Z',
  updated_at: '2026-04-17T04:00:00Z',
  completed_at: null,
  milestones: {
    answered_role_questions: 1,
    answered_core_role_questions: 1,
    answered_tie_break_questions: 0,
  },
  role_alignment_status: 'unknown',
  role_resolution_status: 'in_progress',
  guidance_summary: 'Working on it.',
  current_question: {
    id: 1,
    code: 'role-primary-interest',
    stage: 'role',
    question_type: 'single_choice',
    prompt: 'Prompt',
    help_text: '',
    role: null,
    topic: null,
    options: [],
  },
}

describe('assessment utils', () => {
  it('detects completed sessions and results payloads', () => {
    expect(isSessionComplete(baseSession)).toBe(false)

    expect(
      isSessionComplete({
        ...baseSession,
        phase: 'role_discovery',
        current_question: null,
      }),
    ).toBe(false)

    expect(
      isSessionComplete({
        ...baseSession,
        status: 'completed',
        phase: 'recommendation_ready',
        current_question: null,
      }),
    ).toBe(true)

    const result: AssessmentResult = {
      ...baseSession,
      status: 'completed',
      phase: 'recommendation_ready',
      role_resolution_status: 'resolved',
      pillar_profile: [],
      ranked_roles: [],
      preferred_role_gap_topics: [],
    }

    expect(isSessionComplete(result)).toBe(true)
  })

  it('formats labels and percentages for presentation', () => {
    expect(getQuestionTypeLabel('likert_5')).toBe('Agreement scale')
    expect(getQuestionTypeLabel('ranked_choice')).toBe('Priority pick')
    expect(getAlignmentLabel('mismatch')).toBe('Stretch path')
    expect(formatConfidencePercent(0.784)).toBe('78%')
  })

})
