import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StartPage from '../../app/pages/assessment/start.vue'

const {
  navigateToMock,
  listRolesMock,
  listRoleTopicsMock,
  createSessionMock,
  getSessionMock,
} = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
  listRolesMock: vi.fn(),
  listRoleTopicsMock: vi.fn(),
  createSessionMock: vi.fn(),
  getSessionMock: vi.fn(),
}))

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useRoute', () => () => ({
  query: {},
  params: {},
}))

vi.mock('~/composables/useCatalogApi', () => ({
  useCatalogApi: () => ({
    listRoles: listRolesMock,
    listRoleTopics: listRoleTopicsMock,
  }),
}))

vi.mock('~/composables/useAssessmentSession', () => ({
  useAssessmentSession: () => ({
    createSession: createSessionMock,
    getSession: getSessionMock,
    isSubmitting: ref(false),
    lastSessionId: ref(null),
  }),
}))

describe('assessment start page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listRolesMock.mockResolvedValue([
      {
        id: 1,
        slug: 'backend-engineer',
        name: 'Backend Engineer',
        description: 'Build services.',
      },
      {
        id: 2,
        slug: 'data-engineer',
        name: 'Data Engineer',
        description: 'Build pipelines.',
      },
    ])
    listRoleTopicsMock.mockResolvedValue([
      {
        id: 11,
        slug: 'api-design',
        title: 'API Design',
        parent_id: null,
        prerequisites: [],
      },
    ])
    createSessionMock.mockResolvedValue({ id: 'session-1' })
    getSessionMock.mockResolvedValue({
      id: 'session-1',
      current_question: { id: 101, stage: 'skill' },
    })
    localStorage.clear()
  })

  it('creates a session with the selected role and navigates to the assessment route', async () => {
    const wrapper = await mountSuspended(StartPage)

    await flushPromises()
    await wrapper.get('button[role="radio"][aria-checked="false"]').trigger('click')
    await wrapper.get('button.cx-button-primary').trigger('click')

    expect(createSessionMock).toHaveBeenCalledWith({
      preferred_role_slug: 'backend-engineer',
      language: 'en',
    })
    expect(navigateToMock).toHaveBeenCalledWith('/roadmaps/session-1')
  })
})
