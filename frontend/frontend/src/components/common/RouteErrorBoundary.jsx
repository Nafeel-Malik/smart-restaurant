import { Component } from 'react'
import Icon from '../ui/Icon'
import AnimatedButton from '../motion/AnimatedButton'

/**
 * Catches unexpected render errors in route content so the app never goes fully blank.
 * Does not catch async/network errors — those should be handled in Redux thunks / UI.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[RouteErrorBoundary]', error, info?.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const message = String(this.state.error?.message || '')
    const isNetworkHint =
      /fetch|network|failed to fetch|load failed|ECONNREFUSED|Cannot reach/i.test(message)

    return (
      <div
        className="motion-ds flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface px-6 py-12 text-center"
        role="alert"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-error">
          <Icon name="error" size={28} />
        </div>
        <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">
          {isNetworkHint ? "Can't reach the server" : 'Something went wrong'}
        </h2>
        <p className="mt-2 max-w-md text-sm text-on-surface-variant">
          {isNetworkHint
            ? 'RestoPro could not connect to the backend. Make sure it is running on port 5001, then refresh.'
            : 'An unexpected error occurred while loading this page. Please refresh and try again.'}
        </p>
        {import.meta.env.DEV && message ? (
          <pre className="mt-4 max-w-lg overflow-x-auto rounded-lg bg-surface-container-high p-3 text-left text-xs text-on-surface-variant">
            {message}
          </pre>
        ) : null}
        <AnimatedButton type="button" className="mt-6" onClick={this.handleRetry}>
          Refresh page
        </AnimatedButton>
      </div>
    )
  }
}
