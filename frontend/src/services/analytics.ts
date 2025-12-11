/**
 * Analytics Service - Tracks page views, events, and user behavior
 * 
 * Usage:
 *   import { analytics } from '@/services/analytics'
 *   
 *   // Track page view (call on route change)
 *   analytics.trackPageView('/landing')
 *   
 *   // Track events
 *   analytics.trackEvent('click_signup')
 *   analytics.trackEvent('play_demo', { duration: 30 })
 *   
 *   // Track scroll depth
 *   analytics.trackScrollDepth(75)
 */

import { API_BASE } from '@/utils/constants'

// Generate a persistent session ID (fingerprint-lite)
function getSessionId(): string {
  const key = '1v1bro_session_id'
  let sessionId = localStorage.getItem(key)
  
  if (!sessionId) {
    // Generate a simple fingerprint from available browser data
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ]
    
    // Simple hash function
    const hash = components.join('|').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    sessionId = `${Math.abs(hash).toString(36)}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(key, sessionId)
  }
  
  return sessionId
}

// Detect device type
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase()
  const width = window.innerWidth
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile'
  }
  if (/ipad|tablet|playbook|silk/i.test(ua) || (width >= 768 && width < 1024)) {
    return 'tablet'
  }
  return 'desktop'
}

// Get browser name
function getBrowser(): string {
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('SamsungBrowser')) return 'Samsung'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  if (ua.includes('Edge')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  return 'Other'
}

// Get OS
function getOS(): string {
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Other'
}

// Parse UTM parameters from URL
function getUTMParams(): { source?: string; medium?: string; campaign?: string } {
  const params = new URLSearchParams(window.location.search)
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
  }
}

// Send analytics data to backend (fire and forget)
async function sendAnalytics(endpoint: string, data: Record<string, unknown>): Promise<void> {
  try {
    const payload = JSON.stringify(data)
    
    // Use sendBeacon with Blob for proper content-type
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon(`${API_BASE}/analytics${endpoint}`, blob)
    } else {
      // Fallback to fetch
      fetch(`${API_BASE}/analytics${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {}) // Ignore errors
    }
  } catch {
    // Silently fail - analytics should never break the app
  }
}

class Analytics {
  private sessionId: string
  private initialized = false
  private pageLoadTime = Date.now()
  private currentPage = ''
  private maxScrollDepth = 0

  constructor() {
    this.sessionId = getSessionId()
  }

  /**
   * Initialize analytics session (call once on app load)
   */
  init(): void {
    if (this.initialized) return
    this.initialized = true

    const utm = getUTMParams()
    
    sendAnalytics('/session', {
      session_id: this.sessionId,
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      screen_width: screen.width,
      screen_height: screen.height,
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer || null,
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
    })

    // Track scroll depth
    this.setupScrollTracking()
    
    // Track time on page when leaving
    this.setupUnloadTracking()
  }

  /**
   * Track a page view
   */
  trackPageView(page: string): void {
    // Send time on previous page
    if (this.currentPage) {
      const timeOnPage = Math.round((Date.now() - this.pageLoadTime) / 1000)
      sendAnalytics('/page-update', {
        session_id: this.sessionId,
        page: this.currentPage,
        time_on_page: timeOnPage,
        scroll_depth: this.maxScrollDepth,
      })
    }

    // Reset for new page
    this.currentPage = page
    this.pageLoadTime = Date.now()
    this.maxScrollDepth = 0

    sendAnalytics('/pageview', {
      session_id: this.sessionId,
      page,
      referrer: document.referrer || null,
      load_time_ms: Math.round(performance.now()),
    })
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, metadata?: Record<string, unknown>): void {
    sendAnalytics('/event', {
      session_id: this.sessionId,
      event_name: eventName,
      page: this.currentPage || window.location.pathname,
      metadata,
    })
  }

  /**
   * Track scroll depth (0-100)
   */
  trackScrollDepth(depth: number): void {
    if (depth > this.maxScrollDepth) {
      this.maxScrollDepth = depth
    }
  }

  /**
   * Mark session as converted (user signed up)
   */
  markConversion(userId: string): void {
    sendAnalytics('/conversion', {
      session_id: this.sessionId,
      user_id: userId,
    })
  }

  private setupScrollTracking(): void {
    let ticking = false
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
          const scrolled = window.scrollY
          const depth = scrollHeight > 0 ? Math.round((scrolled / scrollHeight) * 100) : 100
          this.trackScrollDepth(depth)
          ticking = false
        })
        ticking = true
      }
    }, { passive: true })
  }

  private setupUnloadTracking(): void {
    window.addEventListener('beforeunload', () => {
      if (this.currentPage) {
        const timeOnPage = Math.round((Date.now() - this.pageLoadTime) / 1000)
        sendAnalytics('/page-update', {
          session_id: this.sessionId,
          page: this.currentPage,
          time_on_page: timeOnPage,
          scroll_depth: this.maxScrollDepth,
        })
      }
    })
  }
}

// Singleton instance
export const analytics = new Analytics()

// ============================================
// Convenience exports for common events
// ============================================

// Landing page events
export const trackSignupClick = () => analytics.trackEvent('click_signup')
export const trackLoginClick = () => analytics.trackEvent('click_login')
export const trackDemoPlay = () => analytics.trackEvent('demo_play')
export const trackDemoComplete = (duration: number) => analytics.trackEvent('demo_complete', { duration })
export const trackFeatureScroll = (section: string) => analytics.trackEvent('scroll_to_section', { section })

// Instant play funnel events
export const trackInstantPlayStart = () => analytics.trackEvent('instant_play_start')
export const trackInstantPlayCategorySelect = (category: string) => analytics.trackEvent('instant_play_category_select', { category })
export const trackInstantPlayTutorialComplete = () => analytics.trackEvent('instant_play_tutorial_complete')
export const trackInstantPlayMatchStart = () => analytics.trackEvent('instant_play_match_start')
export const trackInstantPlayMatchComplete = (result: 'win' | 'loss', duration: number) => 
  analytics.trackEvent('instant_play_match_complete', { result, duration })
export const trackInstantPlayPlayAgain = (matchCount: number) => 
  analytics.trackEvent('instant_play_play_again', { match_count: matchCount })
export const trackInstantPlayExit = (matchCount: number, totalXp: number) => 
  analytics.trackEvent('instant_play_exit', { match_count: matchCount, total_xp: totalXp })

// Conversion prompt events
export const trackConversionPromptShown = (promptId: string, matchCount: number) => 
  analytics.trackEvent('conversion_prompt_shown', { prompt_id: promptId, match_count: matchCount })
export const trackConversionPromptClicked = (promptId: string) => 
  analytics.trackEvent('conversion_prompt_clicked', { prompt_id: promptId })
export const trackConversionPromptDismissed = (promptId: string) => 
  analytics.trackEvent('conversion_prompt_dismissed', { prompt_id: promptId })

// Signup funnel events
export const trackSignupFormStart = () => analytics.trackEvent('signup_form_start')
export const trackSignupFormComplete = () => analytics.trackEvent('signup_form_complete')
export const trackSignupFormError = (error: string) => analytics.trackEvent('signup_form_error', { error })

// Mobile CTA events
export const trackMobileCtaShown = () => analytics.trackEvent('mobile_cta_shown')
export const trackMobileCtaClick = () => analytics.trackEvent('mobile_cta_click')
