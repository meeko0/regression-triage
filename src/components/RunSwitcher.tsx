import { LATEST_RUN_ID, RUNS } from '../data/mockFailures'
import { Chip } from './ui/Chip'

const nightFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export function runLabel(runId: string) {
  const run = RUNS.find(r => r.id === runId)
  if (!run) return runId
  const night = nightFormat.format(new Date(run.start))
  return run.id === LATEST_RUN_ID ? `${night}, latest` : night
}

interface RunSwitcherProps {
  runId: string
  onRun: (runId: string) => void
}

export function RunSwitcher({ runId, onRun }: RunSwitcherProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="label-display float-left mr-2 text-muted">Run</legend>
      {RUNS.map(run => (
        <Chip key={run.id} active={run.id === runId} onClick={() => onRun(run.id)} title={run.id}>
          {runLabel(run.id)}
        </Chip>
      ))}
    </fieldset>
  )
}
