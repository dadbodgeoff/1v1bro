/**
 * OverviewPanel - Main analytics overview with key metrics
 * 
 * Requirements: 1.1, 1.2, 1.3, 10.4 - Advertiser metrics with device breakdown and trends
 */

import { useEffect, useState } from 'react'
import { MetricCard } from '../MetricCard'
import { LineChart, DonutChart } from '../MiniChart'
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

        {/* Device Breakdown with Percentages */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Devices</h3>
          <div className="flex items-center gap-4">
            <DonutChart data={deviceData} size={100} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-neutral-300">Desktop</span>
                </span>
                <span className="text-white font-medium">{devicePercentages.desktop}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-neutral-300">Mobile</span>
                </span>
                <span className="text-white font-medium">{devicePercentages.mobile}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-neutral-300">Tablet</span>
                </span>
                <span className="text-white font-medium">{devicePercentages.tablet}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Referrers & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Traffic Sources with Conversion Rates */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Traffic Sources</h3>
          <div className="space-y-2">
            {overview.top_referrers.slice(0, 8).map((ref, i) => {
              const conversionRate = ref.conversions !== undefined 
                ? calculateCampaignConversionRate(ref.conversions, ref.count)
                : null
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300 truncate flex-1">{ref.source || 'Direct'}</span>
                  <span className="text-orange-400 font-medium w-16 text-right">{ref.count}</span>
                  {conversionRate !== null && (
                    <span className="text-green-400 font-medium w-16 text-right">
                      {conversionRate.toFixed(1)}%
                    </span>
                  )}
                </div>
              )
            })}
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
