import { buildRun, runById } from '../data/mockFailures'
import type { Failure, FailurePatch } from '../types'

// In-memory stand-in for a real API. Swap these functions for fetch calls later.
//
// Changes are also written to localStorage, so a reload behaves like a real backend: the status
// you set is still there, and it matches the status history in the notes store.

export const SERVER_STORAGE_KEY = 'regression-triage:mock-server:v1'

type Overrides = Record<string, FailurePatch>

function loadOverrides(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(SERVER_STORAGE_KEY) ?? '{}') as Overrides
  } catch {
    return {}
  }
}

function saveOverrides(overrides: Overrides) {
  try {
    localStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // Storage can be full or blocked. The change still applies for this session.
  }
}

let overrides: Overrides = loadOverrides()
const seeded = new Map<string, Failure[]>()

const key = (runId: string, id: string) => `${runId}/${id}`

function seededRun(runId: string): Failure[] {
  const run = runById(runId)
  if (!run) throw new Error(`Run ${runId} was not found`)
  if (!seeded.has(runId)) seeded.set(runId, buildRun(run))
  return seeded.get(runId)!
}

function current(runId: string): Failure[] {
  return seededRun(runId).map(f => ({ ...f, ...overrides[key(runId, f.id)] }))
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchFailures(runId: string): Promise<Failure[]> {
  await delay(350)
  return current(runId)
}

export async function updateFailure(runId: string, id: string, patch: FailurePatch): Promise<Failure> {
  await delay(250)
  if (!seededRun(runId).some(f => f.id === id)) {
    throw new Error(`Failure ${id} was not found in ${runId}`)
  }
  overrides = { ...overrides, [key(runId, id)]: { ...overrides[key(runId, id)], ...patch } }
  saveOverrides(overrides)
  return current(runId).find(f => f.id === id)!
}

// Test helper: restores the seeded data between test cases.
export function resetMockServer() {
  overrides = {}
  try {
    localStorage.removeItem(SERVER_STORAGE_KEY)
  } catch {
    // ignore
  }
}
