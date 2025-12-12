/**
 * DataVerification - Analytics Data Integrity Check
 * 
 * Verifies that analytics data is being properly collected and stored.
 * Shows recent data samples and identifies potential issues.
 */

import { useState, useEffect } from 'react'
import { API_BASE } from '@/utils/constants'

interface DataCounts {
  sessions: number
  pageViews: number
  events: number
  journeys: number
  performance: number
  clicks: number
  errors: number
}

interface DataVerificationProps {
  token: string
  dateRange: { start: string; end: string }
}

export function DataVerification({ token, dateRange }: DataVerificationProps) {
  const [counts, setCounts] = useState<DataCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<string[]>([])

  useEffect(() => {
    const fetchVerificationData = async () => {
      setLoading(true)
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      const params = `start_date=${dateRange.start}&end_date=${dateRange.end}`

      try {
        // Fetch counts from various endpoints
        const [overviewRes, journeysRes, performanceRes, errorsRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/dashboard/overview?${params}`, { headers }),
          fetch(`${API_BASE}/analytics/enterprise/dashboard/journeys?${params}&per_page=1`, { headers }),
          fetch(`${API_BASE}/analytics/enterprise/dashboard/performance?${params}&per_page=1`, { headers }),
          fetch(`${API_BASE}/analytics/enterprise/dashboard/errors?${params}&per_page=1`, { headers }),
        ])

        const [overview, journeys, performance, errors] = await Promise.all([
          overviewRes.json(),
          journeysRes.json(),
          performanceRes.json(),
          errorsRes.json(),
        ])

        // Extract counts
        const newCounts: DataCounts = {
          sessions: overview.data?.period?.sessions || 0,
          pageViews: overview.data?.period?.page_views || 0,
          events: Object.values(overview.data?.period?.events || {}).reduce((a: number, b) => a + (b as number), 0) as number,
          journeys: journeys.data?.total || 0,
          performance: performance.data?.total || 0,
          clicks: 0, // Would need separate endpoint
          errors: errors.data?.total || 0,
        }
        setCounts(newCounts)

        // Identify issues
        const newIssues: string[] = []
        
        if (newCounts.sessions === 0) {
          newIssues.push('No sessions recorded - check session tracking initialization')
        }
        if (newCounts.pageViews === 0) {
          newIssues.push('No page views recorded - check route change tracking')
        }
        if (newCounts.journeys === 0 && newCounts.sessions > 0) {
          newIssues.push('Sessions exist but no journeys - check enterprise journey tracking')
        }
        if (newCounts.performance === 0) {
          newIssues.push('No performance data - Core Web Vitals may not be tracking')
        }
        
        // Check for data freshness
        const today = new Date().toISOString().split('T')[0]
        if (dateRange.end === today && newCounts.sessions === 0) {
          newIssues.push('No data for today - tracking may be disabled or broken')
        }

        setIssues(newIssues)
      } catch (err) {
        setIssues(['Failed to fetch verification data - API may be unavailable'])
      } finally {
        setLoading(false)
      }
    }

    fetchVerificationData()
  }, [token, dateRange])

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-20 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  const hasIssues = issues.length > 0
  const dataHealth = !hasIssues ? 'healthy' : issues.length <= 2 ? 'warning' : 'critical'

  return (
    <div className="bg-white/5 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-neutral-400">Data Verification</h2>
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${
            dataHealth === 'healthy' ? 'bg-green-500/20 text-green-400' :
            dataHealth === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {dataHealth === 'healthy' ? 'Data Healthy' :
             dataHealth === 'warning' ? 'Minor Issues' : 'Critical Issues'}
          </div>
        </div>
        <span className="text-xs text-neutral-500">
          {dateRange.start} → {dateRange.end}
        </span>
      </div>

      {/* Data Counts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
        <DataCountCard label="Sessions" count={counts?.sessions || 0} icon="👤" />
        <DataCountCard label="Page Views" count={counts?.pageViews || 0} icon="📄" />
        <DataCountCard label="Events" count={counts?.events || 0} icon="🎯" />
        <DataCountCard label="Journeys" count={counts?.journeys || 0} icon="🛤️" />
        <DataCountCard label="Performance" count={counts?.performance || 0} icon="⚡" />
        <DataCountCard label="Clicks" count={counts?.clicks || 0} icon="👆" />
        <DataCountCard label="Errors" count={counts?.errors || 0} icon="🐛" />
      </div>

      {/* Issues */}
      {hasIssues && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-neutral-400">Potential Issues</h3>
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded-lg">
              <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs text-yellow-200">{issue}</span>
            </div>
          ))}
        </div>
      )}

      {!hasIssues && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-green-200">All analytics systems are collecting data properly</span>
        </div>
      )}
    </div>
  )
}

function DataCountCard({ label, count, icon }: { label: string; count: number; icon: string }) {
  const isZero = count === 0
  return (
    <div className={`p-3 rounded-lg ${isZero ? 'bg-red-500/5 border border-red-500/20' : 'bg-white/5'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-neutral-400">{label}</span>
      </div>
      <div className={`text-lg font-bold ${isZero ? 'text-red-400' : 'text-white'}`}>
        {count.toLocaleString()}
      </div>
    </div>
  )
}
