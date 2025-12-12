/**
 * AdminAnalytics - Enterprise Analytics Dashboard
 * 
 * Features:
 * - Date range filtering (custom ranges, presets)
 * - All data points accessible
 * - Custom report builder
 * - CSV/JSON export
 * - Real-time data refresh
 * - Session explorer
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { API_BASE } from '@/utils/constants'

// ============================================
// Types
// ============================================

interface DateRange {
  start: string
  end: string
  label: string
}

interface OverviewData {
  period: { page_views: number; unique_visitors: number; events: Record<string, number> }
  totals: { visitors: number; conversions: number; conversion_rate: number }
  devices: { mobile: number; tablet: number; desktop: number }
  top_referrers: Array<{ source: string; count: number }>
}

interface DailyData {
  days: Array<{ date: string; views: number; visitors: number; conversions: number }>
}

interface PageData {
  pages: Array<{ page: string; views: number; avg_time_on_page: number; avg_scroll_depth: number }>
}

interface TechData {
  browsers: Array<{ name: string; count: number }>
  operating_systems: Array<{ name: string; count: number }>
  screen_sizes: Array<{ name: string; count: number }>
}

interface UTMData {
  sources: Array<{ name: string; visitors: number; conversions: number; conversion_rate: number }>
  campaigns: Array<{ name: string; visitors: number; conversions: number; conversion_rate: number }>
}

interface GeoData {
  timezones: Array<{ name: string; count: number }>
  languages: Array<{ name: string; count: number }>
}

interface EventItem {
  event_name: string
  page: string
  metadata: Record<string, unknown> | null
  created_at: string
  session_id?: string
}

interface SessionItem {
  id: string
  session_id: string
  device_type: string
  browser: string
  os: string
  screen_width: number
  screen_height: number
  locale: string
  timezone: string
  first_referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  first_seen: string
  last_seen: string
  converted_to_signup: boolean
  converted_at: string | null
}

interface PageViewItem {
  id: string
  session_id: string
  page: string
  referrer: string | null
  load_time_ms: number | null
  time_on_page: number | null
  scroll_depth: number | null
  viewed_at: string
}

// Admin emails
const ADMIN_EMAILS = ['dadbodgeoff@gmail.com']

// Date range presets
const DATE_PRESETS: Array<{ label: string; days: number }> = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: -1 },
]


// ============================================
// Main Component
// ============================================

export function AdminAnalytics() {
  const navigate = useNavigate()
  const { token, isAuthenticated, user } = useAuthStore()
  
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      label: 'Last 7 days'
    }
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  // Data state
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [daily, setDaily] = useState<DailyData | null>(null)
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [techData, setTechData] = useState<TechData | null>(null)
  const [utmData, setUtmData] = useState<UTMData | null>(null)
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [pageViews, setPageViews] = useState<PageViewItem[]>([])
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'tech' | 'campaigns' | 'events' | 'sessions' | 'raw'>('overview')
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters for events/sessions
  const [eventFilter, setEventFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')

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

  // Fetch data
  const fetchData = useCallback(async (showRefresh = false) => {
    if (!token) return
    
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      
      const params = `start_date=${dateRange.start}&end_date=${dateRange.end}`
      
      const [overviewRes, dailyRes, pagesRes, techRes, utmRes, geoRes, eventsRes, sessionsRes, pageViewsRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/dashboard/overview?${params}`, { headers }),
        fetch(`${API_BASE}/analytics/dashboard/daily?${params}`, { headers }),
        fetch(`${API_BASE}/analytics/dashboard/pages?${params}`, { headers }),
        fetch(`${API_BASE}/analytics/dashboard/tech?${params}`, { headers }),
        fetch(`${API_BASE}/analytics/dashboard/utm?${params}`, { headers }),
        fetch(`${API_BASE}/analytics/dashboard/geo?${params}`, { headers }),
        fetch(`${API_BASE}/analytics/dashboard/events?${params}&limit=500`, { headers }),
        fetch(`${API_BASE}/analytics/dashboard/sessions?${params}&limit=500`, { headers }),
        fetch(`${API_BASE}/analytics/dashboard/pageviews?${params}&limit=500`, { headers }),
      ])

      const results = await Promise.all([
        overviewRes.json(), dailyRes.json(), pagesRes.json(), techRes.json(),
        utmRes.json(), geoRes.json(), eventsRes.json(), sessionsRes.json(), pageViewsRes.json()
      ])

      if (results[0].success) setOverview(results[0].data)
      if (results[1].success) setDaily(results[1].data)
      if (results[2].success) setPageData(results[2].data)
      if (results[3].success) setTechData(results[3].data)
      if (results[4].success) setUtmData(results[4].data)
      if (results[5].success) setGeoData(results[5].data)
      if (results[6].success) setEvents(results[6].data.events || [])
      if (results[7].success) setSessions(results[7].data.sessions || [])
      if (results[8].success) setPageViews(results[8].data.pageviews || [])
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, dateRange])

  useEffect(() => {
    if (isAuthenticated && user?.email && ADMIN_EMAILS.includes(user.email)) {
      fetchData()
    }
  }, [fetchData, isAuthenticated, user?.email])

  // Date preset handler
  const applyDatePreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    
    if (days === 0) {
      // Today
      setDateRange({
        start: end.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        label: 'Today'
      })
    } else if (days === 1) {
      // Yesterday
      start.setDate(start.getDate() - 1)
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: start.toISOString().split('T')[0],
        label: 'Yesterday'
      })
    } else if (days === -1) {
      // All time
      setDateRange({
        start: '2020-01-01',
        end: end.toISOString().split('T')[0],
        label: 'All time'
      })
    } else {
      start.setDate(start.getDate() - days)
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        label: `Last ${days} days`
      })
    }
    setShowDatePicker(false)
  }

  // Export functions
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n')
    downloadFile(csv, `${filename}.csv`, 'text/csv')
  }

  const exportToJSON = (data: unknown, filename: string) => {
    downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, 'application/json')
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export all data
  const exportAllData = () => {
    const allData = {
      exportDate: new Date().toISOString(),
      dateRange,
      overview,
      daily,
      pages: pageData,
      tech: techData,
      utm: utmData,
      geo: geoData,
      events,
      sessions,
      pageViews
    }
    exportToJSON(allData, `analytics-export-${dateRange.start}-to-${dateRange.end}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button onClick={() => fetchData()} className="px-4 py-2 bg-orange-500 rounded-lg text-white">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const maxViews = Math.max(...(daily?.days.map(d => d.views) || [1]), 1)
  const filteredEvents = events.filter(e => 
    !eventFilter || e.event_name.toLowerCase().includes(eventFilter.toLowerCase()) ||
    e.page?.toLowerCase().includes(eventFilter.toLowerCase())
  )
  const filteredSessions = sessions.filter(s =>
    !sessionFilter || s.session_id.toLowerCase().includes(sessionFilter.toLowerCase()) ||
    s.browser?.toLowerCase().includes(sessionFilter.toLowerCase()) ||
    s.utm_source?.toLowerCase().includes(sessionFilter.toLowerCase())
  )


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Bar */}
      <div className="border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Analytics</h1>
              <span className="text-xs text-neutral-500 bg-white/5 px-2 py-1 rounded">Enterprise</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Date Range Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{dateRange.label}</span>
                  <span className="text-neutral-500 text-xs">({dateRange.start} → {dateRange.end})</span>
                </button>
                
                {showDatePicker && (
                  <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl p-4 shadow-xl min-w-[320px] z-30">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {DATE_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          onClick={() => applyDatePreset(preset.days)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            dateRange.label === preset.label
                              ? 'bg-orange-500 text-white'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-xs text-neutral-500 mb-2">Custom Range</p>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value, label: 'Custom' }))}
                          className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm border border-white/10"
                        />
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value, label: 'Custom' }))}
                          className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm border border-white/10"
                        />
                      </div>
                      <button
                        onClick={() => { fetchData(); setShowDatePicker(false) }}
                        className="w-full mt-3 px-4 py-2 bg-orange-500 rounded-lg text-sm font-medium"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Refresh */}
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              {/* Export */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
                <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl">
                  <button onClick={exportAllData} className="block w-full px-4 py-2 text-sm text-left hover:bg-white/10">
                    Export All (JSON)
                  </button>
                  <button onClick={() => exportToCSV(events as unknown as Record<string, unknown>[], 'events')} className="block w-full px-4 py-2 text-sm text-left hover:bg-white/10">
                    Export Events (CSV)
                  </button>
                  <button onClick={() => exportToCSV(sessions as unknown as Record<string, unknown>[], 'sessions')} className="block w-full px-4 py-2 text-sm text-left hover:bg-white/10">
                    Export Sessions (CSV)
                  </button>
                  <button onClick={() => exportToCSV(pageViews as unknown as Record<string, unknown>[], 'pageviews')} className="block w-full px-4 py-2 text-sm text-left hover:bg-white/10">
                    Export Page Views (CSV)
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-neutral-400 hover:text-white"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-white/10">
          {(['overview', 'pages', 'tech', 'campaigns', 'events', 'sessions', 'raw'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-[2px] ${
                activeTab === tab
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {tab === 'raw' ? 'Raw Data' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'events' && <span className="ml-1 text-xs text-neutral-500">({events.length})</span>}
              {tab === 'sessions' && <span className="ml-1 text-xs text-neutral-500">({sessions.length})</span>}
            </button>
          ))}
        </div>


        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <StatCard label="Page Views" value={overview?.period.page_views || 0} color="orange" />
              <StatCard label="Unique Visitors" value={overview?.period.unique_visitors || 0} color="blue" />
              <StatCard label="Total Sessions" value={sessions.length} color="purple" />
              <StatCard label="Conversions" value={overview?.totals.conversions || 0} color="green" />
              <StatCard label="Conv. Rate" value={`${overview?.totals.conversion_rate || 0}%`} color="cyan" />
              <StatCard label="Events" value={events.length} color="pink" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Daily Chart */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-sm font-medium text-neutral-400 mb-4">Daily Views</h2>
                <div className="flex items-end gap-1 h-40">
                  {daily?.days.map((day) => (
                    <div
                      key={day.date}
                      className="flex-1 bg-orange-500/80 rounded-t hover:bg-orange-500 transition-colors relative group cursor-pointer"
                      style={{ height: `${(day.views / maxViews) * 100}%`, minHeight: '4px' }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                        <div className="font-medium">{day.date}</div>
                        <div className="text-neutral-400">{day.views} views • {day.visitors} visitors</div>
                      </div>
                    </div>
                  ))}
                </div>
                {daily?.days && daily.days.length > 0 && (
                  <div className="flex justify-between mt-2 text-xs text-neutral-500">
                    <span>{daily.days[0]?.date}</span>
                    <span>{daily.days[daily.days.length - 1]?.date}</span>
                  </div>
                )}
              </div>

              {/* Device Breakdown */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-sm font-medium text-neutral-400 mb-4">Device Breakdown</h2>
                <div className="space-y-4">
                  {overview && (
                    <>
                      <BreakdownBar label="Desktop" count={overview.devices.desktop} total={overview.devices.desktop + overview.devices.mobile + overview.devices.tablet} color="blue" />
                      <BreakdownBar label="Mobile" count={overview.devices.mobile} total={overview.devices.desktop + overview.devices.mobile + overview.devices.tablet} color="green" />
                      <BreakdownBar label="Tablet" count={overview.devices.tablet} total={overview.devices.desktop + overview.devices.mobile + overview.devices.tablet} color="purple" />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Referrers */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-sm font-medium text-neutral-400 mb-4">Top Referrers</h2>
                <div className="space-y-2">
                  {overview?.top_referrers.length === 0 && <p className="text-neutral-500 text-sm">No referrer data</p>}
                  {overview?.top_referrers.slice(0, 8).map((ref, i) => (
                    <div key={ref.source} className="flex items-center justify-between py-1">
                      <span className="text-sm truncate flex-1">
                        <span className="text-neutral-500 mr-2 w-4 inline-block">{i + 1}.</span>
                        {ref.source || 'Direct'}
                      </span>
                      <span className="text-sm font-medium text-orange-400 ml-2">{ref.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Summary */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-sm font-medium text-neutral-400 mb-4">Event Summary</h2>
                <div className="space-y-2">
                  {Object.keys(overview?.period.events || {}).length === 0 && <p className="text-neutral-500 text-sm">No events</p>}
                  {Object.entries(overview?.period.events || {}).slice(0, 8).map(([event, count]) => (
                    <div key={event} className="flex items-center justify-between py-1">
                      <span className="text-sm">{formatEventName(event)}</span>
                      <span className="text-sm font-medium text-blue-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-sm font-medium text-neutral-400 mb-4">Quick Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">Avg. Time on Page</span>
                    <span className="text-sm font-medium">
                      {formatTime((pageData?.pages?.reduce((a, p) => a + p.avg_time_on_page, 0) ?? 0) / Math.max(pageData?.pages?.length ?? 1, 1))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">Avg. Scroll Depth</span>
                    <span className="text-sm font-medium">
                      {Math.round((pageData?.pages?.reduce((a, p) => a + p.avg_scroll_depth, 0) ?? 0) / Math.max(pageData?.pages?.length ?? 1, 1))}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">Top Browser</span>
                    <span className="text-sm font-medium">{techData?.browsers[0]?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">Top OS</span>
                    <span className="text-sm font-medium">{techData?.operating_systems[0]?.name || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-neutral-400">Page Performance</h2>
              <button onClick={() => exportToCSV(pageData?.pages as unknown as Record<string, unknown>[] || [], 'pages')} className="text-xs text-neutral-500 hover:text-white">
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 border-b border-white/10">
                    <th className="pb-3 pr-4">Page</th>
                    <th className="pb-3 pr-4 text-right">Views</th>
                    <th className="pb-3 pr-4 text-right">Avg Time</th>
                    <th className="pb-3 text-right">Scroll Depth</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData?.pages.map((page) => (
                    <tr key={page.page} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 pr-4 font-mono text-xs">{page.page}</td>
                      <td className="py-3 pr-4 text-right text-orange-400">{page.views}</td>
                      <td className="py-3 pr-4 text-right text-blue-400">{formatTime(page.avg_time_on_page)}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${page.avg_scroll_depth}%` }} />
                          </div>
                          <span className="text-green-400 w-10 text-right">{page.avg_scroll_depth}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!pageData?.pages || pageData.pages.length === 0) && (
                    <tr><td colSpan={4} className="py-8 text-center text-neutral-500">No page data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Tech Tab */}
        {activeTab === 'tech' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Browsers</h2>
              <div className="space-y-3">
                {techData?.browsers.map((b) => (
                  <BreakdownBar key={b.name} label={b.name} count={b.count} total={techData.browsers.reduce((a, x) => a + x.count, 0)} color="blue" />
                ))}
                {(!techData?.browsers || techData.browsers.length === 0) && <p className="text-neutral-500 text-sm">No data</p>}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Operating Systems</h2>
              <div className="space-y-3">
                {techData?.operating_systems.map((os) => (
                  <BreakdownBar key={os.name} label={os.name} count={os.count} total={techData.operating_systems.reduce((a, x) => a + x.count, 0)} color="purple" />
                ))}
                {(!techData?.operating_systems || techData.operating_systems.length === 0) && <p className="text-neutral-500 text-sm">No data</p>}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Screen Sizes</h2>
              <div className="space-y-3">
                {techData?.screen_sizes.map((s) => (
                  <BreakdownBar key={s.name} label={s.name} count={s.count} total={techData.screen_sizes.reduce((a, x) => a + x.count, 0)} color="green" />
                ))}
                {(!techData?.screen_sizes || techData.screen_sizes.length === 0) && <p className="text-neutral-500 text-sm">No data</p>}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Languages</h2>
              <div className="space-y-3">
                {geoData?.languages.map((l) => (
                  <BreakdownBar key={l.name} label={l.name.toUpperCase()} count={l.count} total={geoData.languages.reduce((a, x) => a + x.count, 0)} color="orange" />
                ))}
                {(!geoData?.languages || geoData.languages.length === 0) && <p className="text-neutral-500 text-sm">No data</p>}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 lg:col-span-2">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Timezones</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {geoData?.timezones.map((tz) => (
                  <div key={tz.name} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                    <span className="text-xs text-neutral-400 truncate mr-2">{tz.name}</span>
                    <span className="text-sm font-medium text-blue-400">{tz.count}</span>
                  </div>
                ))}
                {(!geoData?.timezones || geoData.timezones.length === 0) && <p className="text-neutral-500 text-sm col-span-4">No data</p>}
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Traffic Sources (UTM)</h2>
              {utmData?.sources && utmData.sources.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b border-white/10">
                      <th className="pb-3 pr-4">Source</th>
                      <th className="pb-3 pr-4 text-right">Visitors</th>
                      <th className="pb-3 pr-4 text-right">Conversions</th>
                      <th className="pb-3 text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utmData.sources.map((s) => (
                      <tr key={s.name} className="border-b border-white/5">
                        <td className="py-3 pr-4 font-medium">{s.name}</td>
                        <td className="py-3 pr-4 text-right text-blue-400">{s.visitors}</td>
                        <td className="py-3 pr-4 text-right text-green-400">{s.conversions}</td>
                        <td className="py-3 text-right text-orange-400">{s.conversion_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-neutral-500 text-sm">No UTM source data. Add ?utm_source=xxx to your links.</p>
              )}
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Campaigns</h2>
              {utmData?.campaigns && utmData.campaigns.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b border-white/10">
                      <th className="pb-3 pr-4">Campaign</th>
                      <th className="pb-3 pr-4 text-right">Visitors</th>
                      <th className="pb-3 pr-4 text-right">Conversions</th>
                      <th className="pb-3 text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utmData.campaigns.map((c) => (
                      <tr key={c.name} className="border-b border-white/5">
                        <td className="py-3 pr-4 font-medium">{c.name}</td>
                        <td className="py-3 pr-4 text-right text-blue-400">{c.visitors}</td>
                        <td className="py-3 pr-4 text-right text-green-400">{c.conversions}</td>
                        <td className="py-3 text-right text-orange-400">{c.conversion_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-neutral-500 text-sm">No campaign data. Add ?utm_campaign=xxx to your links.</p>
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-medium text-neutral-400">Events Log</h2>
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-sm border border-white/10 w-48"
                />
              </div>
              <span className="text-xs text-neutral-500">{filteredEvents.length} events</span>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1a1a1a]">
                  <tr className="text-left text-neutral-500 border-b border-white/10">
                    <th className="pb-3 pr-4">Event</th>
                    <th className="pb-3 pr-4">Page</th>
                    <th className="pb-3 pr-4">Metadata</th>
                    <th className="pb-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 pr-4">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                          {event.event_name}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-neutral-400">{event.page || '-'}</td>
                      <td className="py-2 pr-4 text-xs text-neutral-500 max-w-xs">
                        {event.metadata ? (
                          <code className="bg-white/5 px-1 rounded">{JSON.stringify(event.metadata)}</code>
                        ) : '-'}
                      </td>
                      <td className="py-2 text-right text-xs text-neutral-500 whitespace-nowrap">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-neutral-500">No events</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-medium text-neutral-400">Session Explorer</h2>
                <input
                  type="text"
                  placeholder="Filter sessions..."
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-sm border border-white/10 w-48"
                />
              </div>
              <span className="text-xs text-neutral-500">{filteredSessions.length} sessions</span>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1a1a1a]">
                  <tr className="text-left text-neutral-500 border-b border-white/10">
                    <th className="pb-3 pr-3">Session ID</th>
                    <th className="pb-3 pr-3">Device</th>
                    <th className="pb-3 pr-3">Browser</th>
                    <th className="pb-3 pr-3">OS</th>
                    <th className="pb-3 pr-3">Source</th>
                    <th className="pb-3 pr-3">First Seen</th>
                    <th className="pb-3 pr-3">Converted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.session_id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 pr-3 font-mono text-xs">{session.session_id.slice(0, 16)}...</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          session.device_type === 'mobile' ? 'bg-green-500/20 text-green-400' :
                          session.device_type === 'tablet' ? 'bg-indigo-500/20 text-indigo-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {session.device_type}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs">{session.browser}</td>
                      <td className="py-2 pr-3 text-xs">{session.os}</td>
                      <td className="py-2 pr-3 text-xs text-neutral-400">
                        {session.utm_source || session.first_referrer?.slice(0, 20) || 'Direct'}
                      </td>
                      <td className="py-2 pr-3 text-xs text-neutral-500">
                        {new Date(session.first_seen).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        {session.converted_to_signup ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-neutral-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-neutral-500">No sessions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Raw Data Tab */}
        {activeTab === 'raw' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-neutral-400">Raw Page Views ({pageViews.length})</h2>
                <button onClick={() => exportToCSV(pageViews as unknown as Record<string, unknown>[], 'raw-pageviews')} className="text-xs text-neutral-500 hover:text-white">
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#1a1a1a]">
                    <tr className="text-left text-neutral-500 border-b border-white/10">
                      <th className="pb-2 pr-2">Session</th>
                      <th className="pb-2 pr-2">Page</th>
                      <th className="pb-2 pr-2">Load Time</th>
                      <th className="pb-2 pr-2">Time on Page</th>
                      <th className="pb-2 pr-2">Scroll</th>
                      <th className="pb-2">Viewed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageViews.slice(0, 200).map((pv) => (
                      <tr key={pv.id} className="border-b border-white/5">
                        <td className="py-1.5 pr-2 font-mono">{pv.session_id.slice(0, 12)}...</td>
                        <td className="py-1.5 pr-2">{pv.page}</td>
                        <td className="py-1.5 pr-2 text-neutral-400">{pv.load_time_ms ? `${pv.load_time_ms}ms` : '-'}</td>
                        <td className="py-1.5 pr-2 text-neutral-400">{pv.time_on_page ? `${pv.time_on_page}s` : '-'}</td>
                        <td className="py-1.5 pr-2 text-neutral-400">{pv.scroll_depth ? `${pv.scroll_depth}%` : '-'}</td>
                        <td className="py-1.5 text-neutral-500">{new Date(pv.viewed_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-4">Data Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-400">{sessions.length}</div>
                  <div className="text-neutral-500">Total Sessions</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{pageViews.length}</div>
                  <div className="text-neutral-500">Page Views</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{events.length}</div>
                  <div className="text-neutral-500">Events</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-400">
                    {sessions.filter(s => s.converted_to_signup).length}
                  </div>
                  <div className="text-neutral-500">Conversions</div>
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

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorClasses: Record<string, string> = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    purple: 'text-indigo-400',
    green: 'text-green-400',
    cyan: 'text-blue-400',
    pink: 'text-rose-400',
  }

  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClasses[color] || 'text-white'}`}>{value}</div>
    </div>
  )
}

function BreakdownBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-indigo-500',
    orange: 'bg-orange-500',
    cyan: 'bg-blue-500',
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-neutral-400">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color] || 'bg-blue-500'} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// Helper Functions
// ============================================

function formatEventName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}

export default AdminAnalytics
