import { useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Failure, FailurePatch, Status } from '../types'
import { ENGINEERS, isEngineerId } from '../data/team'
import { formatDue } from '../lib/dates'
import { isOverdue } from '../lib/triage'
import { OverdueBadge } from './OverdueBadge'
import { RUN_START } from '../data/mockFailures'
import { EMPTY_RECORD, type FailureRecord } from '../store/notesStore'
import { Button } from './ui/Button'
import { RiskBar } from './RiskBar'
import { StatusPill, STATUS_LABEL } from './StatusPill'

export interface DetailPanelProps {
  failure: Failure | null
  pending: boolean
  error: string | null
  onStatus: (status: Status) => void
  record?: FailureRecord
  onNote?: (note: string) => void
  onAssign?: (patch: Pick<FailurePatch, 'owner' | 'dueDate'>) => void
}

// Keeps the part code (for example "R-95") on one line so it never wraps.
function PartTitle({ name }: { name: string }) {
  const index = name.lastIndexOf(' ')
  if (index === -1) return <>{name}</>
  return (
    <>
      {name.slice(0, index)} <span className="whitespace-nowrap">{name.slice(index + 1)}</span>
    </>
  )
}

const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

export function DetailPanel({
  failure,
  pending,
  error,
  onStatus,
  record = EMPTY_RECORD,
  onNote,
  onAssign,
}: DetailPanelProps) {
  const noteId = useId()

  return (
    <aside
      id="failure-detail"
      aria-label="Failure detail"
      className="border border-primary bg-paper lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto"
    >
      <AnimatePresence mode="wait">
        {failure ? (
          <motion.div
            key={failure.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex flex-col gap-8 p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="label-micro text-muted">
                {failure.id} · {failure.group}
              </p>
              <StatusPill status={failure.status} />
            </div>

            <div>
              <h2 className="font-display text-display-md font-bold">
                <PartTitle name={failure.part} />
              </h2>
              <p className="mt-3 text-body-sm text-muted">{failure.assembly}</p>
            </div>

            <p className="text-body-lg">{failure.summary}</p>

            <div className="flex flex-col gap-3">
              <p className="label-display text-muted">Risk</p>
              <RiskBar risk={failure.risk} size="lg" />
            </div>

            <div className="border-t border-line pt-6">
              <p className="label-display text-muted">Suggested next step</p>
              <p className="mt-2 leading-relaxed">{failure.suggestedAction}</p>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-line pt-6">
              {failure.status !== 'investigating' && failure.status !== 'resolved' && (
                <Button variant="outline" disabled={pending} onClick={() => onStatus('investigating')}>
                  Start investigating
                </Button>
              )}
              {failure.status !== 'resolved' ? (
                <Button variant="solid" disabled={pending} onClick={() => onStatus('resolved')}>
                  Mark resolved
                </Button>
              ) : (
                <Button variant="outline" disabled={pending} onClick={() => onStatus('open')}>
                  Reopen
                </Button>
              )}
            </div>

            {error && (
              <p role="alert" className="text-body-sm text-risk-high">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor={`${noteId}-owner`} className="label-display text-muted">
                  Owner
                </label>
                <select
                  id={`${noteId}-owner`}
                  value={failure.owner ?? ''}
                  onChange={event => {
                    const value = event.target.value
                    onAssign?.({ owner: isEngineerId(value) ? value : null })
                  }}
                  className="h-10 border border-muted bg-paper px-2 text-body-sm"
                >
                  <option value="">Unassigned</option>
                  {ENGINEERS.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor={`${noteId}-due`} className="label-display text-muted">
                  Due
                </label>
                <input
                  id={`${noteId}-due`}
                  type="date"
                  value={failure.dueDate ?? ''}
                  onChange={event => onAssign?.({ dueDate: event.target.value || null })}
                  aria-describedby={`${noteId}-due-state`}
                  className="h-10 border border-muted bg-paper px-2 text-body-sm"
                />
              </div>
              <p id={`${noteId}-due-state`} className="flex items-center gap-2 text-caption text-muted sm:col-span-2">
                {isOverdue(failure) ? (
                  <>
                    <OverdueBadge />
                    <span>Was due {formatDue(failure.dueDate!)}.</span>
                  </>
                ) : failure.dueDate ? (
                  <span>Due {formatDue(failure.dueDate)}.</span>
                ) : (
                  <span>No due date.</span>
                )}
              </p>
            </div>

            <section aria-labelledby={`${noteId}-history`} className="border-t border-line pt-6">
              <h3 id={`${noteId}-history`} className="label-display text-muted">
                History
              </h3>
              <ol className="mt-3 flex flex-col gap-2 border-l-2 border-line pl-4 text-body-sm">
                <li>
                  <span className="font-medium">Detected</span>{' '}
                  <span className="text-muted">{dateTimeFormat.format(new Date(failure.detectedAt))}</span>
                </li>
                {record.history.map((change, i) => (
                  <li key={`${change.at}-${i}`}>
                    <span className="font-medium">
                      {STATUS_LABEL[change.from]} to {STATUS_LABEL[change.to]}
                    </span>{' '}
                    <span className="text-muted">{dateTimeFormat.format(new Date(change.at))}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="flex flex-col gap-2 border-t border-line pt-6">
              <label htmlFor={`${noteId}-note`} className="label-display text-muted">
                Note
              </label>
              <textarea
                id={`${noteId}-note`}
                value={record.note}
                onChange={event => onNote?.(event.target.value)}
                rows={3}
                placeholder="What you found, who you asked, what is next."
                className="w-full resize-y border border-muted bg-paper p-3 text-body-sm placeholder:text-muted"
              />
              <p className="text-caption text-muted">Saved on this device as you type.</p>
            </div>

            <p className="text-caption text-muted">
              Detected {timeFormat.format(new Date(failure.detectedAt))}, run started{' '}
              {timeFormat.format(new Date(RUN_START))}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[320px] flex-col justify-between p-8"
          >
            <p className="font-display text-display-md font-bold">No failure selected.</p>
            <p className="text-body-sm text-muted">Pick a row, or use the arrow keys or J and K to move through the list.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
