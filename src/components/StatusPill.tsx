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
        'border px-2 py-1 text-[11px] uppercase tracking-[0.12em]',
        status === 'open' && 'border-ink bg-ink text-paper',
        status === 'investigating' && 'border-ink text-ink',
        status === 'resolved' && 'border-line text-muted',
      )}
    >
      {LABEL[status]}
    </span>
  )
}
