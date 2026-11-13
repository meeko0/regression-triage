import type { Failure, GroupFilter, RiskLevel, SortKey, StatusFilter } from '../types'

export const BLOCKING_THRESHOLD = 70

export interface Filters {
  group: GroupFilter
  status: StatusFilter
  blockingOnly: boolean
}

export function riskLevel(risk: number): RiskLevel {
  if (risk >= BLOCKING_THRESHOLD) return 'high'
  if (risk >= 40) return 'mid'
  return 'low'
}

// A failure blocks the next release when its risk is high and it hasn't been resolved.
export function isBlocking(failure: Failure): boolean {
  return failure.risk >= BLOCKING_THRESHOLD && failure.status !== 'resolved'
}

export function applyFilters(failures: Failure[], filters: Filters): Failure[] {
  return failures.filter(f => {
    if (filters.group !== 'all' && f.group !== filters.group) return false
    if (filters.status !== 'all' && f.status !== filters.status) return false
    if (filters.blockingOnly && !isBlocking(f)) return false
    return true
  })
}

export function sortFailures(failures: Failure[], key: SortKey): Failure[] {
  const copy = [...failures]
  if (key === 'risk') {
    return copy.sort((a, b) => b.risk - a.risk || a.id.localeCompare(b.id))
  }
  return copy.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt) || a.id.localeCompare(b.id))
}

export function summarize(failures: Failure[]) {
  return {
    total: failures.length,
    blocking: failures.filter(isBlocking).length,
    open: failures.filter(f => f.status === 'open').length,
    resolved: failures.filter(f => f.status === 'resolved').length,
  }
}

export function countByGroup(failures: Failure[]): Record<Exclude<GroupFilter, 'all'>, number> {
  const counts = { Interference: 0, Constraints: 0, Mass: 0, References: 0 }
  for (const f of failures) counts[f.group] += 1
  return counts
}
