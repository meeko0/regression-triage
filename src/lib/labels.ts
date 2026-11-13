import type { Status } from '../types'
import { LATEST_RUN_ID, RUNS } from '../data/mockFailures'

export const STATUS_LABEL: Record<Status, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
}

const nightFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** "Nov 12, latest" for the newest run, "Nov 11" for the others. */
export function runLabel(runId: string) {
  const run = RUNS.find(r => r.id === runId)
  if (!run) return runId
  const night = nightFormat.format(new Date(run.start))
  return run.id === LATEST_RUN_ID ? `${night}, latest` : night
}
