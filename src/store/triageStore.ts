import { create } from 'zustand'
import type { GroupFilter, SortKey, StatusFilter } from '../types'

interface TriageState {
  group: GroupFilter
  status: StatusFilter
  sort: SortKey
  blockingOnly: boolean
  selectedId: string | null
  setGroup: (group: GroupFilter) => void
  setStatus: (status: StatusFilter) => void
  setSort: (sort: SortKey) => void
  toggleBlockingOnly: () => void
  select: (id: string | null) => void
  reset: () => void
}

const initialState = {
  group: 'all' as GroupFilter,
  status: 'all' as StatusFilter,
  sort: 'risk' as SortKey,
  blockingOnly: false,
  selectedId: null as string | null,
}

export const useTriageStore = create<TriageState>()(set => ({
  ...initialState,
  setGroup: group => set({ group }),
  setStatus: status => set({ status }),
  setSort: sort => set({ sort }),
  toggleBlockingOnly: () => set(state => ({ blockingOnly: !state.blockingOnly })),
  select: selectedId => set({ selectedId }),
  reset: () => set(initialState),
}))
