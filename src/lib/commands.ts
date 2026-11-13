export interface Command {
  id: string
  section: 'Failures' | 'Filters' | 'Runs'
  label: string
  /** Extra words that match a search but are not shown. */
  keywords?: string
  hint?: string
  run: () => void
}

export const SECTIONS: Command['section'][] = ['Failures', 'Filters', 'Runs']

/**
 * Every word in the query must appear somewhere in the label or keywords. Results keep their section
 * order, and within a section, commands whose label starts with the query come first.
 */
export function searchCommands(commands: Command[], query: string): Command[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return commands
  const q = query.trim().toLowerCase()
  const matches = commands.filter(c => {
    const text = `${c.label} ${c.keywords ?? ''}`.toLowerCase()
    return words.every(w => text.includes(w))
  })
  const rank = (c: Command) => (c.label.toLowerCase().startsWith(q) ? 0 : 1)
  return matches
    .map((c, i) => ({ c, i }))
    .sort((a, b) => SECTIONS.indexOf(a.c.section) - SECTIONS.indexOf(b.c.section) || rank(a.c) - rank(b.c) || a.i - b.i)
    .map(x => x.c)
}
