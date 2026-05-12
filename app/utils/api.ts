import type { ApiError } from '~/shared/types/assessment'

export function normalizeApiError(error: unknown): ApiError {
  const source = error as {
    response?: { status?: number }
    statusCode?: number
    status?: number
    data?: Record<string, unknown>
  }

  return {
    statusCode:
      source?.response?.status ?? source?.statusCode ?? source?.status ?? 500,
    data: source?.data ?? { detail: 'Unexpected API error.' },
  }
}

export function getErrorMessage(
  error: ApiError | null | undefined,
): string | null {
  if (!error) {
    return null
  }

  if (typeof error.data.detail === 'string') {
    return error.data.detail
  }

  const firstField = Object.values(error.data)[0]

  if (Array.isArray(firstField) && typeof firstField[0] === 'string') {
    return firstField[0]
  }

  return 'Something went wrong while talking to the API.'
}
