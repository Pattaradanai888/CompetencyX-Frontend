import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppHeader from '../../app/components/layout/AppHeader.vue'

const { signOutMock, meMock, route, token } = await vi.hoisted(async () => {
  const { ref } = await import('vue')
  return {
    signOutMock: vi.fn(),
    meMock: vi.fn(),
    route: { path: '/roadmaps/session-1', fullPath: '/roadmaps/session-1' },
    // Stands in for the credential cookie; the real current-account
    // composable reads and writes it through the token composable.
    token: ref<string | null>(null),
  }
})

mockNuxtImport('useRoute', () => () => route)

vi.mock('~/composables/useAccountApi', () => ({
  useAccountApi: () => ({
    signIn: vi.fn(),
    register: vi.fn(),
    signOut: signOutMock,
    me: meMock,
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

beforeEach(() => {
  vi.clearAllMocks()
  clearNuxtState('current-account')
  token.value = null
  route.path = '/roadmaps/session-1'
  route.fullPath = '/roadmaps/session-1'
  meMock.mockResolvedValue({ id: 'account-1', email: 'somsri@example.com' })
  signOutMock.mockResolvedValue(undefined)
})

describe('app header account area', () => {
  it('offers a sign-in link that brings the visitor back to the current page', async () => {
    route.fullPath = '/roadmaps/session-1?tab=roadmap'

    const wrapper = await mountSuspended(AppHeader)
    await flushPromises()

    const link = wrapper.get('[data-testid="header-sign-in"]')
    expect(link.text()).toBe('Sign in')
    const href = new URL(link.attributes('href')!, 'http://localhost')
    expect(href.pathname).toBe('/account/sign-in')
    expect(href.searchParams.get('next')).toBe(
      '/roadmaps/session-1?tab=roadmap',
    )
    expect(wrapper.find('[data-testid="header-account"]').exists()).toBe(false)
    expect(meMock).not.toHaveBeenCalled()
  })

  it('does not send an account page back to itself', async () => {
    route.path = '/account/register'
    route.fullPath = '/account/register?next=%2Froadmaps%2Fsession-1'

    const wrapper = await mountSuspended(AppHeader)

    expect(
      wrapper.get('[data-testid="header-sign-in"]').attributes('href'),
    ).toBe('/account/sign-in')
  })

  it('shows the email behind the credential and a sign-out button when signed in', async () => {
    token.value = 'held-token'

    const wrapper = await mountSuspended(AppHeader)
    await flushPromises()

    const accountArea = wrapper.get('[data-testid="header-account"]')
    expect(accountArea.text()).toContain('Signed in as')
    expect(accountArea.text()).toContain('somsri@example.com')
    expect(accountArea.get('button').text()).toBe('Sign out')
    expect(wrapper.find('[data-testid="header-sign-in"]').exists()).toBe(false)
  })

  it('signs out through the API and forgets the credential', async () => {
    token.value = 'held-token'

    const wrapper = await mountSuspended(AppHeader)
    await flushPromises()
    await wrapper.get('[data-testid="header-account"] button').trigger('click')
    await flushPromises()

    expect(signOutMock).toHaveBeenCalledTimes(1)
    expect(token.value).toBeNull()
    expect(wrapper.find('[data-testid="header-account"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="header-sign-in"]').text()).toBe('Sign in')
  })

  it('forgets the credential even when the API refuses the sign-out', async () => {
    token.value = 'held-token'
    signOutMock.mockRejectedValue({ statusCode: 500, data: {} })

    const wrapper = await mountSuspended(AppHeader)
    await flushPromises()
    await wrapper.get('[data-testid="header-account"] button').trigger('click')
    await flushPromises()

    expect(token.value).toBeNull()
    expect(wrapper.find('[data-testid="header-sign-in"]').exists()).toBe(true)
  })
})
