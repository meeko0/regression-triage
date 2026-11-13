import type { ErrorGroup, SortKey, Status } from '../types'
import { initialView, useTriageStore, type ViewState } from './triageStore'
import { RUNS } from '../data/mockFailures'

// Two-way sync between the view store and the query string.
// The store stays the single source of truth: the URL is written from it, and read back into it
// on load and on back/forward. Defaults are left out so a plain view has a clean URL.

const GROUPS: ErrorGroup[] = ['Interference', 'Constraints', 'Mass', 'References']
const STATUSES: Status[] = ['open', 'investigating', 'resolved']
const SORTS: SortKey[] = ['risk', 'newest']
const RUN_IDS = RUNS.map(r => r.id)
const ID_PATTERN = /^[A-Z]{2}-\d{3}$/

const oneOf = <T extends string>(values: readonly T[], value: string | null): T | undefined =>
  values.includes(value as T) ? (value as T) : undefined

/** Reads a view from a query string. Unknown or invalid values fall back to the default. */
export function searchToView(search: string): ViewState {
  const params = new URLSearchParams(search)
  const id = params.get('id')
  return {
    runId: oneOf(RUN_IDS, params.get('run')) ?? initialView.runId,
    group: oneOf(GROUPS, params.get('group')) ?? initialView.group,
    status: oneOf(STATUSES, params.get('status')) ?? initialView.status,
    sort: oneOf(SORTS, params.get('sort')) ?? initialView.sort,
    blockingOnly: params.get('blocking') === '1',
    mine: params.get('mine') === '1',
    selectedId: id && ID_PATTERN.test(id) ? id : initialView.selectedId,
  }
}

/** Writes a view as a query string, including the leading "?", or "" for the default view. */
export function viewToSearch(view: ViewState): string {
  const params = new URLSearchParams()
  if (view.runId !== initialView.runId) params.set('run', view.runId)
  if (view.group !== initialView.group) params.set('group', view.group)
  if (view.status !== initialView.status) params.set('status', view.status)
  if (view.sort !== initialView.sort) params.set('sort', view.sort)
  if (view.blockingOnly) params.set('blocking', '1')
  if (view.mine) params.set('mine', '1')
  if (view.selectedId) params.set('id', view.selectedId)
  const text = params.toString()
  return text ? `?${text}` : ''
}

function pickView(state: ViewState): ViewState {
  const { runId, group, status, sort, blockingOnly, mine, selectedId } = state
  return { runId, group, status, sort, blockingOnly, mine, selectedId }
}

/**
 * Starts syncing. Returns a function that stops it.
 * Filter, sort, and run changes push a history entry so Back undoes them.
 * Selection changes replace the current entry, so moving through the list with J and K
 * does not fill the history.
 */
export function startUrlSync(store = useTriageStore, win: Window = window): () => void {
  const applyFromUrl = () => store.setState(searchToView(win.location.search))

  applyFromUrl()

  const unsubscribe = store.subscribe((state, previous) => {
    const next = viewToSearch(pickView(state))
    if (next === win.location.search) return
    const url = `${win.location.pathname}${next}${win.location.hash}`
    const onlySelection = viewToSearch({ ...pickView(previous), selectedId: state.selectedId }) === next
    if (onlySelection) win.history.replaceState(win.history.state, '', url)
    else win.history.pushState(win.history.state, '', url)
  })

  win.addEventListener('popstate', applyFromUrl)

  return () => {
    unsubscribe()
    win.removeEventListener('popstate', applyFromUrl)
  }
}
