/**
 * useEnterpriseAnalytics - Full-suite analytics tracking
 * 
 * Features:
 * - User journey tracking
 * - Core Web Vitals (LCP, FID, CLS)
 * - Click heatmaps with rage/dead click detection
 * - Scroll depth tracking
 * - JS error tracking
 * - Real-time heartbeat
 * - A/B experiment assignment
 */

import { useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { API_BASE } from '@/utils/constants'

// ============================================
// Types
// ============================================

interface PerformanceMetrics {
  lcp_ms?: number
  fid_ms?: number
  cls?: number
  ttfb_ms?: number
  fcp_ms?: number
  dom_interactive_ms?: number
  dom_complete_ms?: number
  load_time_ms?: number
  resource_count?: number
  total_transfer_kb?: number
  js_heap_mb?: number
  connection_type?: string
  effective_bandwidth_mbps?: number
  rtt_ms?: number
}

interface ClickData {
  x_percent: number
  y_percent: number
  x_px: number
  y_px: number
  viewport_width: number
  viewport_height: number
  scroll_y: number
  element_tag?: string
  element_id?: string
  element_class?: string
  element_text?: string
  element_href?: string
  click_type: 'click' | 'rage_click' | 'dead_click'
  is_rage_click: boolean
  is_dead_click: boolean
}

interface ErrorData {
  error_type: 'js_error' | 'api_error' | 'resource_error'
  error_message: string
  error_stack?: string
  error_source?: string
  error_line?: number
  error_column?: number
  component?: string
  action?: string
  is_fatal?: boolean
  metadata?: Record<string, unknown>
}

// ============================================
// Helpers
// ============================================

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

const getVisitorId = (): string => {
  // Use same key as basic analytics service for consistency
  const key = '1v1bro_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `v_${generateId()}`
    localStorage.setItem(key, id)
  }
  return id
}

const getSessionId = (): string => {
  // Use same key as basic analytics service for consistency
  const key = '1v1bro_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = `s_${generateId()}`
    sessionStorage.setItem(key, id)
  }
  return id
}

const getDeviceType = (): string => {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
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

const getBrowser = (): string => {
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  return 'Other'
}

// Non-blocking POST using sendBeacon when possible
const trackAsync = (endpoint: string, data: Record<string, unknown>) => {
  try {
    const payload = JSON.stringify(data)
    const url = `${API_BASE}/analytics/enterprise${endpoint}`
    
    // Prefer sendBeacon - truly non-blocking, doesn't wait for response
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
    } else {
      // Fallback with keepalive for reliability
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Silent fail - analytics should never break the app
  }
}

// ============================================
// Main Hook
// ============================================

export interface UseEnterpriseAnalyticsOptions {
  enabled?: boolean
  trackPerformance?: boolean
  trackClicks?: boolean
  trackScroll?: boolean
  trackErrors?: boolean
  heartbeatInterval?: number // ms, 0 to disable
}

export function useEnterpriseAnalytics(options: UseEnterpriseAnalyticsOptions = {}) {
  const {
    enabled = true,
    trackPerformance = true,
    trackClicks = true,
    trackScroll = true,
    trackErrors = true,
    heartbeatInterval = 30000, // 30 seconds
  } = options

  // Disable analytics on localhost to avoid polluting demo/production data
  const isEnabled = enabled && !isLocalhost()

  const user = useAuthStore(state => state.user)
  const sessionId = useRef(getSessionId())
  const visitorId = useRef(getVisitorId())
  const currentPage = useRef(window.location.pathname)
  const pageStartTime = useRef(Date.now())
  const maxScrollDepth = useRef(0)
  const scrollMilestones = useRef<Record<number, number>>({})
  const clickTimes = useRef<number[]>([])
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ============================================
  // Journey Tracking
  // ============================================

  const trackJourneyStep = useCallback((
    stepType: 'pageview' | 'event' | 'click',
    data: { page?: string; event_name?: string; element_id?: string; metadata?: Record<string, unknown> }
  ) => {
    if (!isEnabled) return

    trackAsync('/track/journey-step', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      step_type: stepType,
      page: data.page || currentPage.current,
      event_name: data.event_name,
      element_id: data.element_id,
      duration_ms: Date.now() - pageStartTime.current,
      metadata: data.metadata,
    })
  }, [isEnabled])

  // ============================================
  // Performance Tracking (Core Web Vitals)
  // ============================================

  const trackPerformanceMetrics = useCallback((metrics: PerformanceMetrics) => {
    if (!isEnabled || !trackPerformance) return

    trackAsync('/track/performance', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      page: currentPage.current,
      device_type: getDeviceType(),
      browser: getBrowser(),
      ...metrics,
    })
  }, [isEnabled, trackPerformance])

  // Auto-collect Web Vitals - batched into single report, uses requestIdleCallback
  useEffect(() => {
    if (!isEnabled || !trackPerformance) return

    const observers: PerformanceObserver[] = []
    const collectedMetrics: PerformanceMetrics = {}
    let reportTimeout: ReturnType<typeof setTimeout> | null = null

    // Batch all metrics and send once after 5 seconds
    const scheduleReport = () => {
      if (reportTimeout) return
      reportTimeout = setTimeout(() => {
        if (Object.keys(collectedMetrics).length > 0) {
          trackPerformanceMetrics({ ...collectedMetrics })
        }
      }, 5000)
    }

    const collectWebVitals = () => {
      if (!('PerformanceObserver' in window)) return

      // LCP - only capture final value
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
          if (lastEntry) {
            collectedMetrics.lcp_ms = Math.round(lastEntry.startTime)
            scheduleReport()
          }
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
        observers.push(lcpObserver)
      } catch { /* Not supported */ }

      // FID - one-time capture
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const firstEntry = list.getEntries()[0] as PerformanceEntry & { processingStart: number; startTime: number }
          if (firstEntry) {
            collectedMetrics.fid_ms = Math.round(firstEntry.processingStart - firstEntry.startTime)
            fidObserver.disconnect() // Only need first input
            scheduleReport()
          }
        })
        fidObserver.observe({ type: 'first-input', buffered: true })
        observers.push(fidObserver)
      } catch { /* Not supported */ }

      // CLS - accumulate and report on page hide
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
            if (!entry.hadRecentInput) clsValue += entry.value
          }
          collectedMetrics.cls = Math.round(clsValue * 1000) / 1000
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })
        observers.push(clsObserver)
      } catch { /* Not supported */ }

      // Navigation timing - use requestIdleCallback to avoid blocking
      const collectNavTiming = () => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (nav) {
          collectedMetrics.ttfb_ms = Math.round(nav.responseStart - nav.requestStart)
          collectedMetrics.dom_complete_ms = Math.round(nav.domComplete - nav.fetchStart)
          collectedMetrics.load_time_ms = Math.round(nav.loadEventEnd - nav.fetchStart)
          
          // Skip expensive resource enumeration - just get count
          collectedMetrics.resource_count = performance.getEntriesByType('resource').length
          
          scheduleReport()
        }
      }

      if ('requestIdleCallback' in window) {
        requestIdleCallback(collectNavTiming, { timeout: 5000 })
      } else {
        setTimeout(collectNavTiming, 3000)
      }
    }

    collectWebVitals()

    return () => {
      observers.forEach(o => o.disconnect())
      if (reportTimeout) clearTimeout(reportTimeout)
    }
  }, [isEnabled, trackPerformance, trackPerformanceMetrics])

  // ============================================
  // Click Tracking (Heatmaps)
  // ============================================

  const trackClick = useCallback((data: ClickData) => {
    if (!isEnabled || !trackClicks) return

    trackAsync('/track/click', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      page: currentPage.current,
      ...data,
    })
  }, [isEnabled, trackClicks])

  // Auto-track clicks - ONLY important interactive elements, debounced
  useEffect(() => {
    if (!isEnabled || !trackClicks) return

    let pendingClick: ClickData | null = null
    let flushTimeout: ReturnType<typeof setTimeout> | null = null

    const flushClick = () => {
      if (pendingClick) {
        trackClick(pendingClick)
        pendingClick = null
      }
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // ONLY track clicks on interactive elements - skip everything else
      const interactive = target.closest('a, button, [role="button"], input, select, textarea')
      if (!interactive) return
      
      const now = Date.now()

      // Detect rage clicks (3+ clicks within 1 second)
      clickTimes.current.push(now)
      clickTimes.current = clickTimes.current.filter(t => now - t < 1000)
      const isRageClick = clickTimes.current.length >= 3

      // Minimal data capture - no expensive DOM traversal
      const clickData: ClickData = {
        x_percent: Math.round((e.clientX / window.innerWidth) * 100),
        y_percent: Math.round((e.clientY / window.innerHeight) * 100),
        x_px: e.clientX,
        y_px: e.clientY,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        scroll_y: window.scrollY,
        element_tag: interactive.tagName.toLowerCase(),
        element_id: interactive.id || undefined,
        element_class: undefined, // Skip - expensive and rarely useful
        element_text: interactive.textContent?.slice(0, 50)?.trim() || undefined,
        element_href: (interactive as HTMLAnchorElement).href || undefined,
        click_type: isRageClick ? 'rage_click' : 'click',
        is_rage_click: isRageClick,
        is_dead_click: false,
      }

      // Debounce - batch clicks within 100ms
      pendingClick = clickData
      if (flushTimeout) clearTimeout(flushTimeout)
      flushTimeout = setTimeout(flushClick, 100)
    }

    document.addEventListener('click', handleClick, { passive: true })
    return () => {
      document.removeEventListener('click', handleClick)
      if (flushTimeout) clearTimeout(flushTimeout)
      flushClick()
    }
  }, [isEnabled, trackClicks, trackClick])

  // ============================================
  // Scroll Depth Tracking
  // ============================================

  const trackScrollDepth = useCallback(() => {
    if (!isEnabled || !trackScroll) return

    trackAsync('/track/scroll', {
      session_id: sessionId.current,
      page: currentPage.current,
      max_scroll_percent: maxScrollDepth.current,
      scroll_milestones: scrollMilestones.current,
      scroll_ups: 0, // Could track this with more state
      time_to_50_percent_ms: scrollMilestones.current[50] ? scrollMilestones.current[50] - pageStartTime.current : undefined,
      time_to_100_percent_ms: scrollMilestones.current[100] ? scrollMilestones.current[100] - pageStartTime.current : undefined,
    })
  }, [isEnabled, trackScroll])

  // Auto-track scroll - heavily throttled, only update on significant changes
  useEffect(() => {
    if (!isEnabled || !trackScroll) return

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null
    let lastRecordedDepth = 0

    const handleScroll = () => {
      // Throttle to max once per 500ms
      if (scrollTimeout) return
      
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null
        
        const scrollY = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrollPercent = docHeight > 0 ? Math.round((scrollY / docHeight) * 100) : 0

        // Only update if we've scrolled at least 10% more
        if (scrollPercent > maxScrollDepth.current && scrollPercent - lastRecordedDepth >= 10) {
          maxScrollDepth.current = scrollPercent
          lastRecordedDepth = scrollPercent

          // Record milestones
          const milestones = [25, 50, 75, 100]
          for (const m of milestones) {
            if (scrollPercent >= m && !scrollMilestones.current[m]) {
              scrollMilestones.current[m] = Date.now()
            }
          }
        }
      }, 500)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Send scroll data on page leave
    const handleBeforeUnload = () => trackScrollDepth()
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') trackScrollDepth()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [isEnabled, trackScroll, trackScrollDepth])

  // ============================================
  // Error Tracking
  // ============================================

  const trackError = useCallback((data: ErrorData) => {
    if (!isEnabled || !trackErrors) return

    trackAsync('/track/error', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      user_id: user?.id,
      page: currentPage.current,
      browser: getBrowser(),
      os: navigator.platform,
      ...data,
    })
  }, [isEnabled, trackErrors, user?.id])

  // Auto-track JS errors
  useEffect(() => {
    if (!isEnabled || !trackErrors) return

    const handleError = (event: ErrorEvent) => {
      trackError({
        error_type: 'js_error',
        error_message: event.message,
        error_source: event.filename,
        error_line: event.lineno,
        error_column: event.colno,
        error_stack: event.error?.stack,
        is_fatal: false,
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError({
        error_type: 'js_error',
        error_message: event.reason?.message || String(event.reason),
        error_stack: event.reason?.stack,
        is_fatal: false,
        metadata: { type: 'unhandled_promise_rejection' },
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [isEnabled, trackErrors, trackError])

  // ============================================
  // Real-time Heartbeat
  // ============================================

  useEffect(() => {
    if (!isEnabled || heartbeatInterval <= 0) return

    const sendHeartbeat = () => {
      // Use sendBeacon for non-blocking delivery
      const data = JSON.stringify({
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        user_id: user?.id,
        current_page: currentPage.current,
        device_type: getDeviceType(),
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${API_BASE}/analytics/enterprise/track/heartbeat`, data)
      } else {
        // Fallback - but don't await
        fetch(`${API_BASE}/analytics/enterprise/track/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {})
      }
    }

    // Delay initial heartbeat to not compete with page load
    const initialTimeout = setTimeout(sendHeartbeat, 5000)

    // Periodic heartbeat - increase interval to 60s to reduce overhead
    heartbeatRef.current = setInterval(sendHeartbeat, Math.max(heartbeatInterval, 60000))

    return () => {
      clearTimeout(initialTimeout)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [isEnabled, heartbeatInterval, user?.id])

  // ============================================
  // Page Change Handler
  // ============================================

  const trackPageView = useCallback((page: string) => {
    // Send scroll data for previous page
    trackScrollDepth()

    // Reset for new page
    currentPage.current = page
    pageStartTime.current = Date.now()
    maxScrollDepth.current = 0
    scrollMilestones.current = {}

    // Track journey step
    trackJourneyStep('pageview', { page })
  }, [trackScrollDepth, trackJourneyStep])

  // ============================================
  // A/B Experiment Assignment
  // ============================================

  const getExperimentVariant = useCallback((_experimentName: string, variants: string[]): string => {
    // Deterministic assignment based on visitor ID
    const hash = visitorId.current.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0)
    }, 0)
    const index = Math.abs(hash) % variants.length
    return variants[index]
  }, [])

  return {
    sessionId: sessionId.current,
    visitorId: visitorId.current,
    trackJourneyStep,
    trackPerformanceMetrics,
    trackClick,
    trackScrollDepth,
    trackError,
    trackPageView,
    getExperimentVariant,
  }
}
