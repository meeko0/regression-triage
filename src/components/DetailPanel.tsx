import { AnimatePresence, motion } from 'motion/react'
import type { Failure, Status } from '../types'
import { RUN_START } from '../data/mockFailures'
import { Button } from './ui/Button'
import { RiskBar } from './RiskBar'
import { StatusPill } from './StatusPill'

interface DetailPanelProps {
  failure: Failure | null
  pending: boolean
  error: string | null
  onStatus: (status: Status) => void
}

// Keeps the part code (for example "R-95") on one line so it never wraps.
function PartTitle({ name }: { name: string }) {
  const index = name.lastIndexOf(" ")
  if (index === -1) return <>{name}</>
  return (
    <>
      {name.slice(0, index)}{" "}
      <span className="whitespace-nowrap">{name.slice(index + 1)}</span>
    </>
  )
}

const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

export function DetailPanel({ failure, pending, error, onStatus }: DetailPanelProps) {
  return (
    <aside
      id="failure-detail"
      aria-label="Failure detail"
      className="border border-ink bg-paper lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto"
    >
      <AnimatePresence mode="wait">
        {failure ? (
          <motion.div
            key={failure.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex flex-col gap-8 p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                {failure.id} · {failure.group}
              </p>
              <StatusPill status={failure.status} />
            </div>

            <div>
              <h2 className="font-display text-4xl font-bold leading-[0.95] tracking-[-0.03em]">
                <PartTitle name={failure.part} />
              </h2>
              <p className="mt-3 text-sm text-muted">{failure.assembly}</p>
            </div>

            <p className="text-lg leading-snug">{failure.summary}</p>

            <div className="flex flex-col gap-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Risk</p>
              <RiskBar risk={failure.risk} size="lg" />
            </div>

            <div className="border-t border-line pt-6">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Suggested next step</p>
              <p className="mt-2 leading-relaxed">{failure.suggestedAction}</p>
            </div>

            <p className="text-xs text-muted">
              Detected {timeFormat.format(new Date(failure.detectedAt))}, run started{' '}
              {timeFormat.format(new Date(RUN_START))}
            </p>

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
              <p role="alert" className="text-sm text-risk-high">
                {error}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[320px] flex-col justify-between p-8"
          >
            <p className="font-display text-3xl font-bold leading-tight">Select a failure to see what to do next.</p>
            <p className="text-sm text-muted">Use the arrow keys or J and K to move through the list.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
