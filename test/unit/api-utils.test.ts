import { describe, expect, it } from 'vitest'
import { getErrorMessage, normalizeApiError } from '../../app/utils/api'

describe('api utils', () => {
  it('normalizes status codes and detail payloads', () => {
    const error = normalizeApiError({
      response: { status: 404 },
      data: { detail: 'Not found.' },
    })

    expect(error).toEqual({
      statusCode: 404,
      data: { detail: 'Not found.' },
    })
    expect(getErrorMessage(error)).toBe('Not found.')
  })

  it('extracts the first field validation message', () => {
    const message = getErrorMessage({
      statusCode: 400,
      data: {
        question_id: ['Out-of-order submission.'],
      },
    })

    expect(message).toBe('Out-of-order submission.')
  })

  it('falls back to a generic message when payloads are unstructured', () => {
    expect(
      getErrorMessage({
        statusCode: 500,
        data: {},
      }),
    ).toBe('Something went wrong while talking to the API.')
  })
})
