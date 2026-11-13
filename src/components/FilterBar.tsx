import type { ErrorGroup, Failure, GroupFilter, SortKey, StatusFilter } from '../types'
import { countByGroup, isBlocking } from '../lib/triage'
import { CURRENT_USER_ID, engineerById } from '../data/team'
import { Chip } from './ui/Chip'

const GROUPS: GroupFilter[] = ['all', 'Interference', 'Constraints', 'Mass', 'References']
const STATUSES: StatusFilter[] = ['all', 'open', 'investigating', 'resolved']

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'All',
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
}

interface FilterBarProps {
  failures: Failure[]
  group: GroupFilter
  status: StatusFilter
  sort: SortKey
  blockingOnly: boolean
  mine: boolean
  onGroup: (group: GroupFilter) => void
  onStatus: (status: StatusFilter) => void
  onSort: (sort: SortKey) => void
  onToggleBlocking: () => void
  onToggleMine: () => void
}

export function FilterBar(props: FilterBarProps) {
  const counts = countByGroup(props.failures)
  const blockingCount = props.failures.filter(isBlocking).length
  const mineCount = props.failures.filter(f => f.owner === CURRENT_USER_ID).length
  const me = engineerById(CURRENT_USER_ID)

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">Filter by error type</legend>
        {GROUPS.map(group => (
          <Chip
            key={group}
            active={props.group === group}
            onClick={() => props.onGroup(group)}
            count={group === 'all' ? props.failures.length : counts[group as ErrorGroup]}
          >
            {group === 'all' ? 'All types' : group}
          </Chip>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">Filter by status</legend>
          {STATUSES.map(status => (
            <Chip
              key={status}
              active={props.status === status}
              onClick={() => props.onStatus(status)}
            >
              {STATUS_LABEL[status]}
            </Chip>
          ))}
          <Chip active={props.blockingOnly} onClick={props.onToggleBlocking} count={blockingCount}>
            Blocking only
          </Chip>
          <Chip active={props.mine} onClick={props.onToggleMine} count={mineCount} title={`Assigned to ${me?.name}`}>
            Mine
          </Chip>
        </fieldset>

        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Sort order</legend>
          <Chip active={props.sort === 'risk'} onClick={() => props.onSort('risk')}>
            By risk
          </Chip>
          <Chip active={props.sort === 'newest'} onClick={() => props.onSort('newest')}>
            Newest
          </Chip>
        </fieldset>
      </div>
    </div>
  )
}
