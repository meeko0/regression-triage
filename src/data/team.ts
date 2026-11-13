// Fictional engineers. Any resemblance to real people is unintended.
export const ENGINEERS = [
  { id: 'ines', name: 'Ines Okafor', initials: 'IO' },
  { id: 'tomas', name: 'Tomas Reyes', initials: 'TR' },
  { id: 'mei', name: 'Mei Lindqvist', initials: 'ML' },
] as const

export type EngineerId = (typeof ENGINEERS)[number]['id']

/** The signed-in user for this prototype. The "Mine" filter reads it. */
export const CURRENT_USER_ID: EngineerId = 'ines'

export function engineerById(id: string | null | undefined) {
  return ENGINEERS.find(e => e.id === id) ?? null
}

export function isEngineerId(value: unknown): value is EngineerId {
  return ENGINEERS.some(e => e.id === value)
}
