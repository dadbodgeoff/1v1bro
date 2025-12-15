/**
 * CohortsPanel - Retention cohort analysis
 */

import { useEffect, useState } from 'react'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface Cohort {
  cohort_date: string
  cohort_size: number
  acquisition_source?: string
  day_1_retention?: number
  day_3_retention?: number
  day_7_retention?: number
  day_14_retention?: number
  day_30_retention?: number
  day_60_retention?: number
  day_90_retention?: number
}

interface Props {
  dateRange: DateRange
}

export function CohortsPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [cohortType, setCohortType] = useState<'day' | 'week' | 'month'>('week')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getCohorts(dateRange, cohortType)
      setCohorts((result as { cohorts: Cohort[] })?.cohorts || [])
      setLoading(false)
    }
    load()
  }, [dateRange, cohortType])

  const retentionColor = (pct: number | undefined) => {
    if (pct === undefined || pct === null) return 'bg-neutral-800 text-neutral-600'
    if (pct >= 50) return 'bg-green-500/30 text-green-400'
    if (pct >= 30) return 'bg-green-500/20 text-green-400'
    if (pct >= 20) return 'bg-yellow-500/20 text-yellow-400'
    if (pct >= 10) return 'bg-orange-500/20 text-orange-400'
    return 'bg-red-500/20 text-red-400'
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const intervals = ['day_1', 'day_3', 'day_7', 'day_14', 'day_30', 'day_60', 'day_90']
  const intervalLabels = ['D1', 'D3', 'D7', 'D14', 'D30', 'D60', 'D90']

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-neutral-400">Cohort by:</label>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(['day', 'week', 'month'] as const).map(t => (
            <button
              key={t}
              onClick={() => setCohortType(t)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                cohortType === t 
                  ? 'bg-orange-500 text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {cohorts.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-medium text-white mb-2">No Cohort Data</h3>
          <p className="text-neutral-500 text-sm">
            Retention data will appear as users return over time
          </p>
        </div>
      ) : (
        <>
          {/* Retention Matrix */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 overflow-x-auto">
            <h3 className="text-sm font-medium text-neutral-400 mb-4">Retention Matrix</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-neutral-500">
                  <th className="text-left py-2 px-3">Cohort</th>
                  <th className="text-right py-2 px-3">Size</th>
                  {intervalLabels.map(label => (
                    <th key={label} className="text-center py-2 px-2 w-16">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-2 px-3 text-white">{formatDate(cohort.cohort_date)}</td>
                    <td className="py-2 px-3 text-right text-neutral-400">{cohort.cohort_size}</td>
                    {intervals.map(interval => {
                      const key = `${interval}_retention` as keyof Cohort
                      const val = cohort[key] as number | undefined
                      return (
                        <td key={interval} className="py-2 px-2">
                          <div className={`text-center text-xs py-1 px-2 rounded ${retentionColor(val)}`}>
                            {val !== undefined && val !== null ? `${val.toFixed(0)}%` : '—'}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-neutral-500">Total Cohorts</div>
              <div className="text-2xl font-bold text-white">{cohorts.length}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-neutral-500">Avg D1 Retention</div>
              <div className="text-2xl font-bold text-green-400">
                {cohorts.filter(c => c.day_1_retention).length > 0
                  ? (cohorts.reduce((a, c) => a + (c.day_1_retention || 0), 0) / cohorts.filter(c => c.day_1_retention).length).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-neutral-500">Avg D7 Retention</div>
              <div className="text-2xl font-bold text-yellow-400">
                {cohorts.filter(c => c.day_7_retention).length > 0
                  ? (cohorts.reduce((a, c) => a + (c.day_7_retention || 0), 0) / cohorts.filter(c => c.day_7_retention).length).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-neutral-500">Avg D30 Retention</div>
              <div className="text-2xl font-bold text-orange-400">
                {cohorts.filter(c => c.day_30_retention).length > 0
                  ? (cohorts.reduce((a, c) => a + (c.day_30_retention || 0), 0) / cohorts.filter(c => c.day_30_retention).length).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500/30 rounded" /> 50%+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500/20 rounded" /> 30-50%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500/20 rounded" /> 20-30%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500/20 rounded" /> 10-20%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/20 rounded" /> &lt;10%</span>
          </div>
        </>
      )}
    </div>
  )
}
