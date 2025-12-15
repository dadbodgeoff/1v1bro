/**
 * AnalyticsProvider - Global analytics context
 * 
 * Integrates basic analytics with enterprise tracking.
 * Automatically tracks page views, performance, clicks, scroll, and errors.
 */

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useEnterpriseAnalytics } from '@/hooks/useEnterpriseAnalytics'
import { API_BASE } from '@/utils/constants'

interface AnalyticsContextValue {
  sessionId: string
  visitorId: string
  trackEvent: (name: string, properties?: Record<string, unknown>) => void
  trackConversion: (type: string, userId?: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

export function useAnalyticsContext() {
  const ctx = useContext(AnalyticsContext)
  if (!ctx) throw new Error('useAnalyticsContext must be used within AnalyticsProvider')
  return ctx
}

interface AnalyticsProviderProps {
  children: ReactNode
  enabled?: boolean
}

// Check if running on localhost dev server - skip analytics for local testing
const isLocalhost = () => {
  const hostname = window.location.hostname
  const port = window.location.port
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    (hostname === 'localhost' && port === '5173') ||
    window.location.origin.includes('localhost:5173')
  )
}

export function AnalyticsProvider({ children, enabled = true }: AnalyticsProviderProps) {
  const location = useLocation()
  const initialized = useRef(false)
  
  // Disable analytics on localhost to avoid polluting demo/production data
  const isEnabled = enabled && !isLocalhost()
  
  const {
    sessionId,
    visitorId,
    trackPageView,
  } = useEnterpriseAnalytics({
    enabled: isEnabled,
    trackPerformance: true,
    trackClicks: true,
    trackScroll: true,
    trackErrors: true,
    heartbeatInterval: 30000,
  })

  // Initialize session on mount
  useEffect(() => {
    if (!isEnabled || initialized.current) return
    initialized.current = true

    const initSession = async () => {
      try {
        const deviceType = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
        const ua = navigator.userAgent
        let browser = 'Other'
        if (ua.includes('Firefox')) browser = 'Firefox'
        else if (ua.includes('Edg')) browser = 'Edge'
        else if (ua.includes('Chrome')) browser = 'Chrome'
        else if (ua.includes('Safari')) browser = 'Safari'

        let os = 'Other'
        if (ua.includes('Windows')) os = 'Windows'
        else if (ua.includes('Mac')) os = 'macOS'
        else if (ua.includes('Linux')) os = 'Linux'
        else if (ua.includes('Android')) os = 'Android'
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

        // Parse UTM params
        const params = new URLSearchParams(window.location.search)

        await fetch(`${API_BASE}/analytics/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            visitor_id: visitorId,
            device_type: deviceType,
            browser,
            os,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            locale: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            referrer: document.referrer || null,
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
          }),
        })
      } catch {
        // Silent fail
      }
    }

    initSession()
  }, [isEnabled, sessionId, visitorId])

  // Track page duration
  const pageStartTime = useRef(Date.now())
  const lastPage = useRef(location.pathname)

  // Track page views on route change - SINGLE tracking path only
  useEffect(() => {
    if (!isEnabled) return

    const page = location.pathname
    
    // Skip if same page (e.g., query param changes)
    if (lastPage.current === page) return
    
    const now = Date.now()
    const duration = now - pageStartTime.current
    
    // Use sendBeacon for non-blocking delivery of previous page duration
    if (lastPage.current && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({
        session_id: sessionId,
        page: lastPage.current,
        duration_ms: duration,
      })], { type: 'application/json' })
      navigator.sendBeacon(`${API_BASE}/analytics/pageview/duration`, blob)
    }
    
    // Reset for new page
    pageStartTime.current = now
    lastPage.current = page

    // Only track via enterprise analytics (removes duplicate basic tracking)
    trackPageView(page)
  }, [location.pathname, isEnabled, sessionId, trackPageView])

  // Track duration on page unload
  useEffect(() => {
    if (!isEnabled) return

    const handleBeforeUnload = () => {
      const duration = Date.now() - pageStartTime.current
      const data = JSON.stringify({
        session_id: sessionId,
        page: lastPage.current,
        duration_ms: duration,
      })
      navigator.sendBeacon?.(`${API_BASE}/analytics/pageview/duration`, data)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isEnabled, sessionId])

  // Track custom event - single path, non-blocking
  const trackEvent = (name: string, properties?: Record<string, unknown>) => {
    if (!isEnabled) return

    // Use sendBeacon for non-blocking delivery
    const data = JSON.stringify({
      session_id: sessionId,
      event_name: name,
      page: location.pathname,
      metadata: properties,
    })
    
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' })
      navigator.sendBeacon(`${API_BASE}/analytics/event`, blob)
    } else {
      fetch(`${API_BASE}/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true,
      }).catch(() => {})
    }
  }

  // Track conversion
  const trackConversion = (_type: string, userId?: string) => {
    if (!isEnabled) return

    fetch(`${API_BASE}/analytics/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
      }),
    }).catch(() => {})

    // Could also update journey as converted
  }

  return (
    <AnalyticsContext.Provider value={{ sessionId, visitorId, trackEvent, trackConversion }}>
      {children}
    </AnalyticsContext.Provider>
  )
}
