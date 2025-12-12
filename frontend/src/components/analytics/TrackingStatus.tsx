/**
 * TrackingStatus - Analytics Health Monitor
 * 
 * Shows real-time status of all analytics tracking systems.
 * Helps verify that tracking is working correctly.
 */

import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/utils/constants'

interface TrackingEndpoint {
  name: string
  endpoint: string
  description: string
  lastSuccess: Date | null
  lastError: string | null
  status: 'ok' | 'warning' | 'error' | 'unknown'
}

interface TrackingStatusProps {
  token?: string
  compact?: boolean
}

// Check if running on localhost
const isLocalhost = () => {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'
}

export function TrackingStatus({ compact = false }: TrackingStatusProps) {
  const [endpoints, setEndpoints] = useState<TrackingEndpoint[]>([
    { name: 'Sessions', endpoint: '/analytics/session', description: 'Session initialization', lastSuccess: null, lastError: null, status: 'unknown' },
    { name: 'Page Views', endpoint: '/analytics/pageview', description: 'Page view tracking', lastSuccess: null, lastError: null, status: 'unknown' },
    { name: 'Events', endpoint: '/analytics/event', description: 'Custom event tracking', lastSuccess: null, lastError: null, status: 'unknown' },
    { name: 'Journeys', endpoint: '/analytics/enterprise/track/journey-step', description: 'User journey steps', lastSuccess: null, lastError: null, status: 'unknown' },
    { name: 'Performance', endpoint: '/analytics/enterprise/track/performance', description: 'Core Web Vitals', lastSuccess: null, lastError: null, status: 'unknown' },
    { name: 'Clicks', endpoint: '/analytics/enterprise/track/click', description: 'Click heatmap data', lastSuccess: null, lastError: null, status: 'unknown' },
    { name: 'Scroll', endpoint: '/analytics/enterprise/track/scroll', description: 'Scroll depth tracking', lastSuccess: null, lastError: null, status: 'unknown' },
    { name: 'Errors', endpoint: '/analytics/enterprise/track/error', description: 'JS error tracking', lastSuccess: null, lastError: null, status: 'unknown' },
    { name: 'Heartbeat', endpoint: '/analytics/enterprise/track/heartbeat', description: 'Real-time presence', lastSuccess: null, lastError: null, status: 'unknown' },
  ])
  
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const localhostWarning = isLocalhost()

  // Get the appropriate test payload for each endpoint
  const getTestPayload = (endpointName: string): Record<string, unknown> => {
    const base = {
      session_id: 'health_check_test',
      visitor_id: 'health_check_test',
    }
    
    switch (endpointName) {
      case 'Sessions':
        return { ...base, device_type: 'desktop', browser: 'Chrome', os: 'Test' }
      case 'Page Views':
        return { ...base, page: '/health-check' }
      case 'Events':
        return { ...base, event_name: 'health_check', page: '/health-check' }
      case 'Journeys':
        return { ...base, step_type: 'pageview', page: '/health-check' }
      case 'Performance':
        return { ...base, page: '/health-check', lcp_ms: 100 }
      case 'Clicks':
        return { ...base, page: '/health-check', x_percent: 50, y_percent: 50 }
      case 'Scroll':
        return { ...base, page: '/health-check', max_scroll_percent: 100 }
      case 'Errors':
        return { ...base, error_type: 'health_check', error_message: 'Health check test' }
      case 'Heartbeat':
        return { ...base, current_page: '/health-check' }
      default:
        return { ...base, page: '/health-check' }
    }
  }

  const checkEndpoint = async (endpoint: TrackingEndpoint): Promise<TrackingEndpoint> => {
    try {
      const payload = getTestPayload(endpoint.name)
      const res = await fetch(`${API_BASE}${endpoint.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (res.ok) {
        return { ...endpoint, status: 'ok', lastSuccess: new Date(), lastError: null }
      } else {
        return { ...endpoint, status: 'error', lastError: `HTTP ${res.status}` }
      }
    } catch (err) {
      return { ...endpoint, status: 'error', lastError: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const runHealthCheck = useCallback(async () => {
    setChecking(true)
    const results = await Promise.all(endpoints.map(checkEndpoint))
    setEndpoints(results)
    setLastCheck(new Date())
    setChecking(false)
  }, [endpoints])

  // Auto-check on mount
  useEffect(() => {
    runHealthCheck()
  }, [])

  const okCount = endpoints.filter(e => e.status === 'ok').length
  const errorCount = endpoints.filter(e => e.status === 'error').length
  const overallStatus = errorCount > 0 ? 'error' : okCount === endpoints.length ? 'ok' : 'warning'

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          overallStatus === 'ok' ? 'bg-green-500' :
          overallStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <span className="text-xs text-neutral-400">
          {okCount}/{endpoints.length} tracking
        </span>
        {localhostWarning && (
          <span className="text-xs text-yellow-400">(localhost - disabled)</span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-neutral-400">Tracking Health</h2>
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${
            overallStatus === 'ok' ? 'bg-green-500/20 text-green-400' :
            overallStatus === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {overallStatus === 'ok' ? 'All Systems Operational' :
             overallStatus === 'warning' ? 'Partial Issues' : 'Issues Detected'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastCheck && (
            <span className="text-xs text-neutral-500">
              Last check: {lastCheck.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={runHealthCheck}
            disabled={checking}
            className="px-3 py-1.5 bg-white/5 rounded-lg text-xs hover:bg-white/10 disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Refresh'}
          </button>
        </div>
      </div>

      {localhostWarning && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Localhost detected - Analytics tracking is disabled to prevent test data pollution</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {endpoints.map((endpoint) => (
          <div
            key={endpoint.name}
            className={`p-3 rounded-lg border ${
              endpoint.status === 'ok' ? 'bg-green-500/5 border-green-500/20' :
              endpoint.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
              'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{endpoint.name}</span>
              <div className={`w-2 h-2 rounded-full ${
                endpoint.status === 'ok' ? 'bg-green-500' :
                endpoint.status === 'error' ? 'bg-red-500' :
                'bg-neutral-500'
              }`} />
            </div>
            <p className="text-xs text-neutral-500">{endpoint.description}</p>
            {endpoint.lastError && (
              <p className="text-xs text-red-400 mt-1">{endpoint.lastError}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <h3 className="text-xs font-medium text-neutral-400 mb-2">What's Being Tracked</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-neutral-400">Page views & navigation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-neutral-400">User journeys & funnels</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-neutral-400">Click heatmaps</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="text-neutral-400">Core Web Vitals</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span className="text-neutral-400">Scroll depth</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-neutral-400">JS errors</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <span className="text-neutral-400">A/B experiments</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            <span className="text-neutral-400">Real-time presence</span>
          </div>
        </div>
      </div>
    </div>
  )
}
