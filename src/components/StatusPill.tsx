import type { Status } from '../types'
import { cn } from '../lib/utils'

const LABEL: Record<Status, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
}

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        'label-micro whitespace-nowrap border px-2 py-1',
        status === 'open' && 'border-primary bg-primary text-paper group-aria-selected:border-paper group-aria-selected:bg-paper group-aria-selected:text-primary',
        status === 'investigating' && 'border-primary text-primary group-aria-selected:border-paper group-aria-selected:text-paper',
        status === 'resolved' && 'border-line text-muted group-aria-selected:border-paper/75 group-aria-selected:text-paper/75',
      )}
    >
      {LABEL[status]}
    </span>
  )
}
