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
  const key = 'analytics_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `v_${generateId()}`
    localStorage.setItem(key, id)
  }
  return id
}

const getSessionId = (): string => {
  const key = 'analytics_session_id'
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

// Non-blocking POST
const trackAsync = async (endpoint: string, data: Record<string, unknown>) => {
  try {
    await fetch(`${API_BASE}/analytics/enterprise${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
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

  // Auto-collect Web Vitals
  useEffect(() => {
    if (!isEnabled || !trackPerformance) return

    const collectWebVitals = () => {
      // Use PerformanceObserver for modern metrics
      if ('PerformanceObserver' in window) {
        // LCP
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
            if (lastEntry) {
              trackPerformanceMetrics({ lcp_ms: Math.round(lastEntry.startTime) })
            }
          })
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
        } catch { /* Not supported */ }

        // FID
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number }
            if (firstEntry) {
              trackPerformanceMetrics({ fid_ms: Math.round(firstEntry.processingStart - firstEntry.startTime) })
            }
          })
          fidObserver.observe({ type: 'first-input', buffered: true })
        } catch { /* Not supported */ }

        // CLS
        try {
          let clsValue = 0
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            }
          })
          clsObserver.observe({ type: 'layout-shift', buffered: true })
          
          // Report CLS on page hide
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
              trackPerformanceMetrics({ cls: Math.round(clsValue * 1000) / 1000 })
            }
          }, { once: true })
        } catch { /* Not supported */ }
      }

      // Navigation timing
      setTimeout(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (nav) {
          const metrics: PerformanceMetrics = {
            ttfb_ms: Math.round(nav.responseStart - nav.requestStart),
            fcp_ms: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart),
            dom_interactive_ms: Math.round(nav.domInteractive - nav.fetchStart),
            dom_complete_ms: Math.round(nav.domComplete - nav.fetchStart),
            load_time_ms: Math.round(nav.loadEventEnd - nav.fetchStart),
          }

          // Resource count
          const resources = performance.getEntriesByType('resource')
          metrics.resource_count = resources.length
          metrics.total_transfer_kb = Math.round(
            resources.reduce((sum, r) => sum + ((r as PerformanceResourceTiming).transferSize || 0), 0) / 1024
          )

          // Connection info
          const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection
          if (conn) {
            metrics.connection_type = conn.effectiveType
            metrics.effective_bandwidth_mbps = conn.downlink
            metrics.rtt_ms = conn.rtt
          }

          // JS heap (Chrome only)
          const mem = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory
          if (mem?.usedJSHeapSize) {
            metrics.js_heap_mb = Math.round(mem.usedJSHeapSize / 1024 / 1024 * 100) / 100
          }

          trackPerformanceMetrics(metrics)
        }
      }, 3000) // Wait for page to fully load
    }

    collectWebVitals()
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

  // Auto-track clicks
  useEffect(() => {
    if (!isEnabled || !trackClicks) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const now = Date.now()

      // Detect rage clicks (3+ clicks within 1 second)
      clickTimes.current.push(now)
      clickTimes.current = clickTimes.current.filter(t => now - t < 1000)
      const isRageClick = clickTimes.current.length >= 3

      // Detect dead clicks (click on non-interactive element)
      const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL']
      const isInteractive = interactiveTags.includes(target.tagName) ||
        target.getAttribute('role') === 'button' ||
        target.onclick !== null ||
        target.closest('a, button, [role="button"]') !== null
      const isDeadClick = !isInteractive

      const rect = document.documentElement
      const clickData: ClickData = {
        x_percent: Math.round((e.clientX / rect.clientWidth) * 10000) / 100,
        y_percent: Math.round(((e.clientY + window.scrollY) / rect.scrollHeight) * 10000) / 100,
        x_px: e.clientX,
        y_px: e.clientY + window.scrollY,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        scroll_y: window.scrollY,
        element_tag: target.tagName.toLowerCase(),
        element_id: target.id || undefined,
        element_class: target.className?.toString().slice(0, 512) || undefined,
        element_text: target.textContent?.slice(0, 256) || undefined,
        element_href: (target as HTMLAnchorElement).href || target.closest('a')?.href || undefined,
        click_type: isRageClick ? 'rage_click' : isDeadClick ? 'dead_click' : 'click',
        is_rage_click: isRageClick,
        is_dead_click: isDeadClick,
      }

      trackClick(clickData)

      // Also track as journey step for important clicks
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button, a')) {
        trackJourneyStep('click', {
          element_id: clickData.element_id || clickData.element_text?.slice(0, 50),
        })
      }
    }

    document.addEventListener('click', handleClick, { passive: true })
    return () => document.removeEventListener('click', handleClick)
  }, [isEnabled, trackClicks, trackClick, trackJourneyStep])

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

  // Auto-track scroll
  useEffect(() => {
    if (!isEnabled || !trackScroll) return

    let ticking = false

    const handleScroll = () => {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrollPercent = docHeight > 0 ? Math.round((scrollY / docHeight) * 100) : 0

        if (scrollPercent > maxScrollDepth.current) {
          maxScrollDepth.current = scrollPercent

          // Record milestones
          const milestones = [25, 50, 75, 100]
          for (const m of milestones) {
            if (scrollPercent >= m && !scrollMilestones.current[m]) {
              scrollMilestones.current[m] = Date.now()
            }
          }
        }

        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Send scroll data on page leave
    const handleBeforeUnload = () => trackScrollDepth()
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') trackScrollDepth()
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
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
      trackAsync('/track/heartbeat', {
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        user_id: user?.id,
        current_page: currentPage.current,
        device_type: getDeviceType(),
      })
    }

    // Initial heartbeat
    sendHeartbeat()

    // Periodic heartbeat
    heartbeatRef.current = setInterval(sendHeartbeat, heartbeatInterval)

    return () => {
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
