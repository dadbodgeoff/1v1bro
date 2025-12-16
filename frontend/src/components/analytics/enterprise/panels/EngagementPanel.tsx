/**
 * EngagementPanel - DAU/MAU, stickiness, retention metrics
 * 
 * Key metrics for advertisers to understand user engagement depth
 */

import { useEffect, useState } from 'react'
import { MetricCard, KPICard } from '../MetricCard'
import { BarChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface EngagementData {
  dau: number
  wau: number
  mau: number
  stickiness: number
  sessions_per_user_weekly: number
  avg_session_duration_seconds: number
  bounce_rate: number
  retention: {
    d1: number
    d7: number
    d30: number
  }
}

interface Props {
  dateRange: DateRange
}

export function EngagementPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [data, setData] = useState<EngagementData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getEngagement(dateRange)
      setData(result as EngagementData)
      setLoading(false)
    }
    load()
  }, [dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-neutral-500 text-center py-12">Failed to load engagement data</div>
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  // Retention funnel data
  const retentionData = [
    { label: 'Day 1', value: data.retention.d1 },
    { label: 'Day 7', value: data.retention.d7 },
    { label: 'Day 30', value: data.retention.d30 },
  ]

  // Active users comparison
  const activeUsersData = [
    { label: 'DAU', value: data.dau },
    { label: 'WAU', value: data.wau },
    { label: 'MAU', value: data.mau },
  ]

  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Daily Active Users"
          value={data.dau}
          subtitle="Users active today"
          icon="👥"
          color="blue"
        />
        <KPICard
          title="Monthly Active Users"
          value={data.mau}
          subtitle="Users active in last 30 days"
          icon="📊"
          color="purple"
        />
        <KPICard
          title="Stickiness (DAU/MAU)"
          value={`${data.stickiness}%`}
          subtitle={data.stickiness > 20 ? 'Excellent engagement' : data.stickiness > 10 ? 'Good engagement' : 'Room for improvement'}
          icon="🔥"
          color={data.stickiness > 20 ? 'green' : data.stickiness > 10 ? 'orange' : 'red'}
        />
      </div>

      {/* Active Users Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Active Users Breakdown</h3>
          <BarChart data={activeUsersData} height={150} color="#3b82f6" />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-neutral-500">DAU</div>
              <div className="text-lg font-bold text-blue-400">{data.dau.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">WAU</div>
              <div className="text-lg font-bold text-purple-400">{data.wau.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">MAU</div>
              <div className="text-lg font-bold text-orange-400">{data.mau.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Retention Curve</h3>
          <BarChart data={retentionData} height={150} color="#22c55e" />
          <div className="mt-4 space-y-2">
            {retentionData.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{r.label} Retention</span>
                <span className={`text-sm font-medium ${r.value > 30 ? 'text-green-400' : r.value > 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {r.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Sessions/User/Week"
          value={data.sessions_per_user_weekly}
          icon={<span className="text-lg">🔄</span>}
          description="Average sessions per user"
        />
        <MetricCard
          label="Avg Session Duration"
          value={formatDuration(data.avg_session_duration_seconds)}
          icon={<span className="text-lg">⏱️</span>}
          description="Time spent per session"
        />
        <MetricCard
          label="Bounce Rate"
          value={`${data.bounce_rate}%`}
          variant={data.bounce_rate < 40 ? 'success' : data.bounce_rate < 60 ? 'warning' : 'danger'}
          icon={<span className="text-lg">↩️</span>}
          description="Single-page sessions"
        />
        <MetricCard
          label="WAU"
          value={data.wau}
          icon={<span className="text-lg">📅</span>}
          description="Weekly active users"
        />
      </div>

      {/* Engagement Score */}
      <div className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 rounded-xl border border-orange-500/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-1">Engagement Score</h3>
            <p className="text-sm text-neutral-400">
              Based on stickiness, retention, and session frequency
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-orange-400">
              {Math.round((data.stickiness * 0.4) + (data.retention.d7 * 0.3) + (Math.min(data.sessions_per_user_weekly * 10, 30) * 0.3))}
            </div>
            <div className="text-xs text-neutral-500">out of 100</div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((data.stickiness * 0.4) + (data.retention.d7 * 0.3) + (Math.min(data.sessions_per_user_weekly * 10, 30) * 0.3))}%` }}
          />
        </div>
      </div>
    </div>
  )
}
