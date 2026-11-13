import { useEffect, useMemo, useState } from 'react'
import { useFailures, useUpdateFailure } from './api/queries'
import { DetailPanel, type DetailPanelProps } from './components/DetailPanel'
import { FailureList } from './components/FailureList'
import { FilterBar } from './components/FilterBar'
import { Header } from './components/Header'
import { OverviewCharts } from './components/OverviewCharts'
import { CommandPalette } from './components/CommandPalette'
import { DetailSheet } from './components/DetailSheet'
import { useDetailLayout } from './hooks/useDetailLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RegionError } from './components/RegionError'
import { SkeletonCharts, SkeletonList } from './components/SkeletonList'
import { EmptyFilters } from './components/EmptyFilters'
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
    clearFilters,
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

  // Narrow screens show the detail in a bottom sheet, opened by a tap. With reduced motion it sits
  // below the list instead, and reveal() scrolls to it. See useDetailLayout.
  const { layout, reveal } = useDetailLayout()
  const [sheetOpen, setSheetOpen] = useState(false)
  const showSheet = layout === 'sheet' && sheetOpen && selected !== null

  // Widening the window past the breakpoint closes the sheet, so narrowing again does not reopen it.
  // Adjusted during render rather than in an effect, which would cost an extra render.
  const [previousLayout, setPreviousLayout] = useState(layout)
  if (layout !== previousLayout) {
    setPreviousLayout(layout)
    if (layout !== 'sheet') setSheetOpen(false)
  }

  function handleSelect(id: string) {
    select(id)
    if (layout === 'sheet') setSheetOpen(true)
    else reveal()
  }

  // From the command palette. If the current filters hide the failure, clear them so the jump sticks.
  function jumpTo(id: string) {
    if (!visible.some(f => f.id === id)) clearFilters()
    handleSelect(id)
  }

  const detailProps: DetailPanelProps = {
    failure: selected,
    runStart: runById(runId)?.start,
    pending: mutation.isPending,
    error: mutation.isError ? 'That change didn’t save. It has been rolled back, so try again.' : null,
    onStatus: nextStatus => {
      if (selected) mutation.mutate({ runId, id: selected.id, patch: { status: nextStatus } })
    },
    record,
    onNote: note => {
      if (selectedKey) setNote(selectedKey, note)
    },
    onAssign: patch => {
      if (selected) mutation.mutate({ runId, id: selected.id, patch })
    },
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <section className="flex min-w-0 flex-col gap-10">
          <Header
            runId={runId}
            onRun={setRun}
            failures={isPending || isError ? undefined : failures}
            actions={<CommandPalette failures={failures} onJump={jumpTo} />}
          />

          {isPending ? <SkeletonCharts /> : !isError && <OverviewCharts failures={failures} />}

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

          <ErrorBoundary
            resetKeys={[runId]}
            fallback={({ reset }) => (
              <RegionError
                title="The list hit an error."
                actions={
                  <Button
                    variant="solid"
                    onClick={() => {
                      reset()
                      refetch()
                    }}
                  >
                    Reload the list
                  </Button>
                }
              >
                Your filters and notes are safe. Reloading fetches this run again.
              </RegionError>
            )}
          >
            {isPending ? (
              <SkeletonList />
            ) : isError ? (
              <RegionError
                title="Couldn’t load this run."
                actions={
                  <Button variant="solid" onClick={() => refetch()}>
                    Try again
                  </Button>
                }
              >
                The run service did not answer. Your filters and notes are kept.
              </RegionError>
            ) : (
              <FailureList
                failures={visible}
                selectedId={selectedId}
                onSelect={handleSelect}
                empty={
                  <EmptyFilters
                    total={failures.length}
                    group={group}
                    status={status}
                    blockingOnly={blockingOnly}
                    mine={mine}
                    onClearGroup={() => setGroup('all')}
                    onClearStatus={() => setStatus('all')}
                    onClearBlocking={toggleBlockingOnly}
                    onClearMine={toggleMine}
                    onClearAll={clearFilters}
                  />
                }
              />
            )}
          </ErrorBoundary>
        </section>

        {layout !== 'sheet' && <SafeDetailPanel {...detailProps} onClear={() => select(null)} />}
      </div>

      {layout === 'sheet' && (
        <DetailSheet open={showSheet} onOpenChange={setSheetOpen} title={selected?.part ?? 'Failure detail'}>
          <SafeDetailPanel {...detailProps} className="border-0" onClear={() => setSheetOpen(false)} />
        </DetailSheet>
      )}
    </main>
  )
}

// The detail panel inside its own error boundary. Choosing another failure resets it.
function SafeDetailPanel({ onClear, ...props }: DetailPanelProps & { onClear: () => void }) {
  return (
    <ErrorBoundary
      resetKeys={[props.failure?.id]}
      fallback={({ reset }) => (
        <RegionError
          title="This failure couldn’t be shown."
          actions={
            <>
              <Button variant="solid" onClick={onClear}>
                Clear selection
              </Button>
              <Button variant="outline" onClick={reset}>
                Try again
              </Button>
            </>
          }
        >
          The rest of the run still works. Pick another failure from the list.
        </RegionError>
      )}
    >
      <DetailPanel {...props} />
    </ErrorBoundary>
  )
}
