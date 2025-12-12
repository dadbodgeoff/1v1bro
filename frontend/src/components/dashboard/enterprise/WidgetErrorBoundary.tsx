/**
 * WidgetErrorBoundary - Enterprise Error Boundary for Dashboard Widgets
 * 
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Each widget is wrapped independently so one failure doesn't break the entire dashboard.
 * 
 * Features:
 * - Widget-specific error identification via widgetName prop
 * - Fallback UI with error message and retry button
 * - Retry count tracking (max 3 retries before showing support message)
 * - Critical widget handling with prominent error display
 * - Error logging to telemetry service
 * - Accessible error states with ARIA announcements
 * 
 * Props:
 * @param widgetName - Name of the widget for error identification
 * @param children - Widget component to render
 * @param onError - Optional callback when error is caught
 * @param fallback - Optional custom fallback UI
 * @param isCritical - Whether this is a critical widget (shows prominent error)
 * @param className - Additional CSS classes
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

export interface WidgetErrorBoundaryProps {
  widgetName: string
  children: ReactNode
  onError?: (error: Error, widgetName: string, errorInfo: ErrorInfo) => void
  fallback?: ReactNode
  isCritical?: boolean
  className?: string
}

interface WidgetErrorState {
  hasError: boolean
  error: Error | null
  retryCount: number
}

const MAX_RETRIES = 3

/**
 * Logs error to telemetry service
 * In production, this would send to an analytics/error tracking service
 */
function logErrorToTelemetry(
  error: Error,
  widgetName: string,
  errorInfo: ErrorInfo,
  retryCount: number
): void {
  // Log to console in development
  console.error(`[WidgetError] ${widgetName}:`, {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    retryCount,
    timestamp: new Date().toISOString(),
  })

  // In production, send to telemetry service
  // Example: telemetryService.logError({ ... })
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<WidgetErrorState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { widgetName, onError } = this.props
    const { retryCount } = this.state

    // Log to telemetry
    logErrorToTelemetry(error, widgetName, errorInfo, retryCount)

    // Call optional error callback
    if (onError) {
      onError(error, widgetName, errorInfo)
    }
  }

  handleRetry = (): void => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }))
  }

  render(): ReactNode {
    const { hasError, error, retryCount } = this.state
    const { widgetName, children, fallback, isCritical, className } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      const hasExceededRetries = retryCount >= MAX_RETRIES

      // Critical widget error - prominent display
      if (isCritical) {
        return (
          <div
            className={`p-6 bg-red-500/10 border border-red-500/20 rounded-xl ${className || ''}`}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <CriticalErrorIcon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-neutral-400 mb-4 max-w-xs">
                {hasExceededRetries
                  ? `We're having trouble loading ${widgetName}. Please contact support if this continues.`
                  : `Failed to load ${widgetName}. Please try again.`}
              </p>
              {hasExceededRetries ? (
                <a
                  href="mailto:support@1v1bro.com"
                  className="px-4 py-2 bg-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Contact Support
                </a>
              ) : (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Try Again
                </button>
              )}
              {error && (
                <p className="mt-3 text-xs text-neutral-500 font-mono truncate max-w-full">
                  {error.message}
                </p>
              )}
            </div>
          </div>
        )
      }

      // Standard widget error - compact display
      return (
        <div
          className={`p-5 bg-[#111111] border border-white/[0.06] rounded-xl ${className || ''}`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-10 h-10 mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
              <ErrorIcon className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm text-neutral-400 mb-1">
              {hasExceededRetries
                ? 'Unable to load widget'
                : 'Something went wrong'}
            </p>
            <p className="text-xs text-neutral-500 mb-3">
              {hasExceededRetries
                ? 'Please refresh the page or contact support'
                : `${widgetName} failed to load`}
            </p>
            {hasExceededRetries ? (
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 bg-white/[0.06] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] transition-colors"
                >
                  Refresh Page
                </button>
                <a
                  href="mailto:support@1v1bro.com"
                  className="px-3 py-1.5 bg-white/[0.06] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] transition-colors"
                >
                  Get Help
                </a>
              </div>
            ) : (
              <button
                onClick={this.handleRetry}
                className="px-3 py-1.5 bg-white/[0.06] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] transition-colors flex items-center gap-1.5"
              >
                <RetryIcon className="w-3.5 h-3.5" />
                Retry ({MAX_RETRIES - retryCount} left)
              </button>
            )}
          </div>
        </div>
      )
    }

    return children
  }
}

// Icon Components
function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

function CriticalErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function RetryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

export default WidgetErrorBoundary
