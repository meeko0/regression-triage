import type { ReactNode } from 'react'
import type { Failure } from '../types'
import { summarize } from '../lib/triage'
import { CURRENT_USER_ID, engineerById } from '../data/team'
import { AboutDialog } from './AboutDialog'
import { RunSwitcher } from './RunSwitcher'

interface HeaderProps {
  runId: string
  onRun: (runId: string) => void
  /** Undefined while the run is loading. Stats show a dash until it arrives. */
  failures: Failure[] | undefined
  /** Extra controls on the right of the top row, such as the command palette trigger. */
  actions?: ReactNode
}

export function Header({ runId, onRun, failures, actions }: HeaderProps) {
  const stats = failures ? summarize(failures) : undefined

  return (
    <header className="flex flex-col gap-8 border-b-4 border-accent pb-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="label-micro text-muted">
          Nightly run <span data-testid="run-id">{runId}</span> · Viewing as {engineerById(CURRENT_USER_ID)?.name} · Mock
          data
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="label-micro hidden text-muted xl:block">Use ↑ ↓ or J K to move</p>
          {actions}
          <AboutDialog />
        </div>
      </div>

      <h1 className="font-display text-display-xl font-black tracking-[-0.01em]">
        Regression
        <br />
        {/* Olive is only used at display size: 3.68:1 on paper passes the 3:1 large-text minimum. */}
        <span className="text-accent">triage.</span>
      </h1>

      <RunSwitcher runId={runId} onRun={onRun} />

      <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4" aria-busy={!stats}>
        <Stat label="Failures" value={stats?.total} />
        <Stat label="Blocking" value={stats?.blocking} emphasis />
        <Stat label="Open" value={stats?.open} />
        <Stat label="Resolved" value={stats?.resolved} />
      </dl>
    </header>
  )
}

function Stat({ label, value, emphasis = false }: { label: string; value: number | undefined; emphasis?: boolean }) {
  return (
    <div>
      <dt className="label-display text-muted">{label}</dt>
      <dd
        className={
          emphasis && value !== undefined
            ? 'mt-2 font-display text-stat font-bold tabular-nums text-risk-high'
            : 'mt-2 font-display text-stat font-bold tabular-nums'
        }
      >
        {value ?? <span aria-label="Loading">–</span>}
      </dd>
    </div>
  )
}
