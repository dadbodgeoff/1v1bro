/**
 * useAnalytics - Analytics and telemetry hook for dashboard
 * 
 * Features:
 * - Event logging interface
 * - Track dashboard_viewed on mount
 * - Track widget_clicked on widget interactions
 * - Track widget_error on error boundary catches
 * - Track matchmaking_started on Find Match
 * - Track action duration and success/failure
 * - Respect user privacy settings
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import { useCallback, useRef, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export interface AnalyticsEvent {
  name: string
  timestamp: Date
  sessionId: string
  visitorId: string  // Persistent ID for same user across visits
  userId?: string
  properties: Record<string, unknown>
}

export type DashboardEventName =
  | 'dashboard_viewed'
  | 'widget_clicked'
  | 'widget_error'
  | 'widget_loaded'
  | 'matchmaking_started'
  | 'notification_clicked'
  | 'command_executed'
  | 'shortcut_used'
  | 'offline_detected'
  | 'reconnected'

export interface DashboardViewedProps {
  source: string
  referrer?: string
}

export interface WidgetClickedProps {
  widget: string
  destination: string
  position?: number
}

export interface WidgetErrorProps {
  widget: string
  error: string
  retryCount: number
  isCritical?: boolean
}

export interface WidgetLoadedProps {
  widget: string
  loadTimeMs: number
  fromCache?: boolean
}

export interface MatchmakingStartedProps {
  category: string
  map?: string
  source: 'hero' | 'command_palette' | 'shortcut'
}

export interface NotificationClickedProps {
  type: string
  notificationId: string
  actionUrl?: string
}

export interface CommandExecutedProps {
  command: string
  source: 'palette' | 'shortcut'
}

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// Get or create persistent visitor ID (survives browser restarts)
// This identifies the same user across multiple visits on the same device
const getVisitorId = (): string => {
  // Use consistent key across all analytics systems
  const key = '1v1bro_visitor_id'
  let visitorId = localStorage.getItem(key)
  if (!visitorId) {
    visitorId = `v_${generateId()}`
    localStorage.setItem(key, visitorId)
  }
  return visitorId
}

// Get or create session ID (resets per browser session/tab)
// This tracks individual browsing sessions
const getSessionId = (): string => {
  // Use consistent key across all analytics systems
  const key = '1v1bro_session_id'
  let sessionId = sessionStorage.getItem(key)
  if (!sessionId) {
    sessionId = `s_${generateId()}`
    sessionStorage.setItem(key, sessionId)
  }
  return sessionId
}

// Event queue for batching
const eventQueue: AnalyticsEvent[] = []
let flushTimeout: ReturnType<typeof setTimeout> | null = null

// Flush events to backend (placeholder - integrate with actual analytics service)
const flushEvents = async () => {
  if (eventQueue.length === 0) return
  
  const events = [...eventQueue]
  eventQueue.length = 0
  
  // In production, send to analytics endpoint
  if (import.meta.env.DEV) {
    console.debug('[Analytics] Flushing events:', events)
  }
  
  // TODO: Send to actual analytics service
  // await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(events) })
}

// Schedule flush
const scheduleFlush = () => {
  if (flushTimeout) return
  flushTimeout = setTimeout(() => {
    flushTimeout = null
    flushEvents()
  }, 5000) // Batch events every 5 seconds
}

export interface UseAnalyticsOptions {
  enabled?: boolean
  trackOnMount?: boolean
  source?: string
}

// Check if running on localhost dev server - skip analytics for local testing
const isLocalhost = (): boolean => {
  const hostname = window.location.hostname
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    window.location.origin.includes('localhost:5173')
  )
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { enabled = true, trackOnMount = false, source = 'dashboard' } = options
  // Disable analytics on localhost to avoid polluting demo/production data
  const isEnabled = enabled && !isLocalhost()
  const user = useAuthStore(state => state.user)
  const sessionId = useRef(getSessionId())
  const visitorId = useRef(getVisitorId())
  const mountTracked = useRef(false)

  // Core track function
  const track = useCallback((
    name: DashboardEventName,
    properties: Record<string, unknown>
  ) => {
    if (!isEnabled) return

    const event: AnalyticsEvent = {
      name,
      timestamp: new Date(),
      sessionId: sessionId.current,
      visitorId: visitorId.current,
      userId: user?.id,
      properties: {
        ...properties,
        source,
      },
    }

    eventQueue.push(event)
    scheduleFlush()

    if (import.meta.env.DEV) {
      console.debug(`[Analytics] ${name}:`, properties)
    }
  }, [isEnabled, user?.id, source])

  // Track dashboard view on mount
  useEffect(() => {
    if (trackOnMount && !mountTracked.current) {
      mountTracked.current = true
      track('dashboard_viewed', { source, referrer: document.referrer })
    }
  }, [trackOnMount, track, source])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (eventQueue.length > 0) {
        flushEvents()
      }
    }
  }, [])

  // Convenience methods
  const trackWidgetClick = useCallback((props: WidgetClickedProps) => {
    track('widget_clicked', { ...props })
  }, [track])

  const trackWidgetError = useCallback((props: WidgetErrorProps) => {
    track('widget_error', { ...props })
  }, [track])

  const trackWidgetLoaded = useCallback((props: WidgetLoadedProps) => {
    track('widget_loaded', { ...props })
  }, [track])

  const trackMatchmakingStarted = useCallback((props: MatchmakingStartedProps) => {
    track('matchmaking_started', { ...props })
  }, [track])

  const trackNotificationClicked = useCallback((props: NotificationClickedProps) => {
    track('notification_clicked', { ...props })
  }, [track])

  const trackCommandExecuted = useCallback((props: CommandExecutedProps) => {
    track('command_executed', { ...props })
  }, [track])

  const trackShortcutUsed = useCallback((shortcut: string) => {
    track('shortcut_used', { shortcut })
  }, [track])

  // Time tracking helper
  const startTimer = useCallback((label: string) => {
    const start = performance.now()
    return {
      end: (success = true, metadata?: Record<string, unknown>) => {
        const duration = Math.round(performance.now() - start)
        track('widget_loaded', {
          widget: label,
          loadTimeMs: duration,
          success,
          ...metadata,
        })
        return duration
      },
    }
  }, [track])

  return {
    track,
    trackWidgetClick,
    trackWidgetError,
    trackWidgetLoaded,
    trackMatchmakingStarted,
    trackNotificationClicked,
    trackCommandExecuted,
    trackShortcutUsed,
    startTimer,
    sessionId: sessionId.current,
    visitorId: visitorId.current,
  }
}
