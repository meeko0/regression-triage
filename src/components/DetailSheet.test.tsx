import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { NARROW_QUERY, REDUCED_MOTION_QUERY } from '../hooks/useDetailLayout'

function mockMedia(matching: string[]) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: matching.includes(query),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  )
}

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('detail on narrow screens', () => {
  it('opens a bottom sheet on tap and closes it, returning focus to the row', async () => {
    mockMedia([NARROW_QUERY])
    const user = userEvent.setup()
    renderApp()

    const list = await screen.findByRole('listbox', { name: 'Failures' })
    const rows = await within(list).findAllByRole('option')
    // No side panel and no sheet until the user taps.
    expect(screen.queryByRole('complementary', { name: /failure detail/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(rows[2])
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByRole('complementary', { name: /failure detail/i })).toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(rows[2]).toHaveFocus()
  })

  it('falls back to an inline panel and scrolls to it when reduced motion is set', async () => {
    mockMedia([NARROW_QUERY, REDUCED_MOTION_QUERY])
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const user = userEvent.setup()
    renderApp()

    const rows = await within(await screen.findByRole('listbox', { name: 'Failures' })).findAllByRole('option')
    await user.click(rows[3])

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const panel = screen.getByRole('complementary', { name: /failure detail/i })
    expect(scrollIntoView).toHaveBeenCalled()
    expect(scrollIntoView.mock.contexts[0]).toBe(panel)
  })
})
