import { useAccountApi } from '~/composables/useAccountApi'
import { useAccountToken } from '~/composables/useAccountToken'
import type {
  Account,
  AccountCredential,
  ApiError,
} from '~~/shared/types/assessment'

/**
 * Who is signed in. The credential cookie says *whether* someone is signed in
 * on both the server and the client; the identity behind it is fetched once
 * and shared through Nuxt state, so the header and the pages agree.
 */
export function useCurrentAccount() {
  const account = useState<Account | null>('current-account', () => null)
  const { token, setToken, clearToken } = useAccountToken()
  const { me, signOut: revokeCredential } = useAccountApi()

  const isSignedIn = computed(() => token.value !== null)

  /** Drop the credential and the identity without calling the API. */
  function forget() {
    clearToken()
    account.value = null
  }

  /** Keep the credential register or sign-in returned, and who it is for. */
  function remember(credential: AccountCredential) {
    setToken(credential.token)
    account.value = credential.user
  }

  /**
   * Resolve the identity behind the credential. A credential the API no
   * longer accepts is dropped, so a stale cookie never shows a stale name.
   */
  async function load() {
    if (!token.value) {
      account.value = null
      return
    }
    if (account.value) {
      return
    }
    try {
      account.value = await me()
    } catch (error) {
      const apiError = error as ApiError
      if (apiError?.statusCode === 401 || apiError?.statusCode === 403) {
        forget()
      }
    }
  }

  async function signOut() {
    try {
      await revokeCredential()
    } catch {
      // The credential is dropped locally either way.
    } finally {
      forget()
    }
  }

  return { account, isSignedIn, load, remember, forget, signOut }
}
