import { useEffect, useMemo } from 'react'
import { useFailures, useUpdateFailure } from './api/queries'
import { DetailPanel } from './components/DetailPanel'
import { FailureList } from './components/FailureList'
import { FilterBar } from './components/FilterBar'
import { Header } from './components/Header'
import { OverviewCharts } from './components/OverviewCharts'
import { Button } from './components/ui/Button'
import { applyFilters, sortFailures } from './lib/triage'
import { useTriageStore } from './store/triageStore'
import { recordKey, useFailureRecord, useNotesStore } from './store/notesStore'
import { runById } from './data/mockFailures'

export default function App() {
  const runId = useTriageStore(state => state.runId)
  const setRun = useTriageStore(state => state.setRun)
  const { data: failures = [], isPending, isError, refetch } = useFailures(runId)
  const mutation = useUpdateFailure()

  const {
    group,
    status,
    sort,
    blockingOnly,
    mine,
    selectedId,
    setGroup,
    setStatus,
    setSort,
    toggleBlockingOnly,
    toggleMine,
    select,
  } = useTriageStore()

  const visible = useMemo(
    () => sortFailures(applyFilters(failures, { group, status, blockingOnly, mine }), sort),
    [failures, group, status, blockingOnly, mine, sort],
  )

  const selected = failures.find(f => f.id === selectedId) ?? null
  const selectedKey = selected ? recordKey(runId, selected.id) : null
  const record = useFailureRecord(selectedKey)
  const setNote = useNotesStore(state => state.setNote)

  // A failed save from another run should not show its error here.
  const resetMutation = mutation.reset
  useEffect(() => resetMutation(), [runId, resetMutation])

  // Keep the selection inside the visible list. Pick the first row if nothing is selected.
  useEffect(() => {
    if (visible.length === 0) return
    if (!visible.some(f => f.id === selectedId)) {
      select(visible[0].id)
    }
  }, [visible, selectedId, select])

  // Arrow keys and J/K move through the visible list.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) {
        return
      }
      // Leave keys alone while a dialog (About, command palette) has focus.
      if (target?.closest?.('[role="dialog"]')) return
      const forward = event.key === 'ArrowDown' || event.key === 'j'
      const back = event.key === 'ArrowUp' || event.key === 'k'
      if (!forward && !back) return
      if (visible.length === 0) return

      event.preventDefault()
      const index = visible.findIndex(f => f.id === selectedId)
      const next = index === -1 ? 0 : Math.min(visible.length - 1, Math.max(0, index + (forward ? 1 : -1)))
      select(visible[next].id)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible, selectedId, select])

  // On small screens the detail panel sits below the list, so bring it into view after a tap.
  function handleSelect(id: string) {
    select(id)
    const narrow = typeof window.matchMedia === "function" && window.matchMedia("(max-width: 1023px)").matches
    if (narrow) {
      document.getElementById("failure-detail")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <section className="flex min-w-0 flex-col gap-10">
          <Header runId={runId} onRun={setRun} failures={isPending || isError ? undefined : failures} />

          {!isPending && !isError && <OverviewCharts failures={failures} />}

          <FilterBar
            failures={failures}
            group={group}
            status={status}
            sort={sort}
            blockingOnly={blockingOnly}
            mine={mine}
            onGroup={setGroup}
            onStatus={setStatus}
            onSort={setSort}
            onToggleBlocking={toggleBlockingOnly}
            onToggleMine={toggleMine}
          />

          {isPending ? (
            <p className="font-display text-display-sm font-bold" role="status">
              Loading the run…
            </p>
          ) : isError ? (
            <div className="flex flex-col items-start gap-4 border border-risk-high p-8">
              <p className="font-display text-display-sm font-bold">Couldn’t load this run.</p>
              <Button variant="solid" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <FailureList failures={visible} selectedId={selectedId} onSelect={handleSelect} />
          )}
        </section>

        <DetailPanel
          failure={selected}
          runStart={runById(runId)?.start}
          pending={mutation.isPending}
          error={mutation.isError ? 'That change didn’t save. It has been rolled back, so try again.' : null}
          onStatus={nextStatus => {
            if (selected) mutation.mutate({ runId, id: selected.id, patch: { status: nextStatus } })
          }}
          record={record}
          onNote={note => {
            if (selectedKey) setNote(selectedKey, note)
          }}
          onAssign={patch => {
            if (selected) mutation.mutate({ runId, id: selected.id, patch })
          }}
        />
      </div>
    </main>
  )
}
