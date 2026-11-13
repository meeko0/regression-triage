import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Failure } from '../types'
import { isBlocking, isOverdue } from '../lib/triage'
import { engineerById } from '../data/team'
import { OverdueBadge } from './OverdueBadge'
import { cn } from '../lib/utils'
import { RiskBar } from './RiskBar'
import { StatusPill } from './StatusPill'

interface FailureListProps {
  failures: Failure[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** Shown when the list is empty. */
  empty?: ReactNode
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.02 } },
}

const row = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] as const } },
}

export function FailureList({ failures, selectedId, onSelect, empty }: FailureListProps) {
  if (failures.length === 0) {
    return <>{empty ?? <p className="text-body-sm text-muted">No failures to show.</p>}</>
  }

  return (
    <motion.ul
      role="listbox"
      aria-label="Failures"
      variants={container}
      initial="hidden"
      animate="show"
      className="divide-y divide-line border-y border-line"
    >
      {failures.map((failure, index) => {
        const selected = failure.id === selectedId
        return (
          <motion.li key={failure.id} variants={row} layout="position" role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(failure.id)}
              className={cn(
                'group grid w-full grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2 px-2 py-4 text-left transition-colors sm:grid-cols-[3rem_1.4fr_1fr_auto] sm:items-center',
                selected ? 'bg-primary text-paper' : 'hover:bg-primary/5',
              )}
            >
              <span className={cn('font-display text-display-sm font-bold tabular-nums', selected ? 'text-accent-soft' : 'text-muted')}>
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{failure.part}</span>
                  {isBlocking(failure) && (
                    <span
                      className={cn(
                        'label-micro shrink-0',
                        selected ? 'text-paper' : 'text-risk-high',
                      )}
                    >
                      Blocking
                    </span>
                  )}
                  {isOverdue(failure) && <OverdueBadge />}
                </span>
                <span className={cn('mt-1 block truncate text-body-sm', selected ? 'text-paper/75' : 'text-muted')}>
                  {failure.group} · {failure.assembly}
                  {failure.owner && <> · {engineerById(failure.owner)?.name}</>}
                </span>
              </span>

              <RiskBar risk={failure.risk} className="col-span-2 sm:col-span-1" />

              <span className="col-span-2 justify-self-start sm:col-span-1 sm:justify-self-end">
                <StatusPill status={failure.status} />
              </span>
            </button>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}
