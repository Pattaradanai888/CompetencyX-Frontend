import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResultsPage from '../../app/pages/results/[sessionId].vue'

const { navigateToMock, getSessionMock, getResultsMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
  getSessionMock: vi.fn(),
  getResultsMock: vi.fn(),
}))

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useRoute', () => () => ({
  params: { sessionId: 'session-1' },
  query: {},
}))

vi.mock('~/composables/useAssessmentSession', () => ({
  useAssessmentSession: () => ({
    getSession: getSessionMock,
  }),
}))

vi.mock('~/composables/useAssessmentResults', () => ({
  useAssessmentResults: () => ({
    getResults: getResultsMock,
  }),
}))

describe('results page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionMock.mockResolvedValue({
      id: 'session-1',
      status: 'completed',
      phase: 'recommendation_ready',
      best_fit_confidence: 0.81,
      preferred_role: {
        id: 1,
        slug: 'backend-engineer',
        name: 'Backend Engineer',
      },
      best_fit_role: {
        id: 1,
        slug: 'backend-engineer',
        name: 'Backend Engineer',
      },
      profile: null,
      started_at: '2026-04-17T04:00:00Z',
      updated_at: '2026-04-17T04:02:00Z',
      completed_at: '2026-04-17T04:02:00Z',
      milestones: { answered_role_questions: 2, answered_skill_questions: 4 },
      role_alignment_status: 'aligned',
      role_resolution_status: 'resolved',
      guidance_summary: 'Done.',
      current_question: null,
    })
    getResultsMock.mockResolvedValue({
      id: 'session-1',
      status: 'completed',
      phase: 'recommendation_ready',
      best_fit_confidence: 0.81,
      preferred_role: {
        id: 1,
        slug: 'backend-engineer',
        name: 'Backend Engineer',
      },
      best_fit_role: {
        id: 1,
        slug: 'backend-engineer',
        name: 'Backend Engineer',
      },
      profile: null,
      started_at: '2026-04-17T04:00:00Z',
      updated_at: '2026-04-17T04:02:00Z',
      completed_at: '2026-04-17T04:02:00Z',
      milestones: { answered_role_questions: 2, answered_skill_questions: 4 },
      role_alignment_status: 'aligned',
      role_resolution_status: 'resolved',
      guidance_summary: 'Done.',
      pillar_profile: [
        {
          key: 'systems_design',
          label: 'Systems Design',
          raw_score: 7,
          normalized_score: 0.5,
          evidence_count: 3,
        },
      ],
      ranked_roles: [
        {
          slug: 'backend-engineer',
          name: 'Backend Engineer',
          fit_score: 0.81,
          fit_share: 0.62,
          top_supporting_pillars: [
            'Systems Design',
            'Reliability and Automation',
          ],
        },
      ],
      preferred_role_gap_topics: [],
      mastery_scores: [],
      preferred_path_recommendation: {
        id: 1,
        role_slug: 'backend-engineer',
        topic_id: 77,
        topic_slug: 'api-design',
        topic_title: 'API Design',
        reason: 'Strong next step.',
        created_at: '2026-04-17T04:02:00Z',
      },
      best_fit_path_recommendation: null,
    })
  })

  it('renders nullable recommendation states without crashing', async () => {
    const wrapper = await mountSuspended(ResultsPage)

    expect(wrapper.text()).toContain('API Design')
    expect(wrapper.text()).toContain('Recommendation in progress')
    expect(wrapper.text()).toContain('Systems Design')
    expect(wrapper.text()).toContain('Resolved')
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
