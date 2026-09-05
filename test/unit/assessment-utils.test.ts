import { describe, expect, it } from 'vitest'
import {
  formatConfidencePercent,
  getAlignmentLabel,
  getPillarLabel,
  getQuestionTypeLabel,
  getRoleDisplayDescription,
  getRoleDisplayName,
  getSupportingPillars,
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
    }

    expect(isSessionComplete(result)).toBe(true)
  })

  it('formats labels and percentages for presentation', () => {
    expect(getQuestionTypeLabel('likert_5')).toBe('Agreement scale')
    expect(getQuestionTypeLabel('ranked_choice')).toBe('Priority pick')
    expect(getAlignmentLabel('mismatch')).toBe('Stretch path')
    expect(formatConfidencePercent(0.784)).toBe('78%')
  })

  describe('role and pillar display helpers', () => {
    const role = {
      name: 'Backend Engineer',
      name_th: 'วิศวกรฝั่งเซิร์ฟเวอร์',
      description: 'Builds services.',
      description_th: 'สร้างบริการฝั่งเซิร์ฟเวอร์',
    }
    const englishOnlyRole = {
      name: 'Backend Engineer',
      description: 'Builds services.',
    }

    it('reads the Thai role name in a Thai session and English otherwise', () => {
      expect(getRoleDisplayName(role, true)).toBe('วิศวกรฝั่งเซิร์ฟเวอร์')
      expect(getRoleDisplayName(role, false)).toBe('Backend Engineer')
      expect(getRoleDisplayName(englishOnlyRole, true)).toBe('Backend Engineer')
      expect(getRoleDisplayName({ ...role, name_th: '' }, true)).toBe(
        'Backend Engineer',
      )
      expect(getRoleDisplayName(null, true)).toBe('')
      expect(getRoleDisplayName(undefined, false)).toBe('')
    })

    it('reads the Thai role description with an English fallback', () => {
      expect(getRoleDisplayDescription(role, true)).toBe(
        'สร้างบริการฝั่งเซิร์ฟเวอร์',
      )
      expect(getRoleDisplayDescription(role, false)).toBe('Builds services.')
      expect(getRoleDisplayDescription(englishOnlyRole, true)).toBe(
        'Builds services.',
      )
      expect(getRoleDisplayDescription({ name: 'No copy' }, true)).toBe('')
      expect(getRoleDisplayDescription(null, true)).toBe('')
    })

    it('reads the Thai pillar label with an English fallback', () => {
      const pillar = { label: 'Systems Design', label_th: 'การออกแบบระบบ' }
      expect(getPillarLabel(pillar, true)).toBe('การออกแบบระบบ')
      expect(getPillarLabel(pillar, false)).toBe('Systems Design')
      expect(getPillarLabel({ label: 'Systems Design' }, true)).toBe(
        'Systems Design',
      )
      expect(
        getPillarLabel({ label: 'Systems Design', label_th: '' }, true),
      ).toBe('Systems Design')
    })

    it('reads the Thai supporting pillars only when the backend carries them', () => {
      const ranked = {
        top_supporting_pillars: ['Systems Design', 'Reliability'],
        top_supporting_pillars_th: ['การออกแบบระบบ', 'ความน่าเชื่อถือ'],
      }
      expect(getSupportingPillars(ranked, true)).toEqual([
        'การออกแบบระบบ',
        'ความน่าเชื่อถือ',
      ])
      expect(getSupportingPillars(ranked, false)).toEqual([
        'Systems Design',
        'Reliability',
      ])
      expect(
        getSupportingPillars(
          { top_supporting_pillars: ['Systems Design'] },
          true,
        ),
      ).toEqual(['Systems Design'])
      expect(
        getSupportingPillars(
          {
            top_supporting_pillars: ['Systems Design'],
            top_supporting_pillars_th: [],
          },
          true,
        ),
      ).toEqual(['Systems Design'])
    })
  })
})
