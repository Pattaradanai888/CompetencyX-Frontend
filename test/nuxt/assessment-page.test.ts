import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AssessmentPage from '../../app/pages/assessment/[sessionId].vue'
import type { AssessmentSession } from '../../shared/types/assessment'

const { navigateToMock, getSessionMock, submitAnswerMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
  getSessionMock: vi.fn(),
  submitAnswerMock: vi.fn(),
}))

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useRoute', () => () => ({
  params: { sessionId: 'session-1' },
  query: {},
}))

vi.mock('~/composables/useAssessmentSession', () => ({
  useAssessmentSession: () => ({
    getSession: getSessionMock,
    submitAnswer: submitAnswerMock,
    isSubmitting: ref(false),
    session: sessionState,
  }),
}))

const baseSession: AssessmentSession = {
  id: 'session-1',
  status: 'in_progress',
  phase: 'role_discovery',
  best_fit_confidence: 0.15,
  preferred_role: null,
  best_fit_role: null,
  profile: null,
  started_at: '2026-04-17T04:00:00Z',
  updated_at: '2026-04-17T04:00:00Z',
  completed_at: null,
  milestones: { answered_role_questions: 1, answered_skill_questions: 0 },
  role_alignment_status: 'unknown',
  role_resolution_status: 'in_progress',
  guidance_summary: 'Keep going.',
  current_question: {
    id: 101,
    code: 'role-primary-interest',
    stage: 'role',
    question_type: 'single_choice',
    prompt: 'Which work sounds most interesting?',
    help_text: '',
    role: null,
    topic: null,
    options: [{ id: 201, key: 'backend', label: 'Designing APIs and backend services' }],
  },
}

function makeSession(overrides: Partial<AssessmentSession> = {}): AssessmentSession {
  return {
    ...baseSession,
    ...overrides,
    milestones: overrides.milestones ?? { ...baseSession.milestones },
    current_question:
      overrides.current_question === null
        ? null
        : {
            ...baseSession.current_question!,
            ...overrides.current_question,
            options: overrides.current_question?.options ?? [...baseSession.current_question!.options],
          },
  }
}

const sessionState = ref<AssessmentSession>(makeSession())

describe('assessment page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionState.value = makeSession()
    getSessionMock.mockResolvedValue(makeSession())
    submitAnswerMock.mockResolvedValue({
      id: 'session-1',
      status: 'completed',
      phase: 'recommendation_ready',
      best_fit_confidence: 0.81,
      preferred_role: null,
      best_fit_role: { id: 1, slug: 'backend-engineer', name: 'Backend Engineer' },
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
  })

  it('submits the selected option and redirects when the assessment completes', async () => {
    const wrapper = await mountSuspended(AssessmentPage)

    await flushPromises()
    expect(wrapper.text()).not.toContain('Choose the response that best matches you and continue to the next prompt.')
    expect(wrapper.text()).toContain('Select the answer that fits best and move to the next prompt.')
    await wrapper.get('button.option-card').trigger('click')

    expect(submitAnswerMock).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        question_id: 101,
        option_id: 201,
      }),
    )
    expect(navigateToMock).toHaveBeenCalledWith('/results/session-1')
  })

  it('renders question help text and shows ranked-choice guidance once per question', async () => {
    sessionState.value = makeSession({
      current_question: {
        ...baseSession.current_question!,
        question_type: 'ranked_choice',
        help_text: 'Answer based on the topic you want to prioritize first.',
      },
    })
    getSessionMock.mockResolvedValue(makeSession({
      current_question: {
        ...baseSession.current_question!,
        question_type: 'ranked_choice',
        help_text: 'Answer based on the topic you want to prioritize first.',
      },
    }))

    const wrapper = await mountSuspended(AssessmentPage)

    await flushPromises()

    expect(wrapper.text()).toContain('Answer based on the topic you want to prioritize first.')
    expect(wrapper.text()).toContain('Pick the option that should carry the most weight in the next recommendation step.')
    expect(wrapper.text()).not.toContain('Choose the option that should carry the most weight for your next recommendation step.')
    expect(wrapper.findAll('button.option-card')).toHaveLength(1)
  })
})
