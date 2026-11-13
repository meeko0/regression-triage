import { RUN_ID } from '../data/mockFailures'
import type { Failure } from '../types'
import { summarize } from '../lib/triage'

interface HeaderProps {
  failures: Failure[]
}

export function Header({ failures }: HeaderProps) {
  const stats = summarize(failures)

  return (
    <header className="flex flex-col gap-8 border-b border-ink pb-8">
      <div className="flex items-baseline justify-between gap-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          Nightly run {RUN_ID} · Mock data
        </p>
        <p className="hidden text-[11px] uppercase tracking-[0.18em] text-muted sm:block">
          Use ↑ ↓ or J K to move
        </p>
      </div>

      <h1 className="font-display text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.9] tracking-[-0.04em]">
        Regression
        <br />
        triage.
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
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd
        className={
          emphasis
            ? 'font-display text-5xl font-bold tabular-nums text-risk-high'
            : 'font-display text-5xl font-bold tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  )
}
