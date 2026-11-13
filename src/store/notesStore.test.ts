import { beforeEach, describe, expect, it } from 'vitest'
import {
  LEGACY_RUN_ID,
  NOTES_STORAGE_KEY,
  NOTES_VERSION,
  migrateNotes,
  recordKey,
  useNotesStore,
  type PersistedV1,
} from './notesStore'

const key = recordKey('NIGHTLY-2026-11-12', 'RT-001')

beforeEach(() => {
  localStorage.clear()
  useNotesStore.getState().reset()
})

describe('notesStore', () => {
  it('records status changes in order', () => {
    const { recordStatusChange } = useNotesStore.getState()
    recordStatusChange(key, 'open', 'investigating', '2026-11-13T08:00:00.000Z')
    recordStatusChange(key, 'investigating', 'resolved', '2026-11-13T09:30:00.000Z')

    expect(useNotesStore.getState().records[key].history).toEqual([
      { from: 'open', to: 'investigating', at: '2026-11-13T08:00:00.000Z' },
      { from: 'investigating', to: 'resolved', at: '2026-11-13T09:30:00.000Z' },
    ])
  })

  it('keeps the note and the history together', () => {
    useNotesStore.getState().setNote(key, 'Asked the closure team about the gap target.')
    useNotesStore.getState().recordStatusChange(key, 'open', 'investigating')
    const record = useNotesStore.getState().records[key]
    expect(record.note).toBe('Asked the closure team about the gap target.')
    expect(record.history).toHaveLength(1)
  })

  it('persists to localStorage under a versioned key', () => {
    useNotesStore.getState().setNote(key, 'Persist me')
    const stored = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!)
    expect(stored.version).toBe(NOTES_VERSION)
    expect(stored.state.records[key].note).toBe('Persist me')
    // Actions are not persisted.
    expect(stored.state.setNote).toBeUndefined()
  })

  it('rehydrates saved records', async () => {
    localStorage.setItem(
      NOTES_STORAGE_KEY,
      JSON.stringify({
        version: NOTES_VERSION,
        state: { records: { [key]: { note: 'From last session', history: [] } } },
      }),
    )
    await useNotesStore.persist.rehydrate()
    expect(useNotesStore.getState().records[key].note).toBe('From last session')
  })

  it('migrates version 1 data on rehydrate', async () => {
    const v1: PersistedV1 = {
      notes: { 'RT-004': 'Old note' },
      history: {
        'RT-004': [
          { status: 'investigating', at: '2026-11-12T10:00:00.000Z' },
          { status: 'resolved', at: '2026-11-12T11:00:00.000Z' },
        ],
        'RT-009': [{ status: 'resolved', at: '2026-11-12T12:00:00.000Z' }],
      },
    }
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 1, state: v1 }))
    await useNotesStore.persist.rehydrate()

    const records = useNotesStore.getState().records
    expect(records[recordKey(LEGACY_RUN_ID, 'RT-004')]).toEqual({
      note: 'Old note',
      history: [
        { from: 'open', to: 'investigating', at: '2026-11-12T10:00:00.000Z' },
        { from: 'investigating', to: 'resolved', at: '2026-11-12T11:00:00.000Z' },
      ],
    })
    expect(records[recordKey(LEGACY_RUN_ID, 'RT-009')]).toEqual({
      note: '',
      history: [{ from: 'open', to: 'resolved', at: '2026-11-12T12:00:00.000Z' }],
    })

    // The migrated data is written back at the current version.
    expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!).version).toBe(NOTES_VERSION)
  })

  it('drops data from an unknown version instead of loading it', () => {
    expect(migrateNotes({ something: 'else' }, 0)).toEqual({ records: {} })
  })
})
