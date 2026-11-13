import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

let shouldThrow = true
function Fragile() {
  if (shouldThrow) throw new Error('boom')
  return <p>Recovered</p>
}

beforeEach(() => {
  shouldThrow = true
  // React logs caught errors. Keep the test output readable.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

const fallback = ({ error, reset }: { error: Error; reset: () => void }) => (
  <div>
    <p>Failed: {error.message}</p>
    <button onClick={reset}>Retry</button>
  </div>
)

describe('ErrorBoundary', () => {
  it('shows the fallback and recovers when reset', async () => {
    const user = userEvent.setup()
    render(
      <ErrorBoundary fallback={fallback}>
        <Fragile />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Failed: boom')).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })

  it('resets by itself when a reset key changes', () => {
    const { rerender } = render(
      <ErrorBoundary fallback={fallback} resetKeys={['RT-001']}>
        <Fragile />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Failed: boom')).toBeInTheDocument()

    shouldThrow = false
    rerender(
      <ErrorBoundary fallback={fallback} resetKeys={['RT-002']}>
        <Fragile />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })
})
