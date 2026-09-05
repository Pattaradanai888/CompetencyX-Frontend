import { useApiClient } from '~/composables/useApiClient'
import type {
  Account,
  AccountCredential,
  AccountCredentialsPayload,
} from '~~/shared/types/assessment'

export function useAccountApi() {
  const { apiFetch } = useApiClient()

  async function register(payload: AccountCredentialsPayload) {
    return await apiFetch<AccountCredential>('/api/v1/accounts/register/', {
      method: 'POST',
      body: payload,
    })
  }

  async function signIn(payload: AccountCredentialsPayload) {
    return await apiFetch<AccountCredential>('/api/v1/accounts/sign-in/', {
      method: 'POST',
      body: payload,
    })
  }

  /** Revokes the credential everywhere: a second device is signed out too. */
  async function signOut() {
    // 204: nothing comes back but the status.
    await apiFetch<unknown>('/api/v1/accounts/sign-out/', { method: 'POST' })
  }

  async function me() {
    return await apiFetch<Account>('/api/v1/accounts/me/')
  }

  return { register, signIn, signOut, me }
}
