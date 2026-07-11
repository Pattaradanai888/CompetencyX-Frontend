import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RoadmapsPage from '../../app/pages/roadmaps/[sessionId].vue'

const {
  getSessionMock,
  getResultsMock,
  getHistoryMock,
  getRoadmapsCatalogMock,
  getRoadmapsStateMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getResultsMock: vi.fn(),
  getHistoryMock: vi.fn(),
  getRoadmapsCatalogMock: vi.fn(),
  getRoadmapsStateMock: vi.fn(),
}))

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
    getHistory: getHistoryMock,
  }),
}))

vi.mock('~/composables/useRoadmapsApiClient', () => ({
  useRoadmapsApiClient: () => ({
    getRoadmapsCatalog: getRoadmapsCatalogMock,
    getRoadmapsNextQuestion: vi.fn().mockResolvedValue({
      next_question: null,
    }),
    getRoadmapsState: getRoadmapsStateMock,
    saveRoadmapsState: vi.fn(),
  }),
}))

describe('roadmaps page', () => {
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
      milestones: {
        answered_role_questions: 2,
        answered_core_role_questions: 2,
        answered_tie_break_questions: 0,
      },
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
      milestones: {
        answered_role_questions: 2,
        answered_core_role_questions: 2,
        answered_tie_break_questions: 0,
      },
      role_alignment_status: 'aligned',
      role_resolution_status: 'resolved',
      guidance_summary: 'Done.',
      pillar_profile: [
        {
          key: 'systems_design',
          label: 'Systems Design',
          raw_score: 8,
          normalized_score: 0.84,
          evidence_count: 3,
        },
        {
          key: 'quality_focus',
          label: 'Quality Focus',
          raw_score: 7,
          normalized_score: 0.72,
          evidence_count: 2,
        },
      ],
      ranked_roles: [],
      preferred_role_gap_topics: [
        {
          id: 1,
          slug: 'api-design',
          title: 'API Design',
          description: 'Design contracts, validation, and versioning.',
          difficulty: 3,
          display_order: 1,
          parent_id: null,
          prerequisites: [],
        },
        {
          id: 2,
          slug: 'auth-boundaries',
          title: 'Auth Boundaries',
          description: 'Strengthen access control and permission design.',
          difficulty: 4,
          display_order: 2,
          parent_id: 1,
          prerequisites: [
            {
              topic_id: 1,
              required_mastery_threshold: 0.6,
              dependency_weight: 1,
            },
          ],
        },
      ],
      preferred_path_recommendation: null,
      best_fit_path_recommendation: null,
    })

    getHistoryMock.mockResolvedValue({
      id: 'session-1',
      phase: 'recommendation_ready',
      status: 'completed',
      answers: [],
      recommendations: [],
    })

    getRoadmapsCatalogMock.mockResolvedValue({
      version: '1',
      scale: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '5', value: 5 },
      ],
      dimensions: [
        {
          key: 'psp-planning',
          label: 'PSP Planning',
          track: 'psp',
          low_score_action: 'Practice planning discipline.',
        },
        {
          key: 'sdlc-design',
          label: 'System Design & Architecture',
          track: 'sdlc',
          low_score_action: 'Practice architecture tradeoffs.',
        },
      ],
      questions: [],
      role_guidance: [
        'Lean into systems thinking.',
        'Keep strengthening delivery reliability.',
      ],
    })

    getRoadmapsStateMock.mockResolvedValue({
      completed: true,
      answers: {},
      completed_at: '2026-04-17T04:05:00Z',
    })
  })

  it('renders the segmented completed roadmap dashboard', async () => {
    const wrapper = await mountSuspended(RoadmapsPage)

    expect(wrapper.text()).toContain('Assessment complete')
    expect(wrapper.text()).toContain('Personality result')
    expect(wrapper.text()).toContain('Knowledge + personality fit')
    expect(wrapper.text()).toContain('Recommended learning sequence')
    expect(wrapper.text()).toContain('Additional insights and analytics')
    expect(wrapper.text()).toContain('Strength distribution')
    expect(wrapper.text()).toContain('API Design')
    expect(wrapper.text()).toContain('Auth Boundaries')
  })
})
