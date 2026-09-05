import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SignInPage from '../../app/pages/account/sign-in.vue'
import RegisterPage from '../../app/pages/account/register.vue'

const { navigateToMock, signInMock, registerMock, meMock, route, token } =
  await vi.hoisted(async () => {
    const { ref } = await import('vue')
    return {
      navigateToMock: vi.fn(),
      signInMock: vi.fn(),
      registerMock: vi.fn(),
      meMock: vi.fn(),
      // Mutable so each test can set the `next` query before mounting.
      route: { path: '/account/sign-in', query: {} as Record<string, string> },
      // Stands in for the credential cookie; the real current-account
      // composable reads and writes it through the token composable.
      token: ref<string | null>(null),
    }
  })

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useRoute', () => () => route)

vi.mock('~/composables/useAccountApi', () => ({
  useAccountApi: () => ({
    signIn: signInMock,
    register: registerMock,
    signOut: vi.fn(),
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

const credential = {
  token: 'fresh-token',
  user: { id: 'account-1', email: 'somsri@example.com' },
}

type Page = typeof SignInPage | typeof RegisterPage

async function submitCredentials(page: Page) {
  const wrapper = await mountSuspended(page)
  await wrapper.get('input[name="email"]').setValue('somsri@example.com')
  await wrapper.get('input[name="password"]').setValue('correct horse')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  clearNuxtState('current-account')
  token.value = null
  route.query = {}
  signInMock.mockResolvedValue(credential)
  registerMock.mockResolvedValue(credential)
  meMock.mockResolvedValue(credential.user)
})

describe('sign-in page', () => {
  beforeEach(() => {
    route.path = '/account/sign-in'
  })

  it('signs in with the submitted credentials, remembers the credential and follows a same-site next path', async () => {
    route.query = { next: '/roadmaps/session-1' }

    await submitCredentials(SignInPage)

    expect(signInMock).toHaveBeenCalledWith({
      email: 'somsri@example.com',
      password: 'correct horse',
    })
    expect(token.value).toBe('fresh-token')
    expect(navigateToMock).toHaveBeenCalledWith('/roadmaps/session-1')
  })

  it('goes home when next is absent', async () => {
    await submitCredentials(SignInPage)

    expect(navigateToMock).toHaveBeenCalledWith('/')
  })

  it.each(['https://evil.example', '//evil', '/\\evil'])(
    'goes home instead of following an off-site next of %s',
    async (next) => {
      route.query = { next }

      await submitCredentials(SignInPage)

      expect(navigateToMock).toHaveBeenCalledWith('/')
    },
  )

  it('renders an API error in the form and keeps the visitor signed out', async () => {
    signInMock.mockRejectedValue({
      statusCode: 400,
      data: { detail: 'Wrong email or password.' },
    })

    const wrapper = await submitCredentials(SignInPage)

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Wrong email or password.',
    )
    expect(token.value).toBeNull()
    expect(navigateToMock).not.toHaveBeenCalled()
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('shows who is already signed in instead of the form', async () => {
    token.value = 'held-token'
    // The identity is what a previous load put in shared state.
    const wrapper = await mountSuspended(SignInPage)
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('You are signed in as')
    expect(wrapper.text()).toContain('Back to home')
    expect(signInMock).not.toHaveBeenCalled()
  })
})

describe('register page', () => {
  beforeEach(() => {
    route.path = '/account/register'
  })

  it('registers with the submitted credentials, remembers the credential and follows a same-site next path', async () => {
    route.query = { next: '/roadmaps/session-1' }

    await submitCredentials(RegisterPage)

    expect(registerMock).toHaveBeenCalledWith({
      email: 'somsri@example.com',
      password: 'correct horse',
    })
    expect(token.value).toBe('fresh-token')
    expect(navigateToMock).toHaveBeenCalledWith('/roadmaps/session-1')
  })

  it('goes home when next is absent', async () => {
    await submitCredentials(RegisterPage)

    expect(navigateToMock).toHaveBeenCalledWith('/')
  })

  it.each(['https://evil.example', '//evil', '/\\evil'])(
    'goes home instead of following an off-site next of %s',
    async (next) => {
      route.query = { next }

      await submitCredentials(RegisterPage)

      expect(navigateToMock).toHaveBeenCalledWith('/')
    },
  )

  it('renders an API error in the form and keeps the visitor signed out', async () => {
    registerMock.mockRejectedValue({
      statusCode: 400,
      data: { email: ['An account with this email already exists.'] },
    })

    const wrapper = await submitCredentials(RegisterPage)

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'An account with this email already exists.',
    )
    expect(token.value).toBeNull()
    expect(navigateToMock).not.toHaveBeenCalled()
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('shows who is already signed in instead of the form', async () => {
    token.value = 'held-token'
    const wrapper = await mountSuspended(RegisterPage)
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('You are signed in as')
    expect(wrapper.text()).toContain('Back to home')
    expect(registerMock).not.toHaveBeenCalled()
  })
})
