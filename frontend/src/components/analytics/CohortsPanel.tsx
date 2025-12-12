/**
 * CohortsPanel - Retention Cohort Analysis
 * 
 * Displays user retention data grouped by cohort (signup date).
 * Shows retention curves and allows filtering by acquisition source.
 */

import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/utils/constants'

interface CohortData {
  cohort_date: string
  cohort_size: number
  acquisition_source: string
  day_1_retained: number
  day_1_count: number
  day_3_retained: number
  day_7_retained: number
  day_7_count: number
  day_14_retained: number
  day_30_retained: number
  day_30_count: number
  day_60_retained: number
  day_90_retained: number
}

interface CohortsPanelProps {
  token: string
  dateRange: { start: string; end: string }
}

export function CohortsPanel({ token, dateRange }: CohortsPanelProps) {
  const [cohorts, setCohorts] = useState<CohortData[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [sources, setSources] = useState<string[]>([])

  const fetchCohorts = useCallback(async () => {
    setLoading(true)
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      
      let url = `${API_BASE}/analytics/enterprise/dashboard/cohorts?start_date=${dateRange.start}&end_date=${dateRange.end}`
      if (sourceFilter) {
        url += `&acquisition_source=${encodeURIComponent(sourceFilter)}`
      }
      
      const res = await fetch(url, { headers })
      const data = await res.json()
      
      if (data.success) {
        setCohorts(data.data.cohorts || [])
        
        // Extract unique sources
        const uniqueSources = [...new Set(data.data.cohorts?.map((c: CohortData) => c.acquisition_source) || [])]
        setSources(uniqueSources as string[])
      }
    } catch (err) {
      console.error('Failed to fetch cohorts', err)
    } finally {
      setLoading(false)
    }
  }, [token, dateRange, sourceFilter])

  useEffect(() => {
    fetchCohorts()
  }, [fetchCohorts])

  // Calculate averages
  const avgRetention = {
    day1: cohorts.length ? cohorts.reduce((a, c) => a + c.day_1_retained, 0) / cohorts.length : 0,
    day7: cohorts.length ? cohorts.reduce((a, c) => a + c.day_7_retained, 0) / cohorts.length : 0,
    day30: cohorts.length ? cohorts.reduce((a, c) => a + c.day_30_retained, 0) / cohorts.length : 0,
  }

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="h-64 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-xs text-neutral-400 mb-1">Total Cohorts</div>
          <div className="text-2xl font-bold">{cohorts.length}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-xs text-neutral-400 mb-1">Avg Day 1 Retention</div>
          <div className="text-2xl font-bold text-blue-400">{avgRetention.day1.toFixed(1)}%</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-xs text-neutral-400 mb-1">Avg Day 7 Retention</div>
          <div className="text-2xl font-bold text-green-400">{avgRetention.day7.toFixed(1)}%</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-xs text-neutral-400 mb-1">Avg Day 30 Retention</div>
          <div className="text-2xl font-bold text-orange-400">{avgRetention.day30.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-neutral-400">Filter by Source:</label>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 bg-white/5 rounded-lg text-sm border border-white/10"
        >
          <option value="">All Sources</option>
          {sources.map((source) => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </div>

      {/* Retention Table */}
      <div className="bg-white/5 rounded-xl p-6">
        <h2 className="text-sm font-medium text-neutral-400 mb-4">Retention by Cohort</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b border-white/10">
                <th className="pb-3 pr-4">Cohort Date</th>
                <th className="pb-3 pr-4 text-right">Size</th>
                <th className="pb-3 pr-4">Source</th>
                <th className="pb-3 pr-4 text-right">Day 1</th>
                <th className="pb-3 pr-4 text-right">Day 3</th>
                <th className="pb-3 pr-4 text-right">Day 7</th>
                <th className="pb-3 pr-4 text-right">Day 14</th>
                <th className="pb-3 pr-4 text-right">Day 30</th>
                <th className="pb-3 pr-4 text-right">Day 60</th>
                <th className="pb-3 text-right">Day 90</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={`${cohort.cohort_date}-${cohort.acquisition_source}`} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 pr-4 font-mono text-xs">{cohort.cohort_date}</td>
                  <td className="py-2 pr-4 text-right text-blue-400">{cohort.cohort_size}</td>
                  <td className="py-2 pr-4">
                    <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{cohort.acquisition_source}</span>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <RetentionCell value={cohort.day_1_retained} />
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <RetentionCell value={cohort.day_3_retained} />
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <RetentionCell value={cohort.day_7_retained} />
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <RetentionCell value={cohort.day_14_retained} />
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <RetentionCell value={cohort.day_30_retained} />
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <RetentionCell value={cohort.day_60_retained} />
                  </td>
                  <td className="py-2 text-right">
                    <RetentionCell value={cohort.day_90_retained} />
                  </td>
                </tr>
              ))}
              {cohorts.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-neutral-500">
                    No cohort data available. Retention curves are calculated daily.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retention Curve Visualization */}
      {cohorts.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-sm font-medium text-neutral-400 mb-4">Average Retention Curve</h2>
          <div className="h-48 flex items-end gap-4">
            {[
              { day: 'D1', value: avgRetention.day1 },
              { day: 'D3', value: cohorts.reduce((a, c) => a + c.day_3_retained, 0) / cohorts.length },
              { day: 'D7', value: avgRetention.day7 },
              { day: 'D14', value: cohorts.reduce((a, c) => a + c.day_14_retained, 0) / cohorts.length },
              { day: 'D30', value: avgRetention.day30 },
              { day: 'D60', value: cohorts.reduce((a, c) => a + c.day_60_retained, 0) / cohorts.length },
              { day: 'D90', value: cohorts.reduce((a, c) => a + c.day_90_retained, 0) / cohorts.length },
            ].map((point) => (
              <div key={point.day} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all"
                  style={{ height: `${Math.max(point.value, 2)}%` }}
                />
                <span className="text-xs text-neutral-400">{point.day}</span>
                <span className="text-xs font-medium">{point.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RetentionCell({ value }: { value: number }) {
  const color = value >= 50 ? 'text-green-400' : value >= 25 ? 'text-yellow-400' : value > 0 ? 'text-orange-400' : 'text-neutral-600'
  return <span className={`${color}`}>{value > 0 ? `${value.toFixed(1)}%` : '-'}</span>
}
