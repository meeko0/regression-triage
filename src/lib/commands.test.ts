import { describe, expect, it } from 'vitest'
import { searchCommands, type Command } from './commands'

const noop = () => {}
const commands: Command[] = [
  { id: 'f1', section: 'Failures', label: 'RT-001 Seat Track Mount R-95', keywords: 'Constraints Cockpit', run: noop },
  { id: 'f2', section: 'Failures', label: 'RT-002 Roof Rack Anchor', keywords: 'Mass Chassis', run: noop },
  { id: 'g1', section: 'Filters', label: 'Show only Mass', keywords: 'filter type group', run: noop },
  { id: 'r1', section: 'Runs', label: 'Switch to run Nov 11', keywords: 'NIGHTLY-2026-11-11', run: noop },
]

const ids = (query: string) => searchCommands(commands, query).map(c => c.id)

describe('searchCommands', () => {
  it('returns everything for an empty query', () => {
    expect(ids('  ')).toEqual(['f1', 'f2', 'g1', 'r1'])
  })

  it('matches every word, in any order, across label and keywords', () => {
    expect(ids('mount seat')).toEqual(['f1'])
    expect(ids('mass')).toEqual(['f2', 'g1'])
    expect(ids('mass filter')).toEqual(['g1'])
  })

  it('is case-insensitive and matches hidden keywords', () => {
    expect(ids('nightly-2026-11-11')).toEqual(['r1'])
  })

  it('ranks label prefix matches first within a section', () => {
    const more: Command[] = [
      { id: 'a', section: 'Filters', label: 'Toggle mine', run: noop },
      { id: 'b', section: 'Filters', label: 'Mine only view', run: noop },
    ]
    expect(searchCommands(more, 'mine').map(c => c.id)).toEqual(['b', 'a'])
  })

  it('returns nothing when no command matches', () => {
    expect(ids('gearbox')).toEqual([])
  })
})
