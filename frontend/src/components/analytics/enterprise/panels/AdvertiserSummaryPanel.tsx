/**
 * AdvertiserSummaryPanel - One-page executive summary for advertisers
 * 
 * All key metrics in a single, shareable view
 */

import { useEffect, useState } from 'react'
import { KPICard } from '../MetricCard'
import { DonutChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface SummaryData {
  period: {
    start: string
    end: string
  }
  reach: {
    unique_visitors: number
    total_sessions: number
    page_views: number
    pages_per_session: number
  }
  engagement: {
    dau: number
    mau: number
    stickiness: number
  }
  conversion: {
    total_conversions: number
    conversion_rate: number
  }
  audience: {
    devices: { mobile: number; tablet: number; desktop: number }
    top_countries: Array<{ name: string; count: number }>
  }
}

interface Props {
  dateRange: DateRange
}

export function AdvertiserSummaryPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getAdvertiserSummary(dateRange)
      setData(result as SummaryData)
      setLoading(false)
    }
    load()
  }, [dateRange])

  const handleExport = () => {
    if (!data) return
    
    const report = `
# Analytics Summary Report
Generated: ${new Date().toLocaleDateString()}
Period: ${data.period.start} to ${data.period.end}

## Reach
- Unique Visitors: ${data.reach.unique_visitors.toLocaleString()}
- Total Sessions: ${data.reach.total_sessions.toLocaleString()}
- Page Views: ${data.reach.page_views.toLocaleString()}
- Pages per Session: ${data.reach.pages_per_session}

## Engagement
- Daily Active Users: ${data.engagement.dau.toLocaleString()}
- Monthly Active Users: ${data.engagement.mau.toLocaleString()}
- Stickiness (DAU/MAU): ${data.engagement.stickiness}%

## Conversion
- Total Conversions: ${data.conversion.total_conversions.toLocaleString()}
- Conversion Rate: ${data.conversion.conversion_rate}%

## Audience
- Mobile: ${data.audience.devices.mobile}%
- Desktop: ${data.audience.devices.desktop}%
- Tablet: ${data.audience.devices.tablet}%

### Top Countries
${data.audience.top_countries.map((c, i) => `${i + 1}. ${c.name}: ${c.count.toLocaleString()} visitors`).join('\n')}
    `.trim()
    
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-summary-${data.period.start}-${data.period.end}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-neutral-500 text-center py-12">Failed to load summary data</div>
  }

  const deviceData = [
    { label: 'Desktop', value: data.audience.devices.desktop },
    { label: 'Mobile', value: data.audience.devices.mobile },
    { label: 'Tablet', value: data.audience.devices.tablet },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Advertiser Summary</h2>
          <p className="text-sm text-neutral-400">
            {data.period.start} to {data.period.end}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>📄</span>
          Export Report
        </button>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Reach"
          value={data.reach.unique_visitors.toLocaleString()}
          subtitle="Unique visitors"
          icon="👥"
          color="blue"
        />
        <KPICard
          title="Engagement"
          value={`${data.engagement.stickiness}%`}
          subtitle="DAU/MAU stickiness"
          icon="🔥"
          color={data.engagement.stickiness > 20 ? 'green' : data.engagement.stickiness > 10 ? 'orange' : 'red'}
        />
        <KPICard
          title="Conversions"
          value={data.conversion.total_conversions.toLocaleString()}
          subtitle={`${data.conversion.conversion_rate}% rate`}
          icon="🎯"
          color="green"
        />
        <KPICard
          title="Page Views"
          value={data.reach.page_views.toLocaleString()}
          subtitle={`${data.reach.pages_per_session} per session`}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reach Details */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
            <span>📈</span> Reach Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Unique Visitors</span>
              <span className="text-xl font-bold text-white">{data.reach.unique_visitors.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Total Sessions</span>
              <span className="text-xl font-bold text-white">{data.reach.total_sessions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Page Views</span>
              <span className="text-xl font-bold text-white">{data.reach.page_views.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Pages/Session</span>
              <span className="text-xl font-bold text-orange-400">{data.reach.pages_per_session}</span>
            </div>
          </div>
        </div>

        {/* Engagement Details */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
            <span>🔥</span> Engagement Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Daily Active Users</span>
              <span className="text-xl font-bold text-blue-400">{data.engagement.dau.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Monthly Active Users</span>
              <span className="text-xl font-bold text-purple-400">{data.engagement.mau.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Stickiness (DAU/MAU)</span>
              <span className={`text-xl font-bold ${data.engagement.stickiness > 20 ? 'text-green-400' : data.engagement.stickiness > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                {data.engagement.stickiness}%
              </span>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-neutral-500 mb-1">Engagement Rating</div>
              <div className="text-sm text-white">
                {data.engagement.stickiness > 20 
                  ? '⭐⭐⭐ Excellent - Highly engaged audience'
                  : data.engagement.stickiness > 10
                  ? '⭐⭐ Good - Solid engagement'
                  : '⭐ Growing - Building engagement'}
              </div>
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
            <span>📱</span> Device Breakdown
          </h3>
          <DonutChart 
            data={deviceData} 
            size={100} 
            showPercentages 
            colors={['#3b82f6', '#f97316', '#22c55e']}
          />
          <div className="mt-4 space-y-2">
            {deviceData.map((d, i) => {
              const colors = ['text-blue-400', 'text-orange-400', 'text-green-400']
              return (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-neutral-400">{d.label}</span>
                  <span className={`font-medium ${colors[i]}`}>{d.value}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Countries */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
          <span>🌍</span> Top Geographic Markets
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {data.audience.top_countries.map((country, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">#{i + 1}</div>
              <div className="font-medium text-white">{country.name}</div>
              <div className="text-sm text-neutral-400">{country.count.toLocaleString()} visitors</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-xl border border-orange-500/30 p-6">
        <h3 className="text-lg font-bold text-white mb-4">📊 Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-orange-400 mb-2">Audience Profile</h4>
            <ul className="space-y-1 text-neutral-300">
              <li>• {data.reach.unique_visitors.toLocaleString()} unique visitors in period</li>
              <li>• {data.audience.devices.mobile > 50 ? 'Mobile-first' : 'Desktop-dominant'} audience ({Math.max(data.audience.devices.mobile, data.audience.devices.desktop)}%)</li>
              <li>• Primary market: {data.audience.top_countries[0]?.name || 'N/A'}</li>
              <li>• {data.reach.pages_per_session} pages viewed per session average</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-400 mb-2">Performance Highlights</h4>
            <ul className="space-y-1 text-neutral-300">
              <li>• {data.conversion.conversion_rate}% visitor-to-signup conversion rate</li>
              <li>• {data.engagement.stickiness}% DAU/MAU stickiness ratio</li>
              <li>• {data.engagement.dau.toLocaleString()} daily active users</li>
              <li>• {data.conversion.total_conversions.toLocaleString()} total conversions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
