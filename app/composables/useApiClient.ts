import { normalizeApiError } from '~/utils/api'

export function useApiClient() {
  const config = useRuntimeConfig()

  async function apiFetch<T>(path: string, options?: Parameters<typeof $fetch<T>>[1]): Promise<T> {
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
