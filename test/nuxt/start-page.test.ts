import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useState } from '#imports'
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
    // `useAsyncData('catalog-roles')` is cached across mounts in one file.
    clearNuxtData()
    useState<'en' | 'th'>('locale').value = 'en'
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
        name_th: 'วิศวกรข้อมูล',
        description: 'Build pipelines.',
        description_th: 'สร้างท่อส่งข้อมูล',
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

  it('creates a session with the selected role and navigates to the roadmap route', async () => {
    const wrapper = await mountSuspended(StartPage)

    await flushPromises()
    await wrapper.get('button.role-card').trigger('click')
    await wrapper.get('button.cx-button-primary').trigger('click')

    expect(createSessionMock).toHaveBeenCalledWith({
      preferred_role_slug: 'backend-engineer',
      language: 'en',
    })
    expect(navigateToMock).toHaveBeenCalledWith('/roadmaps/session-1')
  })

  describe('in a Thai session', () => {
    beforeEach(() => {
      useState<'en' | 'th'>('locale').value = 'th'
    })

    it('reads the role name, description, responsibilities and tags in Thai', async () => {
      const wrapper = await mountSuspended(StartPage)
      await flushPromises()

      const cards = wrapper.findAll('button.role-card')
      expect(cards[1]!.text()).toContain('วิศวกรข้อมูล')
      expect(cards[1]!.text()).toContain('สร้างท่อส่งข้อมูล')
      expect(cards[1]!.text()).not.toContain('Data Engineer')
      // A role with no Thai name falls back to English per field.
      expect(cards[0]!.text()).toContain('Backend Engineer')

      await cards[1]!.trigger('click')

      const detail = wrapper.get('aside.role-details-panel')
      expect(detail.get('h2').text()).toBe('วิศวกรข้อมูล')
      expect(detail.text()).toContain('สร้างท่อส่งข้อมูล')
      expect(detail.text()).toContain(
        'ออกแบบและสร้าง ETL/ELT pipeline และ data stream ที่ขยายได้',
      )
      expect(detail.text()).not.toContain('scalable ETL/ELT pipelines')
      expect(detail.text()).toContain('การวิเคราะห์ข้อมูล')
      expect(detail.text()).toContain('เชิงวิเคราะห์')
      expect(detail.text()).toContain('แบบผสม')
      expect(detail.text()).not.toContain('Analytical')
      expect(detail.text()).not.toContain('Hybrid')
    })

    it('finds a role by its English metadata and by the Thai text on screen', async () => {
      const wrapper = await mountSuspended(StartPage)
      await flushPromises()
      const search = wrapper.get('#role-search')

      await search.setValue('Data Analysis')
      expect(wrapper.findAll('button.role-card')).toHaveLength(1)
      expect(wrapper.get('button.role-card').text()).toContain('วิศวกรข้อมูล')

      await search.setValue('วิศวกรข้อมูล')
      expect(wrapper.findAll('button.role-card')).toHaveLength(1)

      await search.setValue('การวิเคราะห์ข้อมูล')
      expect(wrapper.findAll('button.role-card')).toHaveLength(1)

      await search.setValue('Backend Engineer')
      expect(wrapper.findAll('button.role-card')).toHaveLength(1)
      expect(wrapper.get('button.role-card').text()).toContain(
        'Backend Engineer',
      )
    })
  })
})
