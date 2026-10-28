import { Component, type ErrorInfo, type ReactNode } from 'react'
import ErrorPage from './ErrorPage'

interface State { failed: boolean }

/** Catches render errors anywhere below it and shows the 500 screen instead of a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }
  static getDerivedStateFromError(): State { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Unhandled UI error', error, info.componentStack) }
  render() {
    if (this.state.failed) return <ErrorPage code={500} title="Something went wrong" message="An unexpected error occurred. Please reload the page and try again." homeLabel="Back to home" />
    return this.props.children
  }
}
