import { resolveMock } from '../mocks/server'
import { httpFetch } from '../transport/http'
export { ApiError } from '../transport/errors'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    return resolveMock<T>(path, options)
  }

  return httpFetch<T>(path, options)
}
