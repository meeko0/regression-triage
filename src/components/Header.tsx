import { RUN_ID } from '../data/mockFailures'
import type { Failure } from '../types'
import { summarize } from '../lib/triage'

interface HeaderProps {
  failures: Failure[]
}

export function Header({ failures }: HeaderProps) {
  const stats = summarize(failures)

  return (
    <header className="flex flex-col gap-8 border-b-4 border-accent pb-8">
      <div className="flex items-baseline justify-between gap-6">
        <p className="label-micro text-muted">
          Nightly run {RUN_ID} · Mock data
        </p>
        <p className="label-micro hidden text-muted sm:block">
          Use ↑ ↓ or J K to move
        </p>
      </div>

      <h1 className="font-display text-display-xl font-black tracking-[-0.01em]">
        Regression
        <br />
        {/* Olive is only used at display size: 3.68:1 on paper passes the 3:1 large-text minimum. */}
        <span className="text-accent">triage.</span>
      </h1>

      <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Failures" value={stats.total} />
        <Stat label="Blocking" value={stats.blocking} emphasis />
        <Stat label="Open" value={stats.open} />
        <Stat label="Resolved" value={stats.resolved} />
      </dl>
    </header>
  )
}

function Stat({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div>
      <dt className="label-display text-muted">{label}</dt>
      <dd
        className={
          emphasis
            ? 'mt-2 font-display text-stat font-bold tabular-nums text-risk-high'
            : 'mt-2 font-display text-stat font-bold tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  )
}
