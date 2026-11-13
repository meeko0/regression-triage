import type { GroupFilter, StatusFilter } from '../types'
import { STATUS_LABEL } from '../lib/labels'
import { Button } from './ui/Button'

interface EmptyFiltersProps {
  total: number
  group: GroupFilter
  status: StatusFilter
  blockingOnly: boolean
  mine: boolean
  onClearGroup: () => void
  onClearStatus: () => void
  onClearBlocking: () => void
  onClearMine: () => void
  onClearAll: () => void
}

/** Explains which filters hide the run, with a way to drop each one or all of them. */
export function EmptyFilters(props: EmptyFiltersProps) {
  const active = [
    props.group !== 'all' && { label: `Type: ${props.group}`, clear: props.onClearGroup },
    props.status !== 'all' && { label: `Status: ${STATUS_LABEL[props.status]}`, clear: props.onClearStatus },
    props.blockingOnly && { label: 'Blocking only', clear: props.onClearBlocking },
    props.mine && { label: 'Assigned to me', clear: props.onClearMine },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  if (props.total === 0) {
    return (
      <div className="border border-dashed border-muted p-8 sm:p-10">
        <p className="font-display text-display-sm font-bold">This run has no failures.</p>
        <p className="mt-2 text-body-sm text-muted">Nothing to triage. Pick another run above.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 border border-dashed border-muted p-8 sm:p-10" role="status">
      <div>
        <p className="font-display text-display-sm font-bold">Nothing matches these filters.</p>
        <p className="mt-2 text-body-sm text-muted">
          {active.length === 1 ? 'This filter hides' : 'Together, these filters hide'} all {props.total} failures in
          this run.
        </p>
      </div>

      {active.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Active filters">
          {active.map(filter => (
            <li key={filter.label}>
              <button
                type="button"
                onClick={filter.clear}
                aria-label={`Remove filter ${filter.label}`}
                className="label-micro flex h-8 items-center gap-2 border border-primary px-3 text-primary hover:bg-primary hover:text-paper"
              >
                {filter.label}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="solid" className="self-start" onClick={props.onClearAll}>
        Clear all filters
      </Button>
    </div>
  )
}
