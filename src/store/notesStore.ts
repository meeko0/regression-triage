import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Status } from '../types'

// Status history and free-text notes per failure, saved to localStorage on this device.
// Records are keyed "runId/failureId" so the same failure ID in different runs stays separate.

export interface StatusChange {
  from: Status
  to: Status
  at: string // ISO 8601
}

export interface FailureRecord {
  note: string
  history: StatusChange[]
}

export const EMPTY_RECORD: FailureRecord = Object.freeze({ note: '', history: [] }) as FailureRecord

export const NOTES_STORAGE_KEY = 'regression-triage:notes'
export const NOTES_VERSION = 2

/** Run that version 1 data belonged to. Version 1 had no runs, only this one. */
export const LEGACY_RUN_ID = 'NIGHTLY-2026-11-12'

export const recordKey = (runId: string, failureId: string) => `${runId}/${failureId}`

interface NotesState {
  records: Record<string, FailureRecord>
  recordStatusChange: (key: string, from: Status, to: Status, at?: string) => void
  setNote: (key: string, note: string) => void
  reset: () => void
}

type PersistedV2 = Pick<NotesState, 'records'>

/**
 * Version 1 stored notes and history in two maps keyed by failure ID alone, and each history entry
 * only had the new status. Version 2 nests both under a run-scoped key and stores from and to.
 */
export interface PersistedV1 {
  notes: Record<string, string>
  history: Record<string, { status: Status; at: string }[]>
}

export function migrateNotes(persisted: unknown, version: number): PersistedV2 {
  if (version === 1 && persisted && typeof persisted === 'object') {
    const v1 = persisted as Partial<PersistedV1>
    const ids = new Set([...Object.keys(v1.notes ?? {}), ...Object.keys(v1.history ?? {})])
    const records: Record<string, FailureRecord> = {}
    for (const id of ids) {
      // Every failure starts open, so the first change is "from open".
      let previous: Status = 'open'
      const history = (v1.history?.[id] ?? []).map(entry => {
        const change = { from: previous, to: entry.status, at: entry.at }
        previous = entry.status
        return change
      })
      records[recordKey(LEGACY_RUN_ID, id)] = { note: v1.notes?.[id] ?? '', history }
    }
    return { records }
  }
  if (version === NOTES_VERSION) return persisted as PersistedV2
  // Unknown version: start clean rather than load data of an unknown shape.
  return { records: {} }
}

export const useNotesStore = create<NotesState>()(
  persist(
    set => ({
      records: {},
      recordStatusChange: (key, from, to, at = new Date().toISOString()) =>
        set(state => {
          const record = state.records[key] ?? EMPTY_RECORD
          return { records: { ...state.records, [key]: { ...record, history: [...record.history, { from, to, at }] } } }
        }),
      setNote: (key, note) =>
        set(state => {
          const record = state.records[key] ?? EMPTY_RECORD
          return { records: { ...state.records, [key]: { ...record, note } } }
        }),
      reset: () => set({ records: {} }),
    }),
    {
      name: NOTES_STORAGE_KEY,
      version: NOTES_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ records: state.records }),
      migrate: migrateNotes,
    },
  ),
)

/** Selector hook for one failure's record. Returns a stable empty record when there is none. */
export function useFailureRecord(key: string | null): FailureRecord {
  return useNotesStore(state => (key ? state.records[key] : undefined) ?? EMPTY_RECORD)
}
