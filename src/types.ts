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
}

export type GroupFilter = 'all' | ErrorGroup
export type StatusFilter = 'all' | Status
export type SortKey = 'risk' | 'newest'
export type RiskLevel = 'high' | 'mid' | 'low'
