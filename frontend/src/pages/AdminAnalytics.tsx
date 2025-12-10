/**
 * AdminAnalytics - Analytics dashboard for admins
 * 
 * Shows page views, visitors, conversions, device breakdown, and referrers.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { API_BASE } from '@/utils/constants'

interface OverviewData {
  today: {
    page_views: number
    unique_visitors: number
    events: Record<string, number>
  }
  totals: {
    visitors: number
    conversions: number
    conversion_rate: number
  }
  devices: {
    mobile: number
    tablet: number
    desktop: number
  }
  top_referrers: Array<{ source: string; count: number }>
}

interface DailyData {
  days: Array<{
    date: string
    views: number
    visitors: number
    conversions: number
  }>
}

// Admin emails allowed to access this page
const ADMIN_EMAILS = ['dadbodgeoff@gmail.com']

export function AdminAnalytics() {
  const navigate = useNavigate()
  const { token, isAuthenticated, user } = useAuthStore()
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [daily, setDaily] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Check if user is admin
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      navigate('/dashboard')
      return
    }

    async function fetchData() {
      try {
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }

        const [overviewRes, dailyRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/dashboard/overview`, { headers }),
          fetch(`${API_BASE}/analytics/dashboard/daily?days=14`, { headers }),
        ])

        const overviewData = await overviewRes.json()
        const dailyData = await dailyRes.json()

        if (overviewData.success) setOverview(overviewData.data)
        if (dailyData.success) setDaily(dailyData.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, token, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  const maxViews = Math.max(...(daily?.days.map(d => d.views) || [1]))

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-neutral-400 hover:text-white"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Today's Views"
            value={overview?.today.page_views || 0}
            color="orange"
          />
          <StatCard
            label="Today's Visitors"
            value={overview?.today.unique_visitors || 0}
            color="blue"
          />
          <StatCard
            label="Total Visitors"
            value={overview?.totals.visitors || 0}
            color="purple"
          />
          <StatCard
            label="Conversion Rate"
            value={`${overview?.totals.conversion_rate || 0}%`}
            color="green"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Views Chart */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Views (14 days)</h2>
            <div className="flex items-end gap-1 h-40">
              {daily?.days.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 bg-orange-500/80 rounded-t hover:bg-orange-500 transition-colors relative group"
                  style={{ height: `${(day.views / maxViews) * 100}%`, minHeight: '4px' }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {day.date}: {day.views} views
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-500">
              <span>{daily?.days[0]?.date}</span>
              <span>{daily?.days[daily.days.length - 1]?.date}</span>
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Device Breakdown (7 days)</h2>
            <div className="space-y-4">
              {overview && (
                <>
                  <DeviceBar
                    label="Desktop"
                    count={overview.devices.desktop}
                    total={overview.devices.desktop + overview.devices.mobile + overview.devices.tablet}
                    color="blue"
                  />
                  <DeviceBar
                    label="Mobile"
                    count={overview.devices.mobile}
                    total={overview.devices.desktop + overview.devices.mobile + overview.devices.tablet}
                    color="green"
                  />
                  <DeviceBar
                    label="Tablet"
                    count={overview.devices.tablet}
                    total={overview.devices.desktop + overview.devices.mobile + overview.devices.tablet}
                    color="purple"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Referrers */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Top Referrers (7 days)</h2>
            <div className="space-y-2">
              {overview?.top_referrers.length === 0 && (
                <p className="text-neutral-500 text-sm">No referrer data yet</p>
              )}
              {overview?.top_referrers.map((ref, i) => (
                <div key={ref.source} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm">
                    <span className="text-neutral-500 mr-2">{i + 1}.</span>
                    {ref.source || 'Direct'}
                  </span>
                  <span className="text-sm font-medium text-orange-400">{ref.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Events */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Today's Events</h2>
            <div className="space-y-2">
              {Object.keys(overview?.today.events || {}).length === 0 && (
                <p className="text-neutral-500 text-sm">No events today</p>
              )}
              {Object.entries(overview?.today.events || {}).map(([event, count]) => (
                <div key={event} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm">{formatEventName(event)}</span>
                  <span className="text-sm font-medium text-blue-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="mt-8 bg-white/5 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">All Time Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{overview?.totals.visitors || 0}</div>
              <div className="text-sm text-neutral-500">Total Visitors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">{overview?.totals.conversions || 0}</div>
              <div className="text-sm text-neutral-500">Signups</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">{overview?.totals.conversion_rate || 0}%</div>
              <div className="text-sm text-neutral-500">Conversion Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorClasses = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  }

  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="text-sm text-neutral-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </div>
    </div>
  )
}

function DeviceBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-neutral-400">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color as keyof typeof colorClasses]} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function formatEventName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default AdminAnalytics
