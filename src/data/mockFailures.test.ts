import { describe, expect, it } from 'vitest'
import { RUNS, buildMockFailures, buildRun } from './mockFailures'

describe('buildMockFailures', () => {
  const failures = buildMockFailures()

  it('creates 48 failures by default', () => {
    expect(failures).toHaveLength(48)
  })

  it('gives every failure a unique ID', () => {
    const ids = new Set(failures.map(f => f.id))
    expect(ids.size).toBe(failures.length)
  })

  it('keeps risk scores between 0 and 100', () => {
    for (const f of failures) {
      expect(f.risk).toBeGreaterThanOrEqual(0)
      expect(f.risk).toBeLessThanOrEqual(100)
    }
  })

  it('is deterministic for the same seed', () => {
    expect(buildMockFailures()).toEqual(failures)
  })

  it('uses only valid statuses and groups', () => {
    const statuses = new Set(['open', 'investigating', 'resolved'])
    const groups = new Set(['Interference', 'Constraints', 'Mass', 'References'])
    for (const f of failures) {
      expect(statuses.has(f.status)).toBe(true)
      expect(groups.has(f.group)).toBe(true)
    }
  })
})

describe('RUNS', () => {
  it('has three nightly runs, newest first, each with its own seed', () => {
    expect(RUNS.map(r => r.id)).toEqual(['NIGHTLY-2026-11-12', 'NIGHTLY-2026-11-11', 'NIGHTLY-2026-11-10'])
    expect(new Set(RUNS.map(r => r.seed)).size).toBe(3)
  })

  it('builds different data for each run from the same generator', () => {
    const [a, b, c] = RUNS.map(buildRun)
    expect(a).toHaveLength(RUNS[0].count)
    expect(b).toHaveLength(RUNS[1].count)
    expect(a.map(f => f.part)).not.toEqual(b.slice(0, a.length).map(f => f.part))
    expect(c[0].detectedAt.startsWith('2026-11-10')).toBe(true)
  })

  it('keeps the latest run identical to the default data set', () => {
    expect(buildRun(RUNS[0])).toEqual(buildMockFailures())
  })
})
