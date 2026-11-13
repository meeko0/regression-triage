import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchFailures, updateFailure } from './failures'
import type { Failure, FailurePatch, Status } from '../types'
import { recordKey, useNotesStore } from '../store/notesStore'

export const failuresKey = (runId: string) => ['failures', runId] as const

export function useFailures(runId: string) {
  return useQuery({
    queryKey: failuresKey(runId),
    queryFn: () => fetchFailures(runId),
    staleTime: 60_000,
  })
}

interface UpdateVars {
  runId: string
  id: string
  patch: FailurePatch
}

interface UpdateContext {
  previous: Failure[] | undefined
  from: Status | undefined
}

/** Changes status, owner, or due date. The change shows at once and rolls back if the server rejects it. */
export function useUpdateFailure() {
  const queryClient = useQueryClient()

  return useMutation<Failure, Error, UpdateVars, UpdateContext>({
    mutationFn: ({ runId, id, patch }) => updateFailure(runId, id, patch),

    onMutate: async ({ runId, id, patch }) => {
      await queryClient.cancelQueries({ queryKey: failuresKey(runId) })
      const previous = queryClient.getQueryData<Failure[]>(failuresKey(runId))
      queryClient.setQueryData<Failure[]>(failuresKey(runId), old => old?.map(f => (f.id === id ? { ...f, ...patch } : f)))
      const from = previous?.find(f => f.id === id)?.status
      return { previous, from }
    },

    onError: (_error, { runId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(failuresKey(runId), context.previous)
      }
    },

    // Only confirmed status changes go into the history. A rolled-back change never happened.
    onSuccess: (_failure, { runId, id, patch }, context) => {
      if (patch.status && context?.from && context.from !== patch.status) {
        useNotesStore.getState().recordStatusChange(recordKey(runId, id), context.from, patch.status)
      }
    },

    onSettled: (_data, _error, { runId }) => {
      queryClient.invalidateQueries({ queryKey: failuresKey(runId) })
    },
  })
}
