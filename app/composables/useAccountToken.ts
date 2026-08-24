import { ACCOUNT_TOKEN_KEY } from '~/utils/constants'

/**
 * The account credential the browser holds across requests. Register and
 * sign-in return it; presenting it is what lets the product record a Held
 * Topic against the person instead of a browser (ADR-0003).
 */
export function useAccountToken() {
  const getToken = (): string | null => {
    if (!import.meta.client) {
      return null
    }
    return localStorage.getItem(ACCOUNT_TOKEN_KEY)
  }

  const clearToken = (): void => {
    if (!import.meta.client) {
      return
    }
    localStorage.removeItem(ACCOUNT_TOKEN_KEY)
  }

  return { getToken, clearToken }
}
