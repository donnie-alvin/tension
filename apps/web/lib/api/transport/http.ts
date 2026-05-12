import { buildAuthHeaders } from '../auth/headers'
import { ApiError } from './errors'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function httpFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '/api'
  const headers = buildAuthHeaders(options.headers, options.body)

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message =
      isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'API request failed'
    const code =
      isRecord(payload) && typeof payload.code === 'string'
        ? payload.code
        : 'API_ERROR'

    throw new ApiError(message, response.status, code)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
