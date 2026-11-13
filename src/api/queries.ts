import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchFailures, updateFailure } from './failures'
import type { Failure, FailurePatch, Status } from '../types'
import { RUN_ID } from '../data/mockFailures'
import { recordKey, useNotesStore } from '../store/notesStore'

export const failuresKey = ['failures'] as const

export function useFailures() {
  return useQuery({
    queryKey: failuresKey,
    queryFn: fetchFailures,
    staleTime: 60_000,
  })
}

interface UpdateVars {
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
    mutationFn: ({ id, patch }) => updateFailure(id, patch),

    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: failuresKey })
      const previous = queryClient.getQueryData<Failure[]>(failuresKey)
      queryClient.setQueryData<Failure[]>(failuresKey, old => old?.map(f => (f.id === id ? { ...f, ...patch } : f)))
      const from = previous?.find(f => f.id === id)?.status
      return { previous, from }
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(failuresKey, context.previous)
      }
    },

    // Only confirmed status changes go into the history. A rolled-back change never happened.
    onSuccess: (_failure, { id, patch }, context) => {
      if (patch.status && context?.from && context.from !== patch.status) {
        useNotesStore.getState().recordStatusChange(recordKey(RUN_ID, id), context.from, patch.status)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: failuresKey })
    },
  })
}
