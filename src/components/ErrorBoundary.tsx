import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  /** Rendered instead of the children after an error. Call reset to try the children again. */
  fallback: (props: { error: Error; reset: () => void }) => ReactNode
  /** When any of these change, a failed boundary resets by itself (for example a new selection). */
  resetKeys?: unknown[]
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

// React still needs a class for error boundaries. Each region (list, detail) gets its own, so a crash in
// one leaves the other usable.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // A real app would report this. The prototype logs it.
    console.error('Caught by ErrorBoundary:', error, info.componentStack)
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (!this.state.error) return
    const a = previous.resetKeys ?? []
    const b = this.props.resetKeys ?? []
    if (a.length !== b.length || a.some((key, i) => !Object.is(key, b[i]))) this.reset()
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) return this.props.fallback({ error: this.state.error, reset: this.reset })
    return this.props.children
  }
}
