export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function parseBody(options?: RequestInit): Record<string, unknown> {
  if (typeof options?.body !== 'string') {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(options.body)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function stringFromBody(
  body: Record<string, unknown>,
  key: string,
  fallback = '',
): string {
  const value = body[key]
  return typeof value === 'string' ? value : fallback
}
