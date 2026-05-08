import { describe, expect, it } from 'vitest'
import { buildSurvey2Evaluation } from '../../app/utils/survey2'
import type { AssessmentHistory, AssessmentResult } from '../../shared/types/assessment'

const baseResult: AssessmentResult = {
  id: 'session-2',
  status: 'completed',
  phase: 'completed',
  best_fit_confidence: 0.88,
  preferred_role: { id: 1, slug: 'backend-engineer', name: 'Backend Engineer' },
  best_fit_role: { id: 2, slug: 'system-architect', name: 'System Architect' },
  profile: null,
  started_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:20:00Z',
  completed_at: '2026-05-01T00:20:00Z',
  milestones: { answered_role_questions: 6, answered_skill_questions: 18 },
  role_alignment_status: 'aligned',
  role_resolution_status: 'resolved',
  guidance_summary: 'Summary',
  pillar_profile: [
    { key: 'planning_discipline', label: 'Planning', raw_score: 8, normalized_score: 0.8, evidence_count: 6 },
    { key: 'quality_focus', label: 'Quality', raw_score: 7, normalized_score: 0.7, evidence_count: 5 },
    { key: 'analysis', label: 'Analysis', raw_score: 8, normalized_score: 0.8, evidence_count: 5 },
    { key: 'architecture', label: 'Architecture', raw_score: 9, normalized_score: 0.9, evidence_count: 6 },
    { key: 'implementation', label: 'Implementation', raw_score: 6, normalized_score: 0.6, evidence_count: 4 },
    { key: 'testing', label: 'Testing', raw_score: 7, normalized_score: 0.7, evidence_count: 4 },
    { key: 'delivery', label: 'Delivery', raw_score: 5, normalized_score: 0.5, evidence_count: 4 },
    { key: 'operations', label: 'Operations', raw_score: 4, normalized_score: 0.4, evidence_count: 3 },
  ],
  ranked_roles: [],
  preferred_role_gap_topics: [],
  mastery_scores: [],
  preferred_path_recommendation: null,
  best_fit_path_recommendation: null,
}

const history: AssessmentHistory = {
  id: 'session-2',
  phase: 'completed',
  status: 'completed',
  recommendations: [],
  answers: [
    {
      id: 1,
      question_id: 101,
      question_code: 'q1',
      question_prompt: 'Prompt',
      question_stage: 'skill',
      topic_slug: 'requirements-analysis',
      selected_option_id: null,
      selected_option_key: null,
      selected_option_label: null,
      scale_value: 2,
      responded_at: '2026-05-01T00:00:00Z',
    },
    {
      id: 2,
      question_id: 102,
      question_code: 'q2',
      question_prompt: 'Prompt',
      question_stage: 'skill',
      topic_slug: 'system-design',
      selected_option_id: null,
      selected_option_key: null,
      selected_option_label: null,
      scale_value: 1,
      responded_at: '2026-05-01T00:00:00Z',
    },
    {
      id: 3,
      question_id: 103,
      question_code: 'q3',
      question_prompt: 'Prompt',
      question_stage: 'skill',
      topic_slug: 'maintenance-operations',
      selected_option_id: null,
      selected_option_key: null,
      selected_option_label: null,
      scale_value: -1,
      responded_at: '2026-05-01T00:00:00Z',
    },
  ],
}

describe('survey2 evaluation builder', () => {
  it('builds PSP + SDLC dimensions and summaries from results/history', () => {
    const evaluation = buildSurvey2Evaluation(baseResult, history)

    expect(evaluation.dimensions).toHaveLength(8)
    expect(evaluation.strengths.length).toBe(3)
    expect(evaluation.growthAreas.length).toBe(3)
    expect(evaluation.personalitySignals[0]).toContain('System Architect')

    const design = evaluation.dimensions.find((item) => item.key === 'sdlc-design')
    const maintenance = evaluation.dimensions.find((item) => item.key === 'sdlc-maintenance')

    expect(design?.value).toBeGreaterThan(maintenance?.value ?? 0)
  })

  it('falls back safely when no answer history exists', () => {
    const evaluation = buildSurvey2Evaluation(baseResult, null)
    expect(evaluation.dimensions.every((item) => item.value >= 0 && item.value <= 1)).toBe(true)
    expect(evaluation.personalitySignals.length).toBe(3)
  })
})
