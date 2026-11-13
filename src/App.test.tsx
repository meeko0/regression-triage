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
