// Calendar dates are plain "YYYY-MM-DD" strings in the user's local time zone.

let clock: () => Date = () => new Date()

/** Test helper: fixes "now". Call with no argument to restore the real clock. */
export function setClock(now?: Date) {
  clock = now ? () => now : () => new Date()
}

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function today(): string {
  return toDateString(clock())
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return toDateString(new Date(y, m - 1, d + days))
}

const dueFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

export function formatDue(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return dueFormat.format(new Date(y, m - 1, d))
}
