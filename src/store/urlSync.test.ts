import { afterEach, describe, expect, it } from 'vitest'
import { initialView, useTriageStore } from './triageStore'
import { searchToView, startUrlSync, viewToSearch } from './urlSync'

let stop: (() => void) | undefined
afterEach(() => stop?.())

describe('searchToView and viewToSearch', () => {
  it('leaves the default view out of the URL', () => {
    expect(viewToSearch(initialView)).toBe('')
    expect(searchToView('')).toEqual(initialView)
  })

  it('round-trips every field', () => {
    const view = { group: 'Mass', status: 'open', sort: 'newest', blockingOnly: true, mine: true, selectedId: 'RT-007' } as const
    const search = viewToSearch(view)
    expect(search).toBe('?group=Mass&status=open&sort=newest&blocking=1&mine=1&id=RT-007')
    expect(searchToView(search)).toEqual(view)
  })

  it('ignores invalid values', () => {
    expect(searchToView('?group=Nope&status=closed&sort=size&blocking=yes&mine=true&id=<script>')).toEqual(initialView)
  })
})

describe('startUrlSync', () => {
  it('reads the URL into the store on start', () => {
    window.history.replaceState(null, '', '/?group=Constraints&blocking=1&id=RT-012')
    stop = startUrlSync()

    const state = useTriageStore.getState()
    expect(state.group).toBe('Constraints')
    expect(state.blockingOnly).toBe(true)
    expect(state.selectedId).toBe('RT-012')
  })

  it('writes store changes to the URL', () => {
    stop = startUrlSync()
    useTriageStore.getState().setStatus('resolved')
    useTriageStore.getState().setSort('newest')
    expect(window.location.search).toBe('?status=resolved&sort=newest')

    useTriageStore.getState().reset()
    expect(window.location.search).toBe('')
  })

  it('pushes history for filter changes and replaces it for selection changes', () => {
    stop = startUrlSync()
    const start = window.history.length

    useTriageStore.getState().setGroup('Mass')
    expect(window.history.length).toBe(start + 1)

    useTriageStore.getState().select('RT-001')
    useTriageStore.getState().select('RT-002')
    expect(window.history.length).toBe(start + 1)
    expect(window.location.search).toBe('?group=Mass&id=RT-002')
  })

  it('applies the URL to the store on back and forward', () => {
    stop = startUrlSync()
    useTriageStore.getState().setGroup('Mass')

    window.history.replaceState(null, '', '/?status=investigating')
    window.dispatchEvent(new PopStateEvent('popstate'))

    const state = useTriageStore.getState()
    expect(state.group).toBe('all')
    expect(state.status).toBe('investigating')
  })

  it('stops syncing when the returned function is called', () => {
    stop = startUrlSync()
    stop()
    useTriageStore.getState().setGroup('Mass')
    expect(window.location.search).toBe('')
  })
})
