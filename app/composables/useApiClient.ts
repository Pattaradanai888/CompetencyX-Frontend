import { useAccountToken } from '~/composables/useAccountToken'
import { normalizeApiError } from '~/utils/api'

export function useApiClient() {
  const config = useRuntimeConfig()
  const { getToken } = useAccountToken()

  /**
   * Contract: talks to the external API (runtimeConfig.public.apiBase) via
   * $fetch. The only credential it forwards is the account token, read from
   * its cookie on both the server and the client, so a page rendered on the
   * server sees the same owned sessions the browser will. Nothing else from
   * the incoming request (other cookies, headers) is forwarded.
   */
  async function apiFetch<T>(
    path: string,
    options?: Parameters<typeof $fetch<T>>[1],
  ): Promise<T> {
    const token = getToken()
    const headers: Record<string, string> = {
      ...((options?.headers as Record<string, string> | undefined) ?? {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
    }

    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBase,
        ...options,
        headers,
      })
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  return {
    apiFetch,
  }
}
