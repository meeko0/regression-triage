import { describe, expect, it } from 'vitest'
import { buildMockFailures } from './mockFailures'

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
