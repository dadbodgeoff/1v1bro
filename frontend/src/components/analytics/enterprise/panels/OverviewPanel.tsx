/**
 * OverviewPanel - Main analytics overview with key metrics
 */

import { useEffect, useState } from 'react'
import { MetricCard } from '../MetricCard'
import { LineChart, DonutChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
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
  top_referrers: Array<{ source: string; count: number }>
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

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  if (!overview) {
    return <div className="text-neutral-500 text-center py-12">Failed to load overview data</div>
  }

  const deviceData = [
    { label: 'Desktop', value: overview.devices.desktop },
    { label: 'Mobile', value: overview.devices.mobile },
    { label: 'Tablet', value: overview.devices.tablet },
  ]

  const chartData = daily?.days.map(d => ({
    label: d.date.slice(5), // MM-DD
    value: d.views,
  })) || []

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Page Views" 
          value={overview.period.page_views} 
          size="lg"
        />
        <MetricCard 
          label="Unique Visitors" 
          value={overview.period.unique_visitors}
          size="lg"
        />
        <MetricCard 
          label="Sessions" 
          value={overview.period.sessions}
          size="lg"
        />
        <MetricCard 
          label="Returning" 
          value={overview.period.returning_visitors}
          size="lg"
        />
      </div>

      {/* Conversion Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Visitors (All Time)" 
          value={overview.totals.unique_visitors}
        />
        <MetricCard 
          label="Total Sessions (All Time)" 
          value={overview.totals.sessions}
        />
        <MetricCard 
          label="Conversions" 
          value={overview.totals.conversions}
          variant="success"
        />
        <MetricCard 
          label="Conversion Rate" 
          value={`${overview.totals.conversion_rate}%`}
          variant={overview.totals.conversion_rate > 5 ? 'success' : 'warning'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Chart */}
        <div className="lg:col-span-2 bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Daily Traffic</h3>
          {chartData.length > 0 ? (
            <LineChart data={chartData} height={150} showLabels />
          ) : (
            <div className="text-neutral-500 text-sm">No traffic data</div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Devices</h3>
          <DonutChart data={deviceData} size={120} />
        </div>
      </div>

      {/* Top Referrers & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Referrers</h3>
          <div className="space-y-2">
            {overview.top_referrers.slice(0, 8).map((ref, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-neutral-300 truncate">{ref.source || 'Direct'}</span>
                <span className="text-orange-400 font-medium">{ref.count}</span>
              </div>
            ))}
            {overview.top_referrers.length === 0 && (
              <div className="text-neutral-500 text-sm">No referrer data</div>
            )}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Events</h3>
          <div className="space-y-2">
            {Object.entries(overview.period.events)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([name, count], i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300 truncate font-mono text-xs">{name}</span>
                  <span className="text-blue-400 font-medium">{count}</span>
                </div>
              ))}
            {Object.keys(overview.period.events).length === 0 && (
              <div className="text-neutral-500 text-sm">No events tracked</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
