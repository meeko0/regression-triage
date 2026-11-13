import { useEffect, useMemo } from 'react'
import { useFailures, useUpdateStatus } from './api/queries'
import { DetailPanel } from './components/DetailPanel'
import { FailureList } from './components/FailureList'
import { FilterBar } from './components/FilterBar'
import { Header } from './components/Header'
import { Button } from './components/ui/Button'
import { applyFilters, sortFailures } from './lib/triage'
import { useTriageStore } from './store/triageStore'

export default function App() {
  const { data: failures = [], isPending, isError, refetch } = useFailures()
  const mutation = useUpdateStatus()

  const { group, status, sort, blockingOnly, selectedId, setGroup, setStatus, setSort, toggleBlockingOnly, select } =
    useTriageStore()

  const visible = useMemo(
    () => sortFailures(applyFilters(failures, { group, status, blockingOnly }), sort),
    [failures, group, status, blockingOnly, sort],
  )

  const selected = failures.find(f => f.id === selectedId) ?? null

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
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
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

  if (isPending) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="font-display text-3xl font-bold" role="status">
          Loading the run…
        </p>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="flex h-full flex-col items-center justify-center gap-4">
        <p className="font-display text-3xl font-bold">Couldn’t load this run.</p>
        <Button variant="solid" onClick={() => refetch()}>
          Try again
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <section className="flex min-w-0 flex-col gap-10">
          <Header failures={failures} />

          <FilterBar
            failures={failures}
            group={group}
            status={status}
            sort={sort}
            blockingOnly={blockingOnly}
            onGroup={setGroup}
            onStatus={setStatus}
            onSort={setSort}
            onToggleBlocking={toggleBlockingOnly}
          />

          <FailureList failures={visible} selectedId={selectedId} onSelect={handleSelect} />
        </section>

        <DetailPanel
          failure={selected}
          pending={mutation.isPending}
          error={mutation.isError ? 'That change didn’t save. It has been rolled back, so try again.' : null}
          onStatus={nextStatus => {
            if (selected) mutation.mutate({ id: selected.id, status: nextStatus })
          }}
        />
      </div>
    </main>
  )
}
