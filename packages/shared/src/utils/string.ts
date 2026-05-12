export function truncate(str: string, maxLen: number): string {
  if (maxLen <= 0) {
    return ''
  }

  if (str.length <= maxLen) {
    return str
  }

  if (maxLen <= 3) {
    return '.'.repeat(maxLen)
  }

  return `${str.slice(0, Math.max(0, maxLen - 3)).trimEnd()}...`
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
