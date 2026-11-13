import { RUNS } from '../data/mockFailures'
import { runLabel } from '../lib/labels'
import { Chip } from './ui/Chip'

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
