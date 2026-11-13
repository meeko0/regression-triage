import type { EngineerId } from './data/team'

export type ErrorGroup = 'Interference' | 'Constraints' | 'Mass' | 'References'

export type Status = 'open' | 'investigating' | 'resolved'

export interface Failure {
  id: string
  part: string
  assembly: string
  group: ErrorGroup
  summary: string
  suggestedAction: string
  risk: number // 0 to 100
  status: Status
  detectedAt: string // ISO 8601
  owner: EngineerId | null
  dueDate: string | null // YYYY-MM-DD
}

/** Fields an engineer can change from the detail panel. */
export type FailurePatch = Partial<Pick<Failure, 'status' | 'owner' | 'dueDate'>>

export type GroupFilter = 'all' | ErrorGroup
export type StatusFilter = 'all' | Status
export type SortKey = 'risk' | 'newest'
export type RiskLevel = 'high' | 'mid' | 'low'
