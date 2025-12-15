/**
 * useAuthAnalytics - Track authentication events for conversion analysis
 * 
 * Usage:
 *   const authAnalytics = useAuthAnalytics()
 *   authAnalytics.trackLoginSuccess('email')
 *   authAnalytics.trackSignupComplete('google')
 */

import { useCallback, useRef } from 'react'
import { analytics } from '@/services/analytics'

export function useAuthAnalytics() {
  const sessionStartRef = useRef(Date.now())

  const trackLoginSuccess = useCallback((method: string) => {
    sessionStartRef.current = Date.now()
    analytics.trackEvent('login_success', { method })
  }, [])

  const trackLoginFailure = useCallback((errorType: string, method?: string) => {
    analytics.trackEvent('login_failure', { error_type: errorType, method })
  }, [])

  const trackLogout = useCallback(() => {
    const sessionDurationMs = Date.now() - sessionStartRef.current
    analytics.trackEvent('logout', { session_duration_ms: sessionDurationMs })
  }, [])

  const trackSignupStart = useCallback((method?: string) => {
    analytics.trackEvent('signup_form_start', { method })
  }, [])

  const trackSignupComplete = useCallback((method: string, userId: string) => {
    analytics.trackEvent('signup_complete', { method })
    analytics.markConversion(userId)
  }, [])

  const trackSignupError = useCallback((errorType: string, method?: string) => {
    analytics.trackEvent('signup_form_error', { error_type: errorType, method })
  }, [])

  const trackPasswordResetRequest = useCallback(() => {
    analytics.trackEvent('password_reset_request')
  }, [])

  const trackPasswordResetComplete = useCallback(() => {
    analytics.trackEvent('password_reset_complete')
  }, [])

  const trackSessionResume = useCallback((daysSinceLastVisit: number) => {
    sessionStartRef.current = Date.now()
    analytics.trackEvent('session_resume', { days_since_last_visit: daysSinceLastVisit })
  }, [])

  const trackAccountSettingsChange = useCallback((settingType: string) => {
    analytics.trackEvent('account_settings_change', { setting_type: settingType })
  }, [])

  const trackProfileUpdate = useCallback((fieldsChanged: string[]) => {
    analytics.trackEvent('profile_update', { fields_changed: fieldsChanged })
  }, [])

  return {
    trackLoginSuccess,
    trackLoginFailure,
    trackLogout,
    trackSignupStart,
    trackSignupComplete,
    trackSignupError,
    trackPasswordResetRequest,
    trackPasswordResetComplete,
    trackSessionResume,
    trackAccountSettingsChange,
    trackProfileUpdate,
  }
}
