import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useHeldTopicMarking } from '../../app/composables/useHeldTopicMarking'
import type { SkillAssessmentSessionState } from '../../shared/types/assessment'

const { markHeldTopicMock, toastAddMock, token } = await vi.hoisted(
  async () => {
    const { ref } = await import('vue')
    return {
      markHeldTopicMock: vi.fn(),
      toastAddMock: vi.fn(),
      // Stands in for the credential cookie; the real current-account
      // composable reads and writes it through the token composable.
      token: ref<string | null>(null),
    }
  },
)

mockNuxtImport('useToast', () => () => ({ add: toastAddMock }))

vi.mock('~/composables/useSkillAssessmentApiClient', () => ({
  useSkillAssessmentApiClient: () => ({
    markHeldTopic: markHeldTopicMock,
    unmarkHeldTopic: vi.fn(),
  }),
}))

vi.mock('~/composables/useAccountApi', () => ({
  useAccountApi: () => ({
    signIn: vi.fn(),
    register: vi.fn(),
    signOut: vi.fn(),
    me: vi.fn(),
  }),
}))

vi.mock('~/composables/useAccountToken', () => ({
  useAccountToken: () => ({
    token,
    getToken: () => token.value,
    setToken: (value: string) => {
      token.value = value
    },
    clearToken: () => {
      token.value = null
    },
  }),
}))

/**
 * The smallest host for the composable: the roadmap page renders the mark
 * control while marking is possible and the account notice otherwise, so
 * this host does the same with the composable's own `canMarkHeld`.
 */
const MarkingHost = defineComponent({
  setup() {
    const liveSkillState = ref({
      topic_states: [],
    } as unknown as SkillAssessmentSessionState)
    const { canMarkHeld, markTopicHeld } = useHeldTopicMarking(
      () => 'session-1',
      liveSkillState,
    )
    return () =>
      canMarkHeld.value
        ? h(
            'button',
            {
              type: 'button',
              'data-testid': 'mark-held',
              onClick: () => markTopicHeld('caching'),
            },
            'I already know this',
          )
        : h(
            'p',
            { 'data-testid': 'mark-requires-account' },
            'Marking a topic as already held requires an account.',
          )
  },
})

beforeEach(() => {
  vi.clearAllMocks()
  clearNuxtState('current-account')
  token.value = 'held-token'
})

describe('held-topic marking with a credential the API rejects', () => {
  it('drops the credential on a 401 so the notice takes the control’s place', async () => {
    markHeldTopicMock.mockRejectedValue({ statusCode: 401, data: {} })

    const wrapper = await mountSuspended(MarkingHost)
    expect(wrapper.find('[data-testid="mark-requires-account"]').exists()).toBe(
      false,
    )

    await wrapper.get('[data-testid="mark-held"]').trigger('click')
    await flushPromises()

    expect(markHeldTopicMock).toHaveBeenCalledWith('session-1', 'caching')
    expect(token.value).toBeNull()
    expect(wrapper.find('[data-testid="mark-held"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="mark-requires-account"]').text()).toBe(
      'Marking a topic as already held requires an account.',
    )
    expect(toastAddMock).not.toHaveBeenCalled()
  })

  it('keeps the credential and reports any other failure as a toast', async () => {
    markHeldTopicMock.mockRejectedValue({
      statusCode: 500,
      data: { detail: 'Server unavailable.' },
    })

    const wrapper = await mountSuspended(MarkingHost)
    await wrapper.get('[data-testid="mark-held"]').trigger('click')
    await flushPromises()

    expect(token.value).toBe('held-token')
    expect(wrapper.find('[data-testid="mark-held"]').exists()).toBe(true)
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'error',
        description: 'Server unavailable.',
      }),
    )
  })
})
