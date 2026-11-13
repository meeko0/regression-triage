import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import App from './App'
import { MOCK_FAILURES } from './data/mockFailures'
import { sortFailures } from './lib/triage'

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
    expect(within(failuresStat).getByText(String(MOCK_FAILURES.length))).toBeInTheDocument()
  })

  it('lists every failure as an option', async () => {
    renderApp()
    const options = await screen.findAllByRole('option')
    expect(options).toHaveLength(MOCK_FAILURES.length)
  })

  it('selects a failure when its row is clicked and shows its detail', async () => {
    const user = userEvent.setup()
    renderApp()

    const target = sortFailures(MOCK_FAILURES, 'risk')[0]
    const row = await screen.findByRole('option', { name: new RegExp(escapeRegExp(target.part)) })
    await user.click(row)

    const detail = screen.getByRole('complementary', { name: /failure detail/i })
    expect(within(detail).getByRole('heading', { name: target.part })).toBeInTheDocument()
    expect(within(detail).getByText(target.suggestedAction)).toBeInTheDocument()
  })

  it('filters the list when a status chip is pressed', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findAllByRole('option')

    await user.click(screen.getByRole('button', { name: /^resolved/i }))

    const resolvedCount = MOCK_FAILURES.filter(f => f.status === 'resolved').length
    await waitFor(() => {
      expect(screen.getAllByRole('option')).toHaveLength(resolvedCount)
    })
  })

  it('moves the selection with the arrow keys', async () => {
    const user = userEvent.setup()
    renderApp()

    const options = await screen.findAllByRole('option')
    await waitFor(() => expect(options[0]).toHaveAttribute('aria-selected', 'true'))

    await user.keyboard('{ArrowDown}')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
  })
})

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
