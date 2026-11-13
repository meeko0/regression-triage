import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import App from './App'
import { MOCK_FAILURES, RUNS } from './data/mockFailures'
import { isOverdue, sortFailures } from './lib/triage'
import { setClock } from './lib/dates'
import { CURRENT_USER_ID } from './data/team'
import { startUrlSync } from './store/urlSync'
import { useTriageStore } from './store/triageStore'
import { failNextFetch } from './api/failures'
import { NOTES_STORAGE_KEY } from './store/notesStore'

const listOptions = () => within(screen.getByRole('listbox', { name: 'Failures' })).getAllByRole('option')
const findListOptions = async () => within(await screen.findByRole('listbox', { name: 'Failures' })).findAllByRole('option')

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('loads the run and shows the header counts', async () => {
    renderApp()

    expect(await screen.findByRole('heading', { name: /regression/i })).toBeInTheDocument()
    const failuresStat = screen.getByText('Failures').parentElement!
    expect(await within(failuresStat).findByText(String(MOCK_FAILURES.length))).toBeInTheDocument()
  })

  it('lists every failure as an option', async () => {
    renderApp()
    const options = await findListOptions()
    expect(options).toHaveLength(MOCK_FAILURES.length)
  })

  it('selects a failure when its row is clicked and shows its detail', async () => {
    const user = userEvent.setup()
    renderApp()

    const target = sortFailures(MOCK_FAILURES, 'risk')[0]
    const row = await within(await screen.findByRole('listbox', { name: 'Failures' })).findByRole('option', { name: new RegExp(escapeRegExp(target.part)) })
    await user.click(row)

    const detail = screen.getByRole('complementary', { name: /failure detail/i })
    expect(within(detail).getByRole('heading', { name: target.part })).toBeInTheDocument()
    expect(within(detail).getByText(target.suggestedAction)).toBeInTheDocument()
  })

  it('filters the list when a status chip is pressed', async () => {
    const user = userEvent.setup()
    renderApp()
    await findListOptions()

    await user.click(screen.getByRole('button', { name: /^resolved/i }))

    const resolvedCount = MOCK_FAILURES.filter(f => f.status === 'resolved').length
    await waitFor(() => {
      expect(listOptions()).toHaveLength(resolvedCount)
    })
  })

  it('moves the selection with the arrow keys', async () => {
    const user = userEvent.setup()
    renderApp()

    const options = await findListOptions()
    await waitFor(() => expect(options[0]).toHaveAttribute('aria-selected', 'true'))

    await user.keyboard('{ArrowDown}')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('opens the view described by the URL and keeps the URL in step', async () => {
    const user = userEvent.setup()
    const resolved = sortFailures(MOCK_FAILURES.filter(f => f.status === 'resolved'), 'risk')
    window.history.replaceState(null, '', `/?status=resolved&id=${resolved[1].id}`)
    const stop = startUrlSync()
    renderApp()

    await waitFor(() => expect(listOptions()).toHaveLength(resolved.length))
    expect(listOptions()[1]).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('button', { name: /^newest/i }))
    expect(window.location.search).toContain('sort=newest')
    stop()
  })

  it('labels overdue failures, filters to mine, and assigns an owner', async () => {
    const user = userEvent.setup()
    setClock(new Date(2026, 10, 13, 9, 0))
    try {
      renderApp()
      await findListOptions()

      const list = screen.getByRole('listbox', { name: 'Failures' })
      const overdue = MOCK_FAILURES.filter(f => isOverdue(f, '2026-11-13'))
      expect(overdue.length).toBeGreaterThan(0)
      expect(within(list).getAllByText('Overdue')).toHaveLength(overdue.length)

      await user.click(screen.getByRole('button', { name: /^mine/i }))
      const mine = MOCK_FAILURES.filter(f => f.owner === CURRENT_USER_ID)
      await waitFor(() => expect(listOptions()).toHaveLength(mine.length))
      await user.click(screen.getByRole('button', { name: /^mine/i }))

      const detail = screen.getByRole('complementary', { name: /failure detail/i })
      await user.selectOptions(within(detail).getByLabelText('Owner'), 'mei')
      await waitFor(() => expect(listOptions().find(o => o.getAttribute('aria-selected') === 'true')).toHaveTextContent('Mei Lindqvist'))
    } finally {
      setClock()
    }
  })

  it('switches runs, updates the run ID, and resets the selection', async () => {
    const user = userEvent.setup()
    renderApp()
    await findListOptions()
    expect(screen.getByTestId('run-id')).toHaveTextContent(RUNS[0].id)

    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(listOptions()[2]).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('button', { name: /^nov 10/i }))
    expect(screen.getByTestId('run-id')).toHaveTextContent(RUNS[2].id)
    await waitFor(() => expect(listOptions()).toHaveLength(RUNS[2].count))
    // The selection resets, then falls back to the first row of the new run.
    expect(listOptions()[0]).toHaveAttribute('aria-selected', 'true')
  })

  describe('loading, empty, and error states', () => {
    it('shows skeleton rows while the run loads', async () => {
      renderApp()
      expect(screen.getByRole('status', { name: 'Loading the run' })).toBeInTheDocument()
      expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThan(0)
      await findListOptions()
      expect(screen.queryByTestId('skeleton-row')).not.toBeInTheDocument()
    })

    it('explains which filters hide the results and clears them', async () => {
      const user = userEvent.setup()
      renderApp()
      await findListOptions()

      // Resolved failures are never blocking, so these two together hide everything.
      await user.click(screen.getByRole('button', { name: /^resolved/i }))
      await user.click(screen.getByRole('button', { name: /^blocking only/i }))

      expect(await screen.findByText('Nothing matches these filters.')).toBeInTheDocument()
      expect(screen.getByText(new RegExp(`hide all ${MOCK_FAILURES.length} failures`))).toBeInTheDocument()
      const active = screen.getByRole('list', { name: 'Active filters' })
      expect(within(active).getAllByRole('button').map(b => b.textContent)).toEqual(['Status: Resolved×', 'Blocking only×'])

      await user.click(within(active).getByRole('button', { name: 'Remove filter Blocking only' }))
      await waitFor(() =>
        expect(listOptions()).toHaveLength(MOCK_FAILURES.filter(f => f.status === 'resolved').length),
      )

      await user.click(screen.getByRole('button', { name: /^blocking only/i }))
      await user.click(await screen.findByRole('button', { name: 'Clear all filters' }))
      await waitFor(() => expect(listOptions()).toHaveLength(MOCK_FAILURES.length))
    })

    it('shows an error with a retry when the run fails to load', async () => {
      const user = userEvent.setup()
      failNextFetch()
      renderApp()

      expect(await screen.findByText('Couldn’t load this run.')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await findListOptions()).toHaveLength(MOCK_FAILURES.length)
    })
  })

  describe('command palette', () => {
    it('opens with Ctrl+K, jumps to a failure, and returns focus to the trigger', async () => {
      const user = userEvent.setup()
      renderApp()
      await findListOptions()
      const trigger = screen.getByRole('button', { name: /jump to/i })

      await user.keyboard('{Control>}k{/Control}')
      const dialog = await screen.findByRole('dialog', { name: 'Command palette' })
      const input = within(dialog).getByRole('combobox')
      expect(input).toHaveFocus()

      const target = MOCK_FAILURES[9]
      await user.type(input, target.id)
      const options = within(dialog).getAllByRole('option')
      expect(options[0]).toHaveTextContent(target.id)
      expect(input).toHaveAttribute('aria-activedescendant', options[0].id)

      await user.keyboard('{Enter}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(trigger).toHaveFocus()
      const selected = listOptions().find(o => o.getAttribute('aria-selected') === 'true')
      expect(selected).toHaveTextContent(target.part)
    })

    it('moves with the arrow keys, wraps, and closes on Escape', async () => {
      const user = userEvent.setup()
      renderApp()
      await findListOptions()
      const trigger = screen.getByRole('button', { name: /jump to/i })
      await user.click(trigger)

      const dialog = await screen.findByRole('dialog', { name: 'Command palette' })
      const input = within(dialog).getByRole('combobox')
      await user.type(input, 'sort by')
      const options = within(dialog).getAllByRole('option')
      expect(options).toHaveLength(2)

      await user.keyboard('{ArrowDown}')
      expect(options[1]).toHaveAttribute('aria-selected', 'true')
      await user.keyboard('{ArrowDown}')
      expect(options[0]).toHaveAttribute('aria-selected', 'true')
      await user.keyboard('{ArrowUp}')
      expect(options[1]).toHaveAttribute('aria-selected', 'true')

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(trigger).toHaveFocus()
    })

    it('changes a filter and switches runs', async () => {
      const user = userEvent.setup()
      renderApp()
      await findListOptions()

      await user.keyboard('{Control>}k{/Control}')
      await user.type(await screen.findByRole('combobox'), 'only resolved{Enter}')
      expect(useTriageStore.getState().status).toBe('resolved')

      await user.keyboard('{Control>}k{/Control}')
      await user.type(await screen.findByRole('combobox'), 'nov 10{Enter}')
      expect(screen.getByTestId('run-id')).toHaveTextContent(RUNS[2].id)
    })

    it('clears filters that would hide the failure it jumps to', async () => {
      const user = userEvent.setup()
      renderApp()
      await findListOptions()
      useTriageStore.getState().setStatus('resolved')
      const hidden = MOCK_FAILURES.find(f => f.status === 'open')!

      await user.keyboard('{Control>}k{/Control}')
      await user.type(await screen.findByRole('combobox'), `${hidden.id}{Enter}`)
      expect(useTriageStore.getState().status).toBe('all')
      expect(useTriageStore.getState().selectedId).toBe(hidden.id)
    })
  })

  it('adds a history entry when the status changes, and saves the note', async () => {
    const user = userEvent.setup()
    renderApp()
    await findListOptions()
    const detail = screen.getByRole('complementary', { name: /failure detail/i })

    const action = within(detail).queryByRole('button', { name: 'Mark resolved' }) ?? within(detail).getByRole('button', { name: 'Reopen' })
    const label = action.textContent === 'Reopen' ? /resolved to open/i : /to resolved/i
    await user.click(action)
    expect(await within(detail).findByText(label)).toBeInTheDocument()

    await user.type(within(detail).getByLabelText('Note'), 'Checked with closures')
    expect(localStorage.getItem(NOTES_STORAGE_KEY)).toContain('Checked with closures')
  })
})

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
