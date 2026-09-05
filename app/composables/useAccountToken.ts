import { ACCOUNT_TOKEN_COOKIE } from '~/utils/constants'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * The account credential the browser holds across requests. Register and
 * sign-in return it; presenting it is what lets the product record a Held
 * Topic against the person instead of a browser (ADR-0003), and what makes
 * an owned Assessment Session readable.
 *
 * Call during setup: the cookie is read through `useCookie`, which needs the
 * Nuxt instance.
 */
export function useAccountToken() {
  const tokenCookie = useCookie<string | null>(ACCOUNT_TOKEN_COOKIE, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  const token = computed<string | null>(() => tokenCookie.value || null)

  const getToken = (): string | null => tokenCookie.value || null

  const setToken = (value: string): void => {
    tokenCookie.value = value
  }

  const clearToken = (): void => {
    tokenCookie.value = null
  }

  return { token, getToken, setToken, clearToken }
}
