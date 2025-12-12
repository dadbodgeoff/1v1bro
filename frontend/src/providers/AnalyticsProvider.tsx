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

export function AnalyticsProvider({ children, enabled = true }: AnalyticsProviderProps) {
  const location = useLocation()
  const initialized = useRef(false)
  
  const {
    sessionId,
    visitorId,
    trackPageView,
    trackJourneyStep,
  } = useEnterpriseAnalytics({
    enabled,
    trackPerformance: true,
    trackClicks: true,
    trackScroll: true,
    trackErrors: true,
    heartbeatInterval: 30000,
  })

  // Initialize session on mount
  useEffect(() => {
    if (!enabled || initialized.current) return
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
  }, [enabled, sessionId, visitorId])

  // Track page views on route change
  useEffect(() => {
    if (!enabled) return

    const page = location.pathname
    
    // Track in basic analytics
    fetch(`${API_BASE}/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        page,
        referrer: document.referrer,
        load_time_ms: Math.round(performance.now()),
      }),
    }).catch(() => {})

    // Track in enterprise analytics
    trackPageView(page)
  }, [location.pathname, enabled, sessionId, trackPageView])

  // Track custom event
  const trackEvent = (name: string, properties?: Record<string, unknown>) => {
    if (!enabled) return

    // Basic analytics
    fetch(`${API_BASE}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        event_name: name,
        page: location.pathname,
        metadata: properties,
      }),
    }).catch(() => {})

    // Enterprise journey tracking
    trackJourneyStep('event', {
      event_name: name,
      page: location.pathname,
      metadata: properties,
    })
  }

  // Track conversion
  const trackConversion = (_type: string, userId?: string) => {
    if (!enabled) return

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
