/**
 * Analytics API Hook - Centralized data fetching for analytics dashboard
 */

import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { API_BASE } from '@/utils/constants'
import type { DateRange } from './types'

export function useAnalyticsAPI() {
  const { token } = useAuthStore()

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token])

  const buildParams = useCallback((range: DateRange, extra?: Record<string, string | number>) => {
    const params = new URLSearchParams({
      start_date: range.start,
      end_date: range.end,
    })
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => params.set(k, String(v)))
    }
    return params.toString()
  }, [])

  // Generic fetch wrapper
  const fetchAPI = useCallback(async <T>(endpoint: string): Promise<T | null> => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { headers: headers() })
      const data = await res.json()
      return data.success ? data.data : null
    } catch {
      return null
    }
  }, [headers])

  // Basic Analytics
  const getOverview = (range: DateRange) =>
    fetchAPI(`/analytics/dashboard/overview?${buildParams(range)}`)

  const getDailyStats = (range: DateRange) =>
    fetchAPI(`/analytics/dashboard/daily?${buildParams(range)}`)

  const getPageStats = (range: DateRange) =>
    fetchAPI(`/analytics/dashboard/pages?${buildParams(range)}`)

  const getTechBreakdown = (range: DateRange) =>
    fetchAPI(`/analytics/dashboard/tech?${buildParams(range)}`)

  const getUTMBreakdown = (range: DateRange) =>
    fetchAPI(`/analytics/dashboard/utm?${buildParams(range)}`)

  const getGeoBreakdown = (range: DateRange) =>
    fetchAPI(`/analytics/dashboard/geo?${buildParams(range)}`)

  // Enterprise Analytics
  const getJourneys = (range: DateRange, page = 1, sortBy = 'journey_start', sortOrder = 'desc', convertedOnly = false) =>
    fetchAPI(`/analytics/enterprise/dashboard/journeys?${buildParams(range, { 
      page, 
      per_page: 50, 
      sort_by: sortBy, 
      sort_order: sortOrder,
      converted_only: String(convertedOnly),
    })}`)

  const getJourneySteps = (journeyId: string) =>
    fetchAPI(`/analytics/enterprise/dashboard/journey/${journeyId}/steps`)

  const getPerformance = (range: DateRange) =>
    fetchAPI(`/analytics/enterprise/dashboard/performance?${buildParams(range)}`)

  const getErrors = (range: DateRange, page = 1, resolved = false, search = '') =>
    fetchAPI(`/analytics/enterprise/dashboard/errors?${buildParams(range, { 
      page, 
      per_page: 50,
      ...(search && { search }),
      ...(resolved !== undefined && { resolved: String(resolved) }),
    })}`)

  const resolveError = async (errorId: string) => {
    try {
      await fetch(`${API_BASE}/analytics/enterprise/dashboard/errors/${errorId}/resolve`, {
        method: 'POST',
        headers: headers(),
      })
      return true
    } catch {
      return false
    }
  }

  const getHeatmap = (range: DateRange, pagePath: string) =>
    fetchAPI(`/analytics/enterprise/dashboard/heatmap?${buildParams(range, { page_path: pagePath })}`)

  const getScrollDepth = (range: DateRange) =>
    fetchAPI(`/analytics/enterprise/dashboard/scroll-depth?${buildParams(range)}`)

  const getRealtime = () =>
    fetchAPI('/analytics/enterprise/dashboard/realtime')

  // Survival Analytics
  const getSurvivalOverview = (days = 7) =>
    fetchAPI(`/analytics/survival/dashboard/overview?days=${days}`)

  const getDifficultyCurve = (days = 7) =>
    fetchAPI(`/analytics/survival/dashboard/difficulty-curve?days=${days}`)

  const getObstacleAnalysis = (days = 7) =>
    fetchAPI(`/analytics/survival/dashboard/obstacle-analysis?days=${days}`)

  const getSurvivalFunnel = (days = 7) =>
    fetchAPI(`/analytics/survival/dashboard/funnel?days=${days}`)

  const getInputAnalysis = (days = 7) =>
    fetchAPI(`/analytics/survival/dashboard/input-analysis?days=${days}`)

  const getComboAnalysis = (days = 7) =>
    fetchAPI(`/analytics/survival/dashboard/combo-analysis?days=${days}`)

  const getTriviaAnalysis = (days = 7) =>
    fetchAPI(`/analytics/survival/dashboard/trivia-analysis?days=${days}`)

  const getShopFunnel = (days = 7) =>
    fetchAPI(`/analytics/survival/dashboard/shop-funnel?days=${days}`)

  const getAuthAnalysis = (days = 7) =>
    fetchAPI(`/analytics/survival/dashboard/auth-analysis?days=${days}`)

  // Additional Enterprise
  const getCohorts = (range: DateRange, cohortType = 'week') =>
    fetchAPI(`/analytics/enterprise/dashboard/cohorts?${buildParams(range, { cohort_type: cohortType })}`)

  const getExperiments = (page = 1, status?: string) =>
    fetchAPI(`/analytics/enterprise/dashboard/experiments?page=${page}&per_page=20${status ? `&status=${status}` : ''}`)

  const getExperimentDetails = (experimentId: string) =>
    fetchAPI(`/analytics/enterprise/dashboard/experiments/${experimentId}`)

  const getFunnels = () =>
    fetchAPI('/analytics/enterprise/dashboard/funnels')

  const getFunnelStats = (funnelId: string, range: DateRange) =>
    fetchAPI(`/analytics/enterprise/dashboard/funnels/${funnelId}/stats?${buildParams(range)}`)

  const getVisitorReport = (visitorId: string) =>
    fetchAPI(`/analytics/enterprise/dashboard/visitor/${visitorId}/report`)

  const getSummaryReport = (range: DateRange) =>
    fetchAPI(`/analytics/enterprise/dashboard/reports/summary?${buildParams(range)}`)

  const getTimeOnPageReport = (range: DateRange) =>
    fetchAPI(`/analytics/enterprise/dashboard/reports/time-on-page?${buildParams(range)}`)

  const getEvents = (range: DateRange, page = 1) =>
    fetchAPI(`/analytics/dashboard/events?${buildParams(range, { page, per_page: 100 })}`)

  const getPageviews = (range: DateRange, page = 1) =>
    fetchAPI(`/analytics/dashboard/pageviews?${buildParams(range, { page, per_page: 100 })}`)

  return {
    // Basic
    getOverview,
    getDailyStats,
    getPageStats,
    getTechBreakdown,
    getUTMBreakdown,
    getGeoBreakdown,
    // Enterprise
    getJourneys,
    getJourneySteps,
    getPerformance,
    getErrors,
    resolveError,
    getHeatmap,
    getScrollDepth,
    getRealtime,
    // Survival
    getSurvivalOverview,
    getDifficultyCurve,
    getObstacleAnalysis,
    getSurvivalFunnel,
    getInputAnalysis,
    getComboAnalysis,
    getTriviaAnalysis,
    getShopFunnel,
    getAuthAnalysis,
    // Additional Enterprise
    getCohorts,
    getExperiments,
    getExperimentDetails,
    getFunnels,
    getFunnelStats,
    getVisitorReport,
    getSummaryReport,
    getTimeOnPageReport,
    getEvents,
    getPageviews,
  }
}
