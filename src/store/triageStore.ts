import { create } from 'zustand'
import type { GroupFilter, SortKey, StatusFilter } from '../types'
import { LATEST_RUN_ID } from '../data/mockFailures'

// What the user is looking at. This store is the single source of truth for the view.
// src/store/urlSync.ts mirrors it to the query string and back.
export interface ViewState {
  runId: string
  group: GroupFilter
  status: StatusFilter
  sort: SortKey
  blockingOnly: boolean
  mine: boolean
  selectedId: string | null
}

interface TriageState extends ViewState {
  /** Switches runs and clears the selection, since failure IDs belong to a run. */
  setRun: (runId: string) => void
  setGroup: (group: GroupFilter) => void
  setStatus: (status: StatusFilter) => void
  setSort: (sort: SortKey) => void
  toggleBlockingOnly: () => void
  toggleMine: () => void
  select: (id: string | null) => void
  clearFilters: () => void
  reset: () => void
}

export const initialView: ViewState = {
  runId: LATEST_RUN_ID,
  group: 'all',
  status: 'all',
  sort: 'risk',
  blockingOnly: false,
  mine: false,
  selectedId: null,
}

export const useTriageStore = create<TriageState>()(set => ({
  ...initialView,
  setRun: runId => set(state => (state.runId === runId ? {} : { runId, selectedId: null })),
  setGroup: group => set({ group }),
  setStatus: status => set({ status }),
  setSort: sort => set({ sort }),
  toggleBlockingOnly: () => set(state => ({ blockingOnly: !state.blockingOnly })),
  toggleMine: () => set(state => ({ mine: !state.mine })),
  select: selectedId => set({ selectedId }),
  clearFilters: () =>
    set({
      group: initialView.group,
      status: initialView.status,
      blockingOnly: initialView.blockingOnly,
      mine: initialView.mine,
    }),
  reset: () => set(initialView),
}))
