import { describe, expect, it } from 'vitest'
import {
  formatConfidencePercent,
  formatMasteryPercent,
  getAlignmentLabel,
  getQuestionTypeLabel,
  getRecommendationHeadline,
  hasTopicRecommendation,
  isSessionComplete,
  sortMasteryDescending,
} from '../../app/utils/assessment'
import type { AssessmentResult, AssessmentSession, Recommendation, TopicMastery } from '../../shared/types/assessment'

const baseSession: AssessmentSession = {
  id: 'session-1',
  status: 'in_progress',
  phase: 'role_discovery',
  best_fit_confidence: 0.42,
  preferred_role: null,
  best_fit_role: null,
  profile: null,
  started_at: '2026-04-17T04:00:00Z',
  updated_at: '2026-04-17T04:00:00Z',
  completed_at: null,
  milestones: {
    answered_role_questions: 1,
    answered_skill_questions: 0,
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
        phase: 'role_ambiguity',
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
      mastery_scores: [],
      preferred_path_recommendation: null,
      best_fit_path_recommendation: null,
    }

    expect(isSessionComplete(result)).toBe(true)
  })

  it('formats labels and percentages for presentation', () => {
    expect(getQuestionTypeLabel('likert_5')).toBe('Agreement scale')
    expect(getQuestionTypeLabel('ranked_choice')).toBe('Priority pick')
    expect(getAlignmentLabel('mismatch')).toBe('Stretch path')
    expect(formatConfidencePercent(0.784)).toBe('78%')
    expect(formatMasteryPercent(0.321)).toBe('32%')
  })

  it('handles nullable recommendation topics and sorts mastery descending', () => {
    const emptyRecommendation: Recommendation | null = {
      id: 2,
      role_slug: 'backend-engineer',
      topic_id: null,
      topic_slug: null,
      topic_title: null,
      reason: 'No recommendation.',
      created_at: '2026-04-17T04:00:00Z',
    }

    expect(getRecommendationHeadline(emptyRecommendation)).toBe('No next topic recommended yet')
    expect(hasTopicRecommendation(emptyRecommendation)).toBe(false)

    const mastery: TopicMastery[] = [
      {
        topic_id: 1,
        topic_slug: 'api-design',
        topic_title: 'API Design',
        mastery_score: 0.41,
        confidence_score: 0.75,
        updated_at: '2026-04-17T04:00:00Z',
      },
      {
        topic_id: 2,
        topic_slug: 'sql',
        topic_title: 'SQL',
        mastery_score: 0.87,
        confidence_score: 0.65,
        updated_at: '2026-04-17T04:00:00Z',
      },
    ]

    expect(sortMasteryDescending(mastery).map((item) => item.topic_slug)).toEqual(['sql', 'api-design'])
  })
})
