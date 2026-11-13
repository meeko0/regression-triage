import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchFailures, updateFailureStatus } from './failures'
import type { Failure, Status } from '../types'
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
  status: Status
}

interface UpdateContext {
  previous: Failure[] | undefined
  from: Status | undefined
}

export function useUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation<Failure, Error, UpdateVars, UpdateContext>({
    mutationFn: ({ id, status }) => updateFailureStatus(id, status),

    // Optimistic update: the row changes immediately, and rolls back if the server rejects it.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: failuresKey })
      const previous = queryClient.getQueryData<Failure[]>(failuresKey)
      queryClient.setQueryData<Failure[]>(failuresKey, old =>
        old?.map(f => (f.id === id ? { ...f, status } : f)),
      )
      const from = previous?.find(f => f.id === id)?.status
      return { previous, from }
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(failuresKey, context.previous)
      }
    },

    // Only confirmed changes go into the status history. A rolled-back change never happened.
    onSuccess: (_failure, { id, status }, context) => {
      if (context?.from && context.from !== status) {
        useNotesStore.getState().recordStatusChange(recordKey(RUN_ID, id), context.from, status)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: failuresKey })
    },
  })
}
