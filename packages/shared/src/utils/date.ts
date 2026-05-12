const absoluteDateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
})

const relativeDateFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
})

const minute = 60 * 1000
const hour = 60 * minute
const day = 24 * hour
const month = 30 * day
const year = 365 * day

export function formatDate(date: string): string {
  return absoluteDateFormatter.format(new Date(date))
}

export function formatRelativeDate(date: string): string {
  const timestamp = new Date(date).getTime()
  const diff = timestamp - Date.now()
  const abs = Math.abs(diff)

  if (abs < minute) {
    return 'just now'
  }

  if (abs < hour) {
    return relativeDateFormatter.format(Math.round(diff / minute), 'minute')
  }

  if (abs < day) {
    return relativeDateFormatter.format(Math.round(diff / hour), 'hour')
  }

  if (abs < month) {
    return relativeDateFormatter.format(Math.round(diff / day), 'day')
  }

  if (abs < year) {
    return relativeDateFormatter.format(Math.round(diff / month), 'month')
  }

  return relativeDateFormatter.format(Math.round(diff / year), 'year')
}
