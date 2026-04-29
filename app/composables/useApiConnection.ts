export function useApiConnection() {
  const config = useRuntimeConfig()

  return {
    apiBase: config.public.apiBase,
  }
}
