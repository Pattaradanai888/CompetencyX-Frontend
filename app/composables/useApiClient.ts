import { normalizeApiError } from '~/utils/api'

export function useApiClient() {
  const config = useRuntimeConfig()

  /**
   * Contract: talks to the external API (runtimeConfig.public.apiBase) via
   * $fetch. During SSR it does NOT forward the incoming request's cookies or
   * headers to the API. If cookie- or header-based auth is ever added, proxy
   * through a Nitro server route or forward explicitly with
   * useRequestHeaders(['cookie']) / useRequestFetch() — do not assume ambient
   * auth here.
   */
  async function apiFetch<T>(
    path: string,
    options?: Parameters<typeof $fetch<T>>[1],
  ): Promise<T> {
    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBase,
        ...options,
      })
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  return {
    apiFetch,
  }
}
