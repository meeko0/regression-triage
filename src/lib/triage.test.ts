import { describe, expect, it } from 'vitest'
import type { Failure } from '../types'
import { applyFilters, countByGroup, isBlocking, isOverdue, riskHistogram, riskLevel, sortFailures, summarize } from './triage'

const fixture: Failure[] = [
  {
    id: 'A',
    part: 'Alpha',
    assembly: 'Cockpit',
    group: 'Interference',
    summary: '',
    suggestedAction: '',
    risk: 90,
    status: 'open',
    detectedAt: '2026-11-12T23:00:00.000Z',
    owner: 'ines',
    dueDate: '2026-11-10',
  },
  {
    id: 'B',
    part: 'Beta',
    assembly: 'Chassis',
    group: 'Mass',
    summary: '',
    suggestedAction: '',
    risk: 75,
    status: 'resolved',
    detectedAt: '2026-11-12T23:10:00.000Z',
    owner: 'tomas',
    dueDate: '2026-11-01',
  },
  {
    id: 'C',
    part: 'Gamma',
    assembly: 'Battery Pack',
    group: 'Constraints',
    summary: '',
    suggestedAction: '',
    risk: 42,
    status: 'investigating',
    detectedAt: '2026-11-12T22:50:00.000Z',
    owner: null,
    dueDate: null,
  },
  {
    id: 'D',
    part: 'Delta',
    assembly: 'Body in White',
    group: 'Interference',
    summary: '',
    suggestedAction: '',
    risk: 12,
    status: 'open',
    detectedAt: '2026-11-12T23:20:00.000Z',
    owner: 'ines',
    dueDate: '2026-11-20',
  },
]

describe('riskLevel', () => {
  it('maps risk to high, mid, and low bands', () => {
    expect(riskLevel(70)).toBe('high')
    expect(riskLevel(69)).toBe('mid')
    expect(riskLevel(40)).toBe('mid')
    expect(riskLevel(39)).toBe('low')
  })
})

describe('isBlocking', () => {
  it('is true only for high risk that is not resolved', () => {
    expect(isBlocking(fixture[0])).toBe(true)
    expect(isBlocking(fixture[1])).toBe(false) // resolved
    expect(isBlocking(fixture[2])).toBe(false) // low risk
  })
})

describe('isOverdue', () => {
  it('is true only when the due date has passed and the failure is not resolved', () => {
    const now = '2026-11-13'
    expect(isOverdue(fixture[0], now)).toBe(true) // due Nov 10, open
    expect(isOverdue(fixture[1], now)).toBe(false) // resolved
    expect(isOverdue(fixture[2], now)).toBe(false) // no due date
    expect(isOverdue(fixture[3], now)).toBe(false) // due Nov 20
  })

  it('does not count a failure due today as overdue', () => {
    expect(isOverdue({ ...fixture[0], dueDate: '2026-11-13' }, '2026-11-13')).toBe(false)
  })
})

describe('applyFilters', () => {
  it('returns everything when no filter is set', () => {
    expect(applyFilters(fixture, { group: 'all', status: 'all', blockingOnly: false })).toHaveLength(4)
  })

  it('filters by group', () => {
    const result = applyFilters(fixture, { group: 'Interference', status: 'all', blockingOnly: false })
    expect(result.map(f => f.id)).toEqual(['A', 'D'])
  })

  it('filters by status', () => {
    const result = applyFilters(fixture, { group: 'all', status: 'resolved', blockingOnly: false })
    expect(result.map(f => f.id)).toEqual(['B'])
  })

  it('keeps only failures owned by the current user when mine is set', () => {
    const result = applyFilters(fixture, { group: 'all', status: 'all', blockingOnly: false, mine: true })
    expect(result.map(f => f.id)).toEqual(['A', 'D'])
  })

  it('keeps only blocking failures when blockingOnly is set', () => {
    const result = applyFilters(fixture, { group: 'all', status: 'all', blockingOnly: true })
    expect(result.map(f => f.id)).toEqual(['A'])
  })
})

describe('sortFailures', () => {
  it('sorts by risk, highest first, with ID as a tiebreaker', () => {
    expect(sortFailures(fixture, 'risk').map(f => f.id)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('sorts by newest detection first', () => {
    expect(sortFailures(fixture, 'newest').map(f => f.id)).toEqual(['D', 'B', 'A', 'C'])
  })

  it('does not mutate the input array', () => {
    const input = [...fixture]
    sortFailures(input, 'risk')
    expect(input.map(f => f.id)).toEqual(['A', 'B', 'C', 'D'])
  })
})

describe('summarize and countByGroup', () => {
  it('counts totals, blocking, open, and resolved', () => {
    expect(summarize(fixture)).toEqual({ total: 4, blocking: 1, open: 2, resolved: 1 })
  })

  it('counts failures per error group', () => {
    expect(countByGroup(fixture)).toEqual({ Interference: 2, Constraints: 1, Mass: 1, References: 0 })
  })
})

describe('riskHistogram', () => {
  it('puts each failure in a 10-point bucket, with 100 in the last one', () => {
    const at = (risk: number) => ({ ...fixture[0], risk })
    const buckets = riskHistogram([at(0), at(9), at(10), at(69), at(70), at(99), at(100)])
    expect(buckets).toHaveLength(10)
    expect(buckets.map(b => b.count)).toEqual([2, 1, 0, 0, 0, 0, 1, 1, 0, 2])
    expect(buckets[9]).toMatchObject({ from: 90, to: 100, level: 'high' })
  })

  it('bands buckets the same way as riskLevel', () => {
    expect(riskHistogram([]).map(b => b.level)).toEqual([
      'low', 'low', 'low', 'low', 'mid', 'mid', 'mid', 'high', 'high', 'high',
    ])
  })
})
