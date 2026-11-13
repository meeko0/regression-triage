import { describe, expect, it } from 'vitest'
import { useTriageStore } from './triageStore'

describe('triageStore', () => {
  it('starts with no filters and sorts by risk', () => {
    const state = useTriageStore.getState()
    expect(state.group).toBe('all')
    expect(state.status).toBe('all')
    expect(state.sort).toBe('risk')
    expect(state.blockingOnly).toBe(false)
    expect(state.selectedId).toBeNull()
  })

  it('updates filters and sort', () => {
    const { setGroup, setStatus, setSort } = useTriageStore.getState()
    setGroup('Mass')
    setStatus('open')
    setSort('newest')

    const state = useTriageStore.getState()
    expect(state.group).toBe('Mass')
    expect(state.status).toBe('open')
    expect(state.sort).toBe('newest')
  })

  it('toggles blocking-only on and off', () => {
    useTriageStore.getState().toggleBlockingOnly()
    expect(useTriageStore.getState().blockingOnly).toBe(true)
    useTriageStore.getState().toggleBlockingOnly()
    expect(useTriageStore.getState().blockingOnly).toBe(false)
  })

  it('selects and clears a failure', () => {
    useTriageStore.getState().select('RT-007')
    expect(useTriageStore.getState().selectedId).toBe('RT-007')
    useTriageStore.getState().select(null)
    expect(useTriageStore.getState().selectedId).toBeNull()
  })

  it('reset restores the initial state', () => {
    const store = useTriageStore.getState()
    store.setGroup('Mass')
    store.select('RT-003')
    store.reset()

    const state = useTriageStore.getState()
    expect(state.group).toBe('all')
    expect(state.selectedId).toBeNull()
  })
})

describe('setRun', () => {
  it('switches runs and clears the selection', () => {
    useTriageStore.getState().select('RT-004')
    useTriageStore.getState().setRun('NIGHTLY-2026-11-10')
    expect(useTriageStore.getState().runId).toBe('NIGHTLY-2026-11-10')
    expect(useTriageStore.getState().selectedId).toBeNull()
  })

  it('keeps the selection when the same run is chosen again', () => {
    useTriageStore.getState().select('RT-004')
    useTriageStore.getState().setRun(useTriageStore.getState().runId)
    expect(useTriageStore.getState().selectedId).toBe('RT-004')
  })
})
