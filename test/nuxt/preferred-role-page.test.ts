import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PreferredRolePage from '../../app/pages/assessment/preferred-role.vue'

const { navigateToMock, createSessionMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
  createSessionMock: vi.fn(),
}))

mockNuxtImport('navigateTo', () => navigateToMock)

vi.mock('~/composables/useAssessmentSession', () => ({
  useAssessmentSession: () => ({
    createSession: createSessionMock,
    isSubmitting: ref(false),
    lastSessionId: ref(null),
  }),
}))

describe('preferred role question page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSessionMock.mockResolvedValue({ id: 'session-1' })
    localStorage.clear()
  })

  it('routes users with a preferred role to role selection', async () => {
    const wrapper = await mountSuspended(PreferredRolePage)

    await wrapper
      .findAll('button.preferred-role-option')
      .at(0)!
      .trigger('click')

    expect(createSessionMock).not.toHaveBeenCalled()
    expect(navigateToMock).toHaveBeenCalledWith('/assessment/start')
  })

  it('starts survey page 1 when the user wants discovery', async () => {
    localStorage.setItem('competencyx:preferred-role', 'backend-engineer')
    const wrapper = await mountSuspended(PreferredRolePage)

    await wrapper
      .findAll('button.preferred-role-option')
      .at(1)!
      .trigger('click')

    expect(localStorage.getItem('competencyx:preferred-role')).toBeNull()
    expect(createSessionMock).toHaveBeenCalledWith({ language: 'en' })
    expect(navigateToMock).toHaveBeenCalledWith('/assessment/session-1')
  })
})
