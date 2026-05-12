export function buildAuthHeaders(
  initialHeaders?: HeadersInit,
  body?: BodyInit | null,
): Headers {
  const headers = new Headers(initialHeaders)

  if (!(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('traycer_token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  return headers
}
