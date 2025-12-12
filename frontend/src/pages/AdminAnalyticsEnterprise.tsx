/**
 * AdminAnalyticsEnterprise - Full Enterprise Analytics Suite
 * 
 * New Tabs:
 * - Journeys: User journey visualization with funnel analysis
 * - Performance: Core Web Vitals dashboard
 * - Heatmaps: Click heatmap visualization
 * - Errors: JS error tracking and resolution
 * - Cohorts: Retention analysis
 * - Experiments: A/B test management
 * - Real-time: Live visitor dashboard
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { API_BASE } from '@/utils/constants'
import { TrackingStatus, DataVerification, CohortsPanel, FunnelsPanel } from '@/components/analytics'

// ============================================
// Types
// ============================================

interface Journey {
  id: string
  visitor_id: string
  session_id: string
  entry_page: string
  exit_page: string
  total_pages: number
  total_events: number
  converted: boolean
  conversion_type: string | null
  device_type: string
  journey_start: string
  journey_end: string
}

interface JourneyStep {
  id: string
  step_number: number
  step_type: string
  page: string
  event_name: string | null
  element_id: string | null
  timestamp: string
  duration_ms: number | null
}

interface PerformanceAggregates {
  lcp: { avg: number | null; p75: number | null; p95: number | null }
  fid: { avg: number | null; p75: number | null; p95: number | null }
  cls: { avg: number | null; p75: number | null; p95: number | null }
  ttfb: { avg: number | null; p75: number | null; p95: number | null }
  fcp: { avg: number | null; p75: number | null; p95: number | null }
  load_time: { avg: number | null; p75: number | null; p95: number | null }
}

interface ErrorItem {
  id: string
  error_type: string
  error_message: string
  error_source: string | null
  error_line: number | null
  component: string | null
  occurrence_count: number
  first_seen: string
  last_seen: string
  resolved: boolean
  browser: string
}

interface HeatmapPoint {
  x: number
  y: number
  count: number
}

interface Experiment {
  id: string
  name: string
  description: string | null
  status: string
  variants: Array<{ id: string; name: string; weight: number }>
  primary_metric: string
  start_date: string | null
  end_date: string | null
  winner_variant: string | null
}

interface RealtimeData {
  active_users: number
  sessions: Array<{ session_id: string; current_page: string; device_type: string; last_activity: string }>
  pages: Array<{ page: string; count: number }>
  devices: { mobile: number; tablet: number; desktop: number }
}

interface ScrollDepthPage {
  page: string
  views: number
  avg_scroll_depth: number
  reached_25_pct: number
  reached_50_pct: number
  reached_75_pct: number
  reached_100_pct: number
}

// Admin emails
const ADMIN_EMAILS = ['dadbodgeoff@gmail.com']

// ============================================
// Main Component
// ============================================

export function AdminAnalyticsEnterprise() {
  const navigate = useNavigate()
  const { token, isAuthenticated, user } = useAuthStore()
  
  // Date range
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  })
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'journeys' | 'performance' | 'heatmaps' | 'errors' | 'cohorts' | 'funnels' | 'experiments' | 'realtime'>('overview')
  
  // Data states
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [journeysTotal, setJourneysTotal] = useState(0)
  const [journeysPage, setJourneysPage] = useState(1)
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null)
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([])
  
  const [performanceAggregates, setPerformanceAggregates] = useState<PerformanceAggregates | null>(null)
  const [performanceGrades, setPerformanceGrades] = useState<Record<string, string>>({})
  
  const [errors, setErrors] = useState<ErrorItem[]>([])
  const [errorsTotal, setErrorsTotal] = useState(0)
  const [errorsPage, setErrorsPage] = useState(1)
  const [errorFilter, setErrorFilter] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  
  const [heatmapPage, setHeatmapPage] = useState('/')
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([])
  const [rageClicks, setRageClicks] = useState<Array<{ element_text: string; x_percent: number; y_percent: number }>>([])
  const [deadClicks, setDeadClicks] = useState<Array<{ element_text: string; x_percent: number; y_percent: number }>>([])
  
  const [scrollDepthPages, setScrollDepthPages] = useState<ScrollDepthPage[]>([])
  
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [experimentStats, setExperimentStats] = useState<Record<string, { total: number; converted: number; conversion_rate: number }>>({})
  
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null)
  
  const [loading, setLoading] = useState(true)

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, user?.email, navigate])

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const params = `start_date=${dateRange.start}&end_date=${dateRange.end}`

  // Fetch journeys
  const fetchJourneys = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/journeys?${params}&page=${journeysPage}&per_page=50`, { headers })
      const data = await res.json()
      if (data.success) {
        setJourneys(data.data.journeys)
        setJourneysTotal(data.data.total)
      }
    } catch (e) {
      console.error('Failed to fetch journeys', e)
    }
  }, [token, params, journeysPage])

  // Fetch journey steps
  const fetchJourneySteps = useCallback(async (journeyId: string) => {
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/journey/${journeyId}/steps`, { headers })
      const data = await res.json()
      if (data.success) {
        setJourneySteps(data.data.steps)
      }
    } catch (e) {
      console.error('Failed to fetch journey steps', e)
    }
  }, [token])

  // Fetch performance
  const fetchPerformance = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/performance?${params}`, { headers })
      const data = await res.json()
      if (data.success) {
        setPerformanceAggregates(data.data.aggregates)
        setPerformanceGrades(data.data.grades)
      }
    } catch (e) {
      console.error('Failed to fetch performance', e)
    }
  }, [token, params])

  // Fetch errors
  const fetchErrors = useCallback(async () => {
    try {
      const resolved = showResolved ? '' : '&resolved=false'
      const search = errorFilter ? `&search=${encodeURIComponent(errorFilter)}` : ''
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/errors?${params}&page=${errorsPage}&per_page=50${resolved}${search}`, { headers })
      const data = await res.json()
      if (data.success) {
        setErrors(data.data.errors)
        setErrorsTotal(data.data.total)
      }
    } catch (e) {
      console.error('Failed to fetch errors', e)
    }
  }, [token, params, errorsPage, showResolved, errorFilter])

  // Resolve error
  const resolveError = async (errorId: string) => {
    try {
      await fetch(`${API_BASE}/analytics/enterprise/dashboard/errors/${errorId}/resolve`, { method: 'POST', headers })
      fetchErrors()
    } catch (e) {
      console.error('Failed to resolve error', e)
    }
  }

  // Fetch heatmap
  const fetchHeatmap = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/heatmap?${params}&page_path=${encodeURIComponent(heatmapPage)}`, { headers })
      const data = await res.json()
      if (data.success) {
        setHeatmapData(data.data.heatmap)
        setRageClicks(data.data.rage_clicks)
        setDeadClicks(data.data.dead_clicks)
      }
    } catch (e) {
      console.error('Failed to fetch heatmap', e)
    }
  }, [token, params, heatmapPage])

  // Fetch scroll depth
  const fetchScrollDepth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/scroll-depth?${params}`, { headers })
      const data = await res.json()
      if (data.success) {
        setScrollDepthPages(data.data.pages)
      }
    } catch (e) {
      console.error('Failed to fetch scroll depth', e)
    }
  }, [token, params])

  // Fetch experiments
  const fetchExperiments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/experiments`, { headers })
      const data = await res.json()
      if (data.success) {
        setExperiments(data.data.experiments)
      }
    } catch (e) {
      console.error('Failed to fetch experiments', e)
    }
  }, [token])

  // Fetch experiment details
  const fetchExperimentDetails = useCallback(async (expId: string) => {
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/experiments/${expId}`, { headers })
      const data = await res.json()
      if (data.success) {
        setExperimentStats(data.data.variant_stats)
      }
    } catch (e) {
      console.error('Failed to fetch experiment details', e)
    }
  }, [token])

  // Fetch realtime
  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/realtime`, { headers })
      const data = await res.json()
      if (data.success) {
        setRealtimeData(data.data)
      }
    } catch (e) {
      console.error('Failed to fetch realtime', e)
    }
  }, [token])

  // Initial load based on tab
  useEffect(() => {
    if (!token) return
    setLoading(true)
    
    const load = async () => {
      switch (activeTab) {
        case 'journeys':
          await fetchJourneys()
          break
        case 'performance':
          await Promise.all([fetchPerformance(), fetchScrollDepth()])
          break
        case 'heatmaps':
          await fetchHeatmap()
          break
        case 'errors':
          await fetchErrors()
          break
        case 'experiments':
          await fetchExperiments()
          break
        case 'realtime':
          await fetchRealtime()
          break
      }
      setLoading(false)
    }
    
    load()
  }, [activeTab, token, dateRange])

  // Realtime auto-refresh
  useEffect(() => {
    if (activeTab !== 'realtime') return
    const interval = setInterval(fetchRealtime, 10000)
    return () => clearInterval(interval)
  }, [activeTab, fetchRealtime])

  // Refetch on page/filter change
  useEffect(() => { if (activeTab === 'journeys') fetchJourneys() }, [journeysPage])
  useEffect(() => { if (activeTab === 'errors') fetchErrors() }, [errorsPage, showResolved, errorFilter])
  useEffect(() => { if (activeTab === 'heatmaps') fetchHeatmap() }, [heatmapPage])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Enterprise Analytics</h1>
              <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded">Pro</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 bg-white/5 rounded-lg text-sm border border-white/10"
              />
              <span className="text-neutral-500">→</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 bg-white/5 rounded-lg text-sm border border-white/10"
              />
              <button onClick={() => navigate('/admin/analytics')} className="text-sm text-neutral-400 hover:text-white">
                Basic View
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-white/10">
          {(['overview', 'journeys', 'performance', 'heatmaps', 'errors', 'cohorts', 'funnels', 'experiments', 'realtime'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-[2px] ${
                activeTab === tab ? 'border-orange-500 text-white' : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'realtime' && realtimeData && (
                <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  {realtimeData.active_users} live
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab - Tracking Health & Data Verification */}
        {activeTab === 'overview' && token && (
          <div className="space-y-6">
            <TrackingStatus token={token} />
            <DataVerification token={token} dateRange={dateRange} />
          </div>
        )}

        {/* Journeys Tab */}
        {activeTab === 'journeys' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Journey List */}
            <div className="lg:col-span-2 bg-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-neutral-400">User Journeys</h2>
                <span className="text-xs text-neutral-500">{journeysTotal} total</span>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#1a1a1a]">
                    <tr className="text-left text-neutral-500 border-b border-white/10">
                      <th className="pb-3 pr-3">Entry</th>
                      <th className="pb-3 pr-3">Exit</th>
                      <th className="pb-3 pr-3">Pages</th>
                      <th className="pb-3 pr-3">Events</th>
                      <th className="pb-3 pr-3">Converted</th>
                      <th className="pb-3">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journeys.map((j) => (
                      <tr
                        key={j.id}
                        onClick={() => { setSelectedJourney(j); fetchJourneySteps(j.id) }}
                        className={`border-b border-white/5 cursor-pointer transition-colors ${
                          selectedJourney?.id === j.id ? 'bg-orange-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-2 pr-3 font-mono text-xs">{j.entry_page}</td>
                        <td className="py-2 pr-3 font-mono text-xs text-neutral-400">{j.exit_page}</td>
                        <td className="py-2 pr-3 text-blue-400">{j.total_pages}</td>
                        <td className="py-2 pr-3 text-green-400">{j.total_events}</td>
                        <td className="py-2 pr-3">
                          {j.converted ? (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">{j.conversion_type || 'Yes'}</span>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>
                        <td className="py-2 text-xs text-neutral-500">{new Date(j.journey_start).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setJourneysPage(p => Math.max(1, p - 1))}
                  disabled={journeysPage === 1}
                  className="px-3 py-1 bg-white/5 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-neutral-500">Page {journeysPage}</span>
                <button
                  onClick={() => setJourneysPage(p => p + 1)}
                  disabled={journeys.length < 50}
                  className="px-3 py-1 bg-white/5 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Journey Detail */}
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Journey Steps</h2>
              {selectedJourney ? (
                <div className="space-y-3">
                  {journeySteps.map((step, i) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.step_type === 'pageview' ? 'bg-blue-500/20 text-blue-400' :
                          step.step_type === 'event' ? 'bg-green-500/20 text-green-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {step.step_number}
                        </div>
                        {i < journeySteps.length - 1 && <div className="w-0.5 h-8 bg-white/10" />}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="text-sm font-medium">
                          {step.step_type === 'pageview' ? step.page : step.event_name || step.element_id}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {step.step_type} • {step.duration_ms ? `${Math.round(step.duration_ms / 1000)}s` : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {journeySteps.length === 0 && <p className="text-neutral-500 text-sm">Select a journey to view steps</p>}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">Select a journey to view steps</p>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Core Web Vitals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <WebVitalCard
                name="LCP"
                label="Largest Contentful Paint"
                value={performanceAggregates?.lcp.p75}
                unit="ms"
                grade={performanceGrades.lcp}
                thresholds={{ good: 2500, poor: 4000 }}
              />
              <WebVitalCard
                name="FID"
                label="First Input Delay"
                value={performanceAggregates?.fid.p75}
                unit="ms"
                grade={performanceGrades.fid}
                thresholds={{ good: 100, poor: 300 }}
              />
              <WebVitalCard
                name="CLS"
                label="Cumulative Layout Shift"
                value={performanceAggregates?.cls.p75}
                unit=""
                grade={performanceGrades.cls}
                thresholds={{ good: 0.1, poor: 0.25 }}
              />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="TTFB (p75)" value={performanceAggregates?.ttfb.p75} unit="ms" />
              <MetricCard label="FCP (p75)" value={performanceAggregates?.fcp.p75} unit="ms" />
              <MetricCard label="Load Time (p75)" value={performanceAggregates?.load_time.p75} unit="ms" />
              <MetricCard label="Load Time (avg)" value={performanceAggregates?.load_time.avg} unit="ms" />
            </div>

            {/* Scroll Depth */}
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Scroll Depth by Page</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b border-white/10">
                      <th className="pb-3 pr-4">Page</th>
                      <th className="pb-3 pr-4 text-right">Views</th>
                      <th className="pb-3 pr-4 text-right">Avg Depth</th>
                      <th className="pb-3 pr-4 text-right">25%</th>
                      <th className="pb-3 pr-4 text-right">50%</th>
                      <th className="pb-3 pr-4 text-right">75%</th>
                      <th className="pb-3 text-right">100%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrollDepthPages.map((p) => (
                      <tr key={p.page} className="border-b border-white/5">
                        <td className="py-2 pr-4 font-mono text-xs">{p.page}</td>
                        <td className="py-2 pr-4 text-right text-blue-400">{p.views}</td>
                        <td className="py-2 pr-4 text-right">{p.avg_scroll_depth}%</td>
                        <td className="py-2 pr-4 text-right text-neutral-400">{p.reached_25_pct}%</td>
                        <td className="py-2 pr-4 text-right text-neutral-400">{p.reached_50_pct}%</td>
                        <td className="py-2 pr-4 text-right text-neutral-400">{p.reached_75_pct}%</td>
                        <td className="py-2 text-right text-green-400">{p.reached_100_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Heatmaps Tab */}
        {activeTab === 'heatmaps' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm text-neutral-400">Page:</label>
              <input
                type="text"
                value={heatmapPage}
                onChange={(e) => setHeatmapPage(e.target.value)}
                placeholder="/landing"
                className="px-3 py-2 bg-white/5 rounded-lg text-sm border border-white/10 w-64"
              />
              <button onClick={fetchHeatmap} className="px-4 py-2 bg-orange-500 rounded-lg text-sm">
                Load Heatmap
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Heatmap Visualization */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-sm font-medium text-neutral-400 mb-4">Click Heatmap</h2>
                <div className="relative bg-neutral-900 rounded-lg aspect-[16/10] overflow-hidden">
                  {heatmapData.map((point, i) => (
                    <div
                      key={i}
                      className="absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        backgroundColor: `rgba(255, ${Math.max(0, 150 - point.count * 10)}, 0, ${Math.min(0.8, 0.2 + point.count * 0.1)})`,
                        width: `${Math.min(40, 10 + point.count * 2)}px`,
                        height: `${Math.min(40, 10 + point.count * 2)}px`,
                      }}
                      title={`${point.count} clicks`}
                    />
                  ))}
                  {heatmapData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
                      No click data for this page
                    </div>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-2">{heatmapData.reduce((sum, p) => sum + p.count, 0)} total clicks</p>
              </div>

              {/* Problem Clicks */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-6">
                  <h2 className="text-sm font-medium text-red-400 mb-4">🔥 Rage Clicks ({rageClicks.length})</h2>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {rageClicks.slice(0, 10).map((click, i) => (
                      <div key={i} className="text-xs bg-red-500/10 p-2 rounded">
                        <span className="text-neutral-400">"{click.element_text?.slice(0, 50) || 'Unknown'}"</span>
                        <span className="text-neutral-500 ml-2">at ({click.x_percent.toFixed(0)}%, {click.y_percent.toFixed(0)}%)</span>
                      </div>
                    ))}
                    {rageClicks.length === 0 && <p className="text-neutral-500 text-xs">No rage clicks detected</p>}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h2 className="text-sm font-medium text-yellow-400 mb-4">⚠️ Dead Clicks ({deadClicks.length})</h2>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {deadClicks.slice(0, 10).map((click, i) => (
                      <div key={i} className="text-xs bg-yellow-500/10 p-2 rounded">
                        <span className="text-neutral-400">"{click.element_text?.slice(0, 50) || 'Unknown'}"</span>
                        <span className="text-neutral-500 ml-2">at ({click.x_percent.toFixed(0)}%, {click.y_percent.toFixed(0)}%)</span>
                      </div>
                    ))}
                    {deadClicks.length === 0 && <p className="text-neutral-500 text-xs">No dead clicks detected</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-medium text-neutral-400">Error Tracking</h2>
                <input
                  type="text"
                  placeholder="Search errors..."
                  value={errorFilter}
                  onChange={(e) => setErrorFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-sm border border-white/10 w-48"
                />
                <label className="flex items-center gap-2 text-sm text-neutral-400">
                  <input
                    type="checkbox"
                    checked={showResolved}
                    onChange={(e) => setShowResolved(e.target.checked)}
                    className="rounded"
                  />
                  Show resolved
                </label>
              </div>
              <span className="text-xs text-neutral-500">{errorsTotal} errors</span>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1a1a1a]">
                  <tr className="text-left text-neutral-500 border-b border-white/10">
                    <th className="pb-3 pr-3">Error</th>
                    <th className="pb-3 pr-3">Source</th>
                    <th className="pb-3 pr-3">Count</th>
                    <th className="pb-3 pr-3">Browser</th>
                    <th className="pb-3 pr-3">Last Seen</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err) => (
                    <tr key={err.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 pr-3">
                        <div className="max-w-md">
                          <span className={`px-2 py-0.5 rounded text-xs mr-2 ${
                            err.error_type === 'js_error' ? 'bg-red-500/20 text-red-400' :
                            err.error_type === 'api_error' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {err.error_type}
                          </span>
                          <span className="text-xs text-neutral-300 break-all">{err.error_message.slice(0, 100)}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-neutral-400">
                        {err.error_source?.split('/').pop() || '-'}:{err.error_line || '?'}
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`font-bold ${err.occurrence_count > 10 ? 'text-red-400' : err.occurrence_count > 3 ? 'text-yellow-400' : 'text-neutral-400'}`}>
                          {err.occurrence_count}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-neutral-400">{err.browser || '-'}</td>
                      <td className="py-2 pr-3 text-xs text-neutral-500">{new Date(err.last_seen).toLocaleString()}</td>
                      <td className="py-2">
                        {!err.resolved && (
                          <button
                            onClick={() => resolveError(err.id)}
                            className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30"
                          >
                            Resolve
                          </button>
                        )}
                        {err.resolved && <span className="text-green-400 text-xs">✓ Resolved</span>}
                      </td>
                    </tr>
                  ))}
                  {errors.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-neutral-500">No errors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setErrorsPage(p => Math.max(1, p - 1))}
                disabled={errorsPage === 1}
                className="px-3 py-1 bg-white/5 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-500">Page {errorsPage}</span>
              <button
                onClick={() => setErrorsPage(p => p + 1)}
                disabled={errors.length < 50}
                className="px-3 py-1 bg-white/5 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Cohorts Tab */}
        {activeTab === 'cohorts' && token && (
          <CohortsPanel token={token} dateRange={dateRange} />
        )}

        {/* Funnels Tab */}
        {activeTab === 'funnels' && token && (
          <FunnelsPanel token={token} dateRange={dateRange} />
        )}

        {/* Experiments Tab */}
        {activeTab === 'experiments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">A/B Experiments</h2>
              <div className="space-y-3">
                {experiments.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => { setSelectedExperiment(exp); fetchExperimentDetails(exp.id) }}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedExperiment?.id === exp.id ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{exp.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        exp.status === 'running' ? 'bg-green-500/20 text-green-400' :
                        exp.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-neutral-500/20 text-neutral-400'
                      }`}>
                        {exp.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">{exp.description || 'No description'}</p>
                    <div className="flex gap-2 mt-2">
                      {exp.variants.map((v) => (
                        <span key={v.id} className="px-2 py-0.5 bg-white/10 rounded text-xs">{v.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {experiments.length === 0 && <p className="text-neutral-500 text-sm">No experiments yet</p>}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Experiment Results</h2>
              {selectedExperiment ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">{selectedExperiment.name}</h3>
                    <p className="text-xs text-neutral-500">Primary metric: {selectedExperiment.primary_metric}</p>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(experimentStats).map(([variantId, stats]) => (
                      <div key={variantId} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{variantId}</span>
                          <span className="text-orange-400 font-bold">{stats.conversion_rate}%</span>
                        </div>
                        <div className="flex gap-4 text-xs text-neutral-400">
                          <span>{stats.total} visitors</span>
                          <span>{stats.converted} conversions</span>
                        </div>
                        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${stats.conversion_rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedExperiment.winner_variant && (
                    <div className="p-3 bg-green-500/20 rounded-lg text-center">
                      <span className="text-green-400">🏆 Winner: {selectedExperiment.winner_variant}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">Select an experiment to view results</p>
              )}
            </div>
          </div>
        )}

        {/* Realtime Tab */}
        {activeTab === 'realtime' && realtimeData && (
          <div className="space-y-6">
            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">{realtimeData.active_users}</div>
                <div className="text-sm text-neutral-400">Active Users</div>
                <div className="mt-2 flex justify-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">{realtimeData.devices.desktop}</div>
                <div className="text-sm text-neutral-400">Desktop</div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">{realtimeData.devices.mobile}</div>
                <div className="text-sm text-neutral-400">Mobile</div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">{realtimeData.devices.tablet}</div>
                <div className="text-sm text-neutral-400">Tablet</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Pages */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-sm font-medium text-neutral-400 mb-4">Active Pages</h2>
                <div className="space-y-2">
                  {realtimeData.pages.map((p) => (
                    <div key={p.page} className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="font-mono text-sm">{p.page}</span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm font-bold">{p.count}</span>
                    </div>
                  ))}
                  {realtimeData.pages.length === 0 && <p className="text-neutral-500 text-sm">No active pages</p>}
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-sm font-medium text-neutral-400 mb-4">Live Sessions</h2>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {realtimeData.sessions.slice(0, 20).map((s) => (
                    <div key={s.session_id} className="flex items-center justify-between py-2 border-b border-white/5">
                      <div>
                        <span className="font-mono text-xs text-neutral-400">{s.session_id.slice(0, 12)}...</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                          s.device_type === 'mobile' ? 'bg-orange-500/20 text-orange-400' :
                          s.device_type === 'tablet' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {s.device_type}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">{s.current_page}</span>
                    </div>
                  ))}
                  {realtimeData.sessions.length === 0 && <p className="text-neutral-500 text-sm">No active sessions</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Helper Components
// ============================================

function WebVitalCard({
  name,
  label,
  value,
  unit,
  grade,
  thresholds,
}: {
  name: string
  label: string
  value: number | null | undefined
  unit: string
  grade: string
  thresholds: { good: number; poor: number }
}) {
  const gradeColors: Record<string, string> = {
    Good: 'text-green-400 bg-green-500/20',
    'Needs Improvement': 'text-yellow-400 bg-yellow-500/20',
    Poor: 'text-red-400 bg-red-500/20',
    'N/A': 'text-neutral-400 bg-neutral-500/20',
  }

  return (
    <div className="bg-white/5 rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold">{name}</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${gradeColors[grade] || gradeColors['N/A']}`}>
          {grade}
        </span>
      </div>
      <div className="text-3xl font-bold mb-1">
        {value !== null && value !== undefined ? `${value}${unit}` : '-'}
      </div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-3 text-xs text-neutral-400">
        Good: &lt;{thresholds.good}{unit} | Poor: &gt;{thresholds.poor}{unit}
      </div>
    </div>
  )
}

function MetricCard({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-blue-400">
        {value !== null && value !== undefined ? `${Math.round(value)}${unit}` : '-'}
      </div>
    </div>
  )
}

export default AdminAnalyticsEnterprise
