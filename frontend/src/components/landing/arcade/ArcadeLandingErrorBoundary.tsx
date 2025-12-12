/**
 * ArcadeLandingErrorBoundary - Error boundary for CRT Arcade Landing
 * 
 * Catches errors in child components and displays StaticLandingFallback.
 * Logs errors to analytics for monitoring.
 * 
 * @module landing/arcade/ArcadeLandingErrorBoundary
 * Requirements: 10.1, 10.3, 11.6
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { StaticLandingFallback } from './StaticLandingFallback';
import { ANALYTICS_EVENTS } from './constants';

interface Props {
  children: ReactNode;
  /** Optional fallback component */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class ArcadeLandingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console in development
    console.error('ArcadeLanding Error:', error, errorInfo);

    // Track error in analytics
    this.trackError(error.message);
  }

  private trackError(errorMessage: string): void {
    // Use the analytics service if available
    try {
      // Dynamic import to avoid circular dependencies
      import('@/services/analytics').then(({ trackEvent }) => {
        trackEvent(ANALYTICS_EVENTS.errorBoundaryTriggered, {
          error_message: errorMessage,
        });
      }).catch(() => {
        // Analytics not available, fail silently
      });
    } catch {
      // Fail silently if analytics unavailable
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use StaticLandingFallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <StaticLandingFallback errorMessage={this.state.errorMessage ?? undefined} />;
    }

    return this.props.children;
  }
}

export default ArcadeLandingErrorBoundary;
