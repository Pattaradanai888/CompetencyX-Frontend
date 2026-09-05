import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResultsPage from '../../app/pages/results/[sessionId].vue'

const { navigateToMock, getSessionMock, getResultsMock, createSessionMock } =
  vi.hoisted(() => ({
    navigateToMock: vi.fn(),
    getSessionMock: vi.fn(),
    getResultsMock: vi.fn(),
    createSessionMock: vi.fn(),
  }))

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useRoute', () => () => ({
  params: { sessionId: 'session-1' },
  query: {},
}))

vi.mock('~/composables/useAssessmentSession', () => ({
  useAssessmentSession: () => ({
    createSession: createSessionMock,
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
    // The page's useAsyncData caches by key across mounts in one file.
    clearNuxtData()
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
    createSessionMock.mockResolvedValue({ id: 'session-2' })
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
          raw_score: 7,
          normalized_score: 0.5,
          evidence_count: 3,
        },
      ],
      ranked_roles: [
        {
          slug: 'backend-engineer',
          name: 'Backend Engineer',
          name_th: 'วิศวกรฝั่งเซิร์ฟเวอร์',
          fit_score: 0.81,
          fit_share: 0.62,
          top_supporting_pillars: [
            'Systems Design',
            'Reliability and Automation',
          ],
          top_supporting_pillars_th: [
            'การออกแบบระบบ',
            'ความน่าเชื่อถือและอัตโนมัติ',
          ],
        },
        {
          slug: 'data-engineer',
          name: 'Data Engineer',
          name_th: 'วิศวกรข้อมูล',
          fit_score: 0.74,
          fit_share: 0.24,
          top_supporting_pillars: ['Systems Design'],
          top_supporting_pillars_th: ['การออกแบบระบบ'],
        },
        {
          slug: 'devops-engineer',
          name: 'DevOps Engineer',
          fit_score: 0.68,
          fit_share: 0.14,
          top_supporting_pillars: ['Reliability and Automation'],
        },
      ],
    })
  })

  it('renders the simplified role discovery recommendation', async () => {
    const wrapper = await mountSuspended(ResultsPage)

    expect(wrapper.text()).toContain('Role discovery complete')
    expect(wrapper.text()).toContain(
      'Backend Engineer looks like your strongest role direction.',
    )
    expect(wrapper.text()).toContain('Data Engineer')
    expect(wrapper.text()).toContain('DevOps Engineer')
    expect(wrapper.text()).toContain('Systems Design')
    expect(wrapper.text()).toContain('Default selection')
    expect(wrapper.text()).toContain('Continue to skill assessment')
    expect(wrapper.text()).toContain('Use this role instead')
    expect(wrapper.text()).not.toContain('62%')
    expect(wrapper.text()).not.toContain('24%')
    expect(wrapper.text()).not.toContain('14%')
    expect(wrapper.text()).not.toContain('How to read these numbers')
    expect(wrapper.text()).not.toContain('Resolved')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('allows selecting an alternative role and starts skill assessment only when continuing', async () => {
    getSessionMock
      .mockResolvedValueOnce({
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
      .mockResolvedValueOnce({
        id: 'session-2',
        status: 'in_progress',
        phase: 'role_discovery',
        best_fit_confidence: 0.81,
        preferred_role: {
          id: 2,
          slug: 'data-engineer',
          name: 'Data Engineer',
        },
        best_fit_role: null,
        profile: null,
        started_at: '2026-04-17T04:03:00Z',
        updated_at: '2026-04-17T04:03:00Z',
        completed_at: null,
        milestones: {
          answered_role_questions: 0,
          answered_core_role_questions: 0,
          answered_tie_break_questions: 0,
        },
        role_alignment_status: 'aligned',
        role_resolution_status: 'resolved',
        guidance_summary: 'Done.',
        current_question: {
          id: 201,
          code: 'skill-1',
          stage: 'skill',
          question_type: 'single_choice',
          prompt: 'Skill question',
          help_text: '',
          role: null,
          topic: null,
          options: [],
          response_scale: [],
        },
      })

    const wrapper = await mountSuspended(ResultsPage)

    const switchButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Use this role instead'))

    expect(switchButton).toBeDefined()
    await switchButton!.trigger('click')
    await flushPromises()

    // verify that createSession is not called yet on selection
    expect(createSessionMock).not.toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()

    // Selected role displays at the bottom should have changed to Data Engineer
    expect(wrapper.text()).toContain('Continue with Data Engineer')

    // Find and click the Continue button at the bottom
    const continueBtn = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Continue to skill assessment'))
    expect(continueBtn).toBeDefined()

    await continueBtn!.trigger('click')
    await flushPromises()

    expect(createSessionMock).toHaveBeenCalledWith({
      preferred_role_slug: 'data-engineer',
    })
    await vi.waitFor(() => {
      expect(navigateToMock).toHaveBeenCalledWith('/roadmaps/session-2')
    })
  })

  it('reads Thai role names, descriptions and pillars in a Thai session', async () => {
    const thaiRole = {
      id: 1,
      slug: 'backend-engineer',
      name: 'Backend Engineer',
      name_th: 'วิศวกรฝั่งเซิร์ฟเวอร์',
      description: 'Builds the services behind the product.',
      description_th: 'สร้างบริการเบื้องหลังผลิตภัณฑ์',
    }
    const englishSession = await getSessionMock()
    getSessionMock.mockResolvedValue({
      ...englishSession,
      language: 'th',
      preferred_role: thaiRole,
      best_fit_role: thaiRole,
    })
    const englishResults = await getResultsMock()
    getResultsMock.mockResolvedValue({
      ...englishResults,
      language: 'th',
      preferred_role: thaiRole,
      best_fit_role: thaiRole,
    })
    getSessionMock.mockClear()
    getResultsMock.mockClear()

    const wrapper = await mountSuspended(ResultsPage)
    const text = wrapper.text()

    expect(text).toContain('วิศวกรฝั่งเซิร์ฟเวอร์')
    expect(text).toContain('สร้างบริการเบื้องหลังผลิตภัณฑ์')
    expect(text).toContain('วิศวกรข้อมูล')
    // Data Engineer carries Thai pillars; DevOps Engineer carries none and
    // keeps its English name and pillar, never an empty string.
    expect(text).toContain('การออกแบบระบบ')
    expect(text).toContain('DevOps Engineer')
    expect(text).toContain('Reliability and Automation')
    expect(text).not.toContain('Backend Engineer')
    expect(text).not.toContain('Data Engineer')
    expect(text).not.toContain('Builds the services behind the product.')
    expect(text).not.toContain('Systems Design')
  })
})
