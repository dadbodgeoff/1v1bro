/**
 * OverviewPanel - Main analytics overview with key metrics
 * 
 * Requirements: 1.1, 1.2, 1.3, 10.4 - Advertiser metrics with device breakdown and trends
 * Enhanced with sparklines, trend indicators, and better data visualization
 */

import { useEffect, useState, useMemo } from 'react'
import { MetricCard } from '../MetricCard'
import { LineChart, DonutChart, BarChart, HeatCalendar, Sparkline } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import { calculateDevicePercentages, calculateCampaignConversionRate } from '../analyticsUtils'
import type { DateRange } from '../types'

interface OverviewData {
  period: {
    page_views: number
    unique_visitors: number
    sessions: number
    returning_visitors: number
    events: Record<string, number>
  }
  totals: {
    unique_visitors: number
    sessions: number
    conversions: number
    conversion_rate: number
  }
  devices: { mobile: number; tablet: number; desktop: number }
  top_referrers: Array<{ source: string; count: number; conversions?: number }>
}

interface DailyData {
  days: Array<{ date: string; views: number; visitors: number; conversions: number }>
}

interface Props {
  dateRange: DateRange
}

export function OverviewPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [daily, setDaily] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [ov, dy] = await Promise.all([
        api.getOverview(dateRange),
        api.getDailyStats(dateRange),
      ])
      setOverview(ov as OverviewData)
      setDaily(dy as DailyData)
      setLoading(false)
    }
    load()
  }, [dateRange])

  // Calculate derived metrics
  const insights = useMemo(() => {
    if (!overview || !daily?.days.length) return null
    
    const days = daily.days
    const totalViews = days.reduce((a, d) => a + d.views, 0)
    const totalVisitors = days.reduce((a, d) => a + d.visitors, 0)
    const avgDailyViews = totalViews / days.length
    const avgDailyVisitors = totalVisitors / days.length
    
    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(days.length / 2)
    const firstHalfViews = days.slice(0, midpoint).reduce((a, d) => a + d.views, 0)
    const secondHalfViews = days.slice(midpoint).reduce((a, d) => a + d.views, 0)
    const viewsTrend = firstHalfViews > 0 
      ? ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100 
      : 0
    
    // Bounce rate approximation (single page sessions)
    const bounceRate = overview.period.sessions > 0
      ? ((overview.period.sessions - overview.period.returning_visitors) / overview.period.sessions) * 100
      : 0
    
    // Pages per session
    const pagesPerSession = overview.period.sessions > 0
      ? overview.period.page_views / overview.period.sessions
      : 0
    
    // New vs returning ratio
    const newVisitorRate = overview.period.unique_visitors > 0
      ? ((overview.period.unique_visitors - overview.period.returning_visitors) / overview.period.unique_visitors) * 100
      : 0
    
    // Peak day
    const peakDay = days.reduce((max, d) => d.views > max.views ? d : max, days[0])
    
    return {
      avgDailyViews: Math.round(avgDailyViews),
      avgDailyVisitors: Math.round(avgDailyVisitors),
      viewsTrend,
      bounceRate,
      pagesPerSession,
      newVisitorRate,
      peakDay,
      sparklineViews: days.map(d => d.views),
      sparklineVisitors: days.map(d => d.visitors),
    }
  }, [overview, daily])

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  if (!overview) {
    return <div className="text-neutral-500 text-center py-12">Failed to load overview data</div>
  }

  // Calculate device percentages (Property 1: sum to 100%)
  const devicePercentages = calculateDevicePercentages(overview.devices)
  
  const deviceData = [
    { label: 'Desktop', value: overview.devices.desktop },
    { label: 'Mobile', value: overview.devices.mobile },
    { label: 'Tablet', value: overview.devices.tablet },
  ]

  const chartData = daily?.days.map(d => ({
    label: d.date.slice(5), // MM-DD
    value: d.views,
  })) || []

  const visitorChartData = daily?.days.map(d => ({
    label: d.date.slice(5),
    value: d.visitors,
  })) || []

  // Event data for bar chart
  const eventData = Object.entries(overview.period.events)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ label: name, value: count }))

  return (
    <div className="space-y-6">
      {/* Key Metrics with Sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wide">Page Views</span>
            {insights && <Sparkline data={insights.sparklineViews} showTrend />}
          </div>
          <div className="text-3xl font-bold text-white">{overview.period.page_views.toLocaleString()}</div>
          {insights && (
            <div className={`text-xs mt-1 ${insights.viewsTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {insights.viewsTrend >= 0 ? '↑' : '↓'} {Math.abs(insights.viewsTrend).toFixed(1)}% trend
            </div>
          )}
        </div>
        
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wide">Unique Visitors</span>
            {insights && <Sparkline data={insights.sparklineVisitors} showTrend />}
          </div>
          <div className="text-3xl font-bold text-white">{overview.period.unique_visitors.toLocaleString()}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {insights?.avgDailyVisitors.toLocaleString()} avg/day
          </div>
        </div>
        
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wide">Sessions</span>
          </div>
          <div className="text-3xl font-bold text-white">{overview.period.sessions.toLocaleString()}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {insights?.pagesPerSession.toFixed(1)} pages/session
          </div>
        </div>
        
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wide">Returning</span>
          </div>
          <div className="text-3xl font-bold text-orange-400">{overview.period.returning_visitors.toLocaleString()}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {insights ? (100 - insights.newVisitorRate).toFixed(0) : 0}% return rate
          </div>
        </div>
      </div>

      {/* Quick Insights Row */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20 p-4">
            <div className="text-xs text-green-400 mb-1">Conversion Rate</div>
            <div className="text-2xl font-bold text-white">{overview.totals.conversion_rate}%</div>
            <div className="text-xs text-neutral-500">{overview.totals.conversions} total</div>
          </div>
          
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="text-xs text-neutral-400 mb-1">Pages/Session</div>
            <div className="text-2xl font-bold text-blue-400">{insights.pagesPerSession.toFixed(1)}</div>
          </div>
          
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="text-xs text-neutral-400 mb-1">New Visitors</div>
            <div className="text-2xl font-bold text-purple-400">{insights.newVisitorRate.toFixed(0)}%</div>
          </div>
          
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="text-xs text-neutral-400 mb-1">Peak Day</div>
            <div className="text-lg font-bold text-white">{insights.peakDay?.date.slice(5)}</div>
            <div className="text-xs text-orange-400">{insights.peakDay?.views.toLocaleString()} views</div>
          </div>
          
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="text-xs text-neutral-400 mb-1">Avg Daily</div>
            <div className="text-2xl font-bold text-white">{insights.avgDailyViews.toLocaleString()}</div>
            <div className="text-xs text-neutral-500">views/day</div>
          </div>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Chart - Enhanced */}
        <div className="lg:col-span-2 bg-white/5 rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-400">Traffic Overview</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-neutral-500">Views</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-neutral-500">Visitors</span>
              </span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <div className="space-y-4">
              <LineChart data={chartData} height={120} showLabels showGrid />
              <div className="h-px bg-white/10" />
              <LineChart data={visitorChartData} height={60} color="#3b82f6" />
            </div>
          ) : (
            <div className="text-neutral-500 text-sm text-center py-8">No traffic data for this period</div>
          )}
        </div>

        {/* Device Breakdown - Enhanced */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Device Breakdown</h3>
          <DonutChart 
            data={deviceData} 
            size={100} 
            showPercentages
            centerLabel="Total"
            colors={['#3b82f6', '#f97316', '#22c55e']}
          />
          
          {/* Device comparison bars */}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            {deviceData.map((d, i) => {
              const pct = devicePercentages[d.label.toLowerCase() as keyof typeof devicePercentages]
              const colors = ['#3b82f6', '#f97316', '#22c55e']
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-16">{d.label}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: colors[i] }}
                    />
                  </div>
                  <span className="text-xs text-white font-medium w-10 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Conversion & All-Time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Visitors (All Time)" 
          value={overview.totals.unique_visitors}
          icon={<span className="text-lg">👥</span>}
        />
        <MetricCard 
          label="Total Sessions (All Time)" 
          value={overview.totals.sessions}
          icon={<span className="text-lg">📊</span>}
        />
        <MetricCard 
          label="Total Conversions" 
          value={overview.totals.conversions}
          variant="success"
          icon={<span className="text-lg">🎯</span>}
        />
        <MetricCard 
          label="Conversion Rate" 
          value={`${overview.totals.conversion_rate}%`}
          variant={overview.totals.conversion_rate > 5 ? 'success' : overview.totals.conversion_rate > 2 ? 'warning' : 'danger'}
          icon={<span className="text-lg">📈</span>}
        />
      </div>

      {/* Top Referrers & Events - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Traffic Sources with visual bars */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Traffic Sources</h3>
          {overview.top_referrers.length > 0 ? (
            <div className="space-y-3">
              {overview.top_referrers.slice(0, 8).map((ref, i) => {
                const maxCount = overview.top_referrers[0]?.count || 1
                const pct = (ref.count / maxCount) * 100
                const conversionRate = ref.conversions !== undefined 
                  ? calculateCampaignConversionRate(ref.conversions, ref.count)
                  : null
                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-neutral-300 truncate flex-1">{ref.source || 'Direct'}</span>
                      <span className="text-white font-medium">{ref.count.toLocaleString()}</span>
                      {conversionRate !== null && (
                        <span className={`ml-3 text-xs px-1.5 py-0.5 rounded ${
                          conversionRate > 5 ? 'bg-green-500/20 text-green-400' : 
                          conversionRate > 2 ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-neutral-500/20 text-neutral-400'
                        }`}>
                          {conversionRate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-neutral-500 text-sm text-center py-4">No referrer data</div>
          )}
        </div>

        {/* Events - Enhanced with bar chart */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Events</h3>
          {eventData.length > 0 ? (
            <BarChart data={eventData} height={180} horizontal color="#3b82f6" />
          ) : (
            <div className="text-neutral-500 text-sm text-center py-4">No events tracked</div>
          )}
        </div>
      </div>

      {/* Activity Heatmap */}
      {daily?.days && daily.days.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Activity Heatmap (Last 12 Weeks)</h3>
          <div className="flex items-center gap-4">
            <HeatCalendar 
              data={daily.days.map(d => ({ date: d.date, value: d.views }))} 
              weeks={12}
            />
            <div className="flex flex-col gap-1 text-xs text-neutral-500">
              <span>Less</span>
              <div className="flex gap-0.5">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
                  <div key={o} className="w-2.5 h-2.5 rounded-sm bg-orange-500" style={{ opacity: o }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
