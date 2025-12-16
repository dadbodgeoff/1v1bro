/**
 * RealtimePanel - Live visitor tracking
 */

import { useEffect, useState, useCallback } from 'react'
import { DonutChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'

interface RealtimeData {
  active_users: number
  sessions: Array<{
    session_id: string
    current_page: string
    device_type: string
    last_activity: string
  }>
  pages: Array<{ page: string; count: number }>
  devices: { mobile: number; tablet: number; desktop: number }
}

export function RealtimePanel() {
  const api = useAnalyticsAPI()
  const [data, setData] = useState<RealtimeData | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const refresh = useCallback(async () => {
    const result = await api.getRealtime()
    if (result) {
      setData(result as RealtimeData)
      setLastUpdate(new Date())
    }
  }, [api])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [refresh])

  const deviceData = data ? [
    { label: 'Desktop', value: data.devices.desktop },
    { label: 'Mobile', value: data.devices.mobile },
    { label: 'Tablet', value: data.devices.tablet },
  ] : []

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return `${secs}s ago`
    const mins = Math.floor(secs / 60)
    return `${mins}m ago`
  }

  return (
    <div className="space-y-6">
      {/* Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-neutral-400">
            Live • Updated {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Active Users - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl border p-6 ${
          data?.active_users 
            ? 'bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30' 
            : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${data?.active_users ? 'bg-green-500 animate-pulse' : 'bg-neutral-600'}`} />
            <span className="text-xs text-neutral-400 uppercase tracking-wide">Active Users</span>
          </div>
          <div className={`text-4xl font-bold ${data?.active_users ? 'text-green-400' : 'text-neutral-500'}`}>
            {data?.active_users ?? 0}
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            {data?.active_users ? 'users online now' : 'no active users'}
          </div>
        </div>
        <div className="md:col-span-2 bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Device Breakdown</h3>
          {deviceData.some(d => d.value > 0) ? (
            <DonutChart data={deviceData} size={80} showPercentages />
          ) : (
            <div className="text-neutral-500 text-sm text-center py-4">No active sessions</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Pages */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Active Pages</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data?.pages.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-neutral-300 font-mono text-xs truncate flex-1">{p.page}</span>
                <span className="text-green-400 font-medium ml-2">{p.count}</span>
              </div>
            ))}
            {(!data?.pages || data.pages.length === 0) && (
              <div className="text-neutral-500 text-sm">No active pages</div>
            )}
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">
            Active Sessions ({data?.sessions.length || 0})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data?.sessions.slice(0, 20).map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 bg-white/5 rounded">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-neutral-300 truncate">{s.current_page}</div>
                  <div className="text-xs text-neutral-500">{s.device_type}</div>
                </div>
                <span className="text-xs text-neutral-500 ml-2">{formatTime(s.last_activity)}</span>
              </div>
            ))}
            {(!data?.sessions || data.sessions.length === 0) && (
              <div className="text-neutral-500 text-sm">No active sessions</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
