import { useEffect, useId, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { ErrorGroup, Failure, Status } from '../types'
import { RUNS } from '../data/mockFailures'
import { useTriageStore } from '../store/triageStore'
import { cn } from '../lib/utils'
import { runLabel } from '../lib/labels'
import { SECTIONS, searchCommands, type Command } from '../lib/commands'

const GROUPS: ErrorGroup[] = ['Interference', 'Constraints', 'Mass', 'References']
const STATUSES: Status[] = ['open', 'investigating', 'resolved']
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface CommandPaletteProps {
  failures: Failure[]
  onJump: (failureId: string) => void
}

export function CommandPalette({ failures, onJump }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()

  // Cmd+K on macOS, Ctrl+K elsewhere. Works from anywhere, including text fields.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const commands = useMemo<Command[]>(() => {
    const s = useTriageStore.getState
    return [
      ...failures.map<Command>(f => ({
        id: `failure-${f.id}`,
        section: 'Failures',
        label: `${f.id} ${f.part}`,
        keywords: `${f.group} ${f.assembly} ${f.status}`,
        hint: f.group,
        run: () => onJump(f.id),
      })),
      { id: 'group-all', section: 'Filters', label: 'Show all types', keywords: 'filter group clear', run: () => s().setGroup('all') },
      ...GROUPS.map<Command>(g => ({
        id: `group-${g}`,
        section: 'Filters',
        label: `Show only ${g}`,
        keywords: 'filter type group',
        run: () => s().setGroup(g),
      })),
      { id: 'status-all', section: 'Filters', label: 'Show every status', keywords: 'filter status all', run: () => s().setStatus('all') },
      ...STATUSES.map<Command>(st => ({
        id: `status-${st}`,
        section: 'Filters',
        label: `Show only ${capitalize(st)}`,
        keywords: 'filter status',
        run: () => s().setStatus(st),
      })),
      { id: 'blocking', section: 'Filters', label: 'Toggle blocking only', keywords: 'filter high risk release', run: () => s().toggleBlockingOnly() },
      { id: 'mine', section: 'Filters', label: 'Toggle mine', keywords: 'filter owner assigned me', run: () => s().toggleMine() },
      { id: 'sort-risk', section: 'Filters', label: 'Sort by risk', keywords: 'order', run: () => s().setSort('risk') },
      { id: 'sort-newest', section: 'Filters', label: 'Sort by newest', keywords: 'order time detected', run: () => s().setSort('newest') },
      { id: 'clear', section: 'Filters', label: 'Clear all filters', keywords: 'reset', run: () => s().clearFilters() },
      ...RUNS.map<Command>(r => ({
        id: `run-${r.id}`,
        section: 'Runs',
        label: `Switch to run ${runLabel(r.id)}`,
        keywords: `${r.id} night nightly`,
        hint: r.id,
        run: () => s().setRun(r.id),
      })),
    ]
  }, [failures, onJump])

  const results = useMemo(() => searchCommands(commands, query), [commands, query])
  const activeIndex = Math.min(active, Math.max(0, results.length - 1))
  const activeCommand = results[activeIndex]
  const optionId = (c: Command) => `${listId}-${c.id}`

  // Keep the active option visible while moving with the keyboard.
  useEffect(() => {
    if (!activeCommand) return
    document.getElementById(`${listId}-${activeCommand.id}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeCommand, listId])

  function setOpenAndReset(next: boolean) {
    setOpen(next)
    if (!next) {
      setQuery('')
      setActive(0)
    }
  }

  function choose(command: Command) {
    setOpenAndReset(false)
    command.run()
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    const count = results.length
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (count === 0) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((activeIndex + step + count) % count)
    } else if (event.key === 'Home' && count) {
      event.preventDefault()
      setActive(0)
    } else if (event.key === 'End' && count) {
      event.preventDefault()
      setActive(count - 1)
    } else if (event.key === 'Enter' && activeCommand) {
      event.preventDefault()
      choose(activeCommand)
    }
  }

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const shortcut = isMac ? '⌘K' : 'Ctrl K'

  return (
    <Dialog.Root open={open} onOpenChange={setOpenAndReset}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-keyshortcuts="Control+K Meta+K"
          className="group label-micro flex h-8 items-center gap-3 border border-primary px-3 text-primary hover:bg-primary hover:text-paper"
        >
          Jump to
          <kbd className="font-sans text-muted group-hover:text-paper">{shortcut}</kbd>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-primary/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 flex max-h-[70vh] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 flex-col border border-primary bg-paper shadow-[8px_8px_0_0_var(--color-accent)]"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <input
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeCommand ? optionId(activeCommand) : undefined}
            aria-autocomplete="list"
            aria-label="Search failures, filters, and runs"
            placeholder="Jump to a failure, change a filter, or switch runs"
            value={query}
            onChange={event => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKeyDown}
            className="h-14 w-full border-b border-primary bg-paper px-5 text-body placeholder:text-muted focus-visible:outline-offset-[-3px]"
          />

          <div id={listId} role="listbox" aria-label="Results" className="overflow-y-auto py-2">
            {results.length === 0 && (
              <p className="px-5 py-6 text-body-sm text-muted" role="status">
                Nothing matches “{query}”.
              </p>
            )}
            {SECTIONS.map(section => {
              const items = results.filter(c => c.section === section)
              if (items.length === 0) return null
              return (
                <div key={section} role="group" aria-labelledby={`${listId}-${section}`}>
                  <p id={`${listId}-${section}`} role="presentation" className="label-micro px-5 pb-1 pt-3 text-muted">
                    {section}
                  </p>
                  {items.map(command => {
                    const isActive = command === activeCommand
                    return (
                      <div
                        key={command.id}
                        id={optionId(command)}
                        role="option"
                        aria-selected={isActive}
                        onMouseMove={() => setActive(results.indexOf(command))}
                        onClick={() => choose(command)}
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-4 px-5 py-2 text-body-sm',
                          isActive ? 'bg-primary text-paper' : 'text-primary',
                        )}
                      >
                        <span className="truncate">{command.label}</span>
                        {command.hint && (
                          <span className={cn('shrink-0 text-caption', isActive ? 'text-paper/75' : 'text-muted')}>
                            {command.hint}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <p className="flex gap-4 border-t border-line px-5 py-2 text-caption text-muted" aria-hidden="true">
            <span>↑ ↓ to move</span>
            <span>Enter to choose</span>
            <span>Esc to close</span>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
