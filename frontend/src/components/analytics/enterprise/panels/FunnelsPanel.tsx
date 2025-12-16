/**
 * FunnelsPanel - Conversion funnel analysis
 * 
 * Requirements: 3.1, 3.2, 3.5 - Funnel conversion rates, drop-off, and time-to-conversion
 */

import { useEffect, useState } from 'react'
import { FunnelChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
// Note: calculateFunnelDropOff utility validates Property 5 in tests
import type { DateRange } from '../types'

interface Funnel {
  id: string
  name: string
  description?: string
  steps: string[]
  created_at: string
}

interface FunnelStats {
  steps: Array<{
    step_name: string
    count: number
    conversion_rate: number
    drop_off_rate: number
    avg_time_to_next_ms?: number
  }>
  overall_conversion: number
  total_started: number
  total_completed: number
  avg_time_to_conversion_ms?: number
}

interface Props {
  dateRange: DateRange
}

export function FunnelsPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null)
  const [stats, setStats] = useState<FunnelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getFunnels()
      const funnelList = (result as { funnels: Funnel[] })?.funnels || []
      setFunnels(funnelList)
      if (funnelList.length > 0 && !selectedFunnel) {
        setSelectedFunnel(funnelList[0].id)
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedFunnel) return
    const loadStats = async () => {
      setLoadingStats(true)
      const result = await api.getFunnelStats(selectedFunnel, dateRange)
      setStats(result as FunnelStats)
      setLoadingStats(false)
    }
    loadStats()
  }, [selectedFunnel, dateRange])

  const chartData = stats?.steps.map(s => ({
    label: s.step_name,
    count: s.count,
    rate: s.conversion_rate,
  })) || []
  
  // Format duration from milliseconds
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  if (funnels.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-white mb-2">No Funnels Configured</h3>
        <p className="text-neutral-500 text-sm">
          Create funnels in the backend to track conversion paths
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Funnel Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-neutral-400">Funnel:</label>
        <select
          value={selectedFunnel || ''}
          onChange={(e) => setSelectedFunnel(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
        >
          {funnels.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {loadingStats ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-neutral-500">Started</div>
              <div className="text-2xl font-bold text-white">{stats.total_started.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-neutral-500">Completed</div>
              <div className="text-2xl font-bold text-green-400">{stats.total_completed.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-neutral-500">Conversion Rate</div>
              <div className="text-2xl font-bold text-orange-400">{stats.overall_conversion.toFixed(1)}%</div>
            </div>
          </div>

          {/* Funnel Visualization */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-medium text-neutral-400 mb-4">Funnel Flow</h3>
            {chartData.length > 0 ? (
              <FunnelChart steps={chartData} />
            ) : (
              <div className="text-neutral-500 text-sm text-center py-8">No funnel data</div>
            )}
          </div>

          {/* Step Details with Drop-off Visualization */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-medium text-neutral-400 mb-4">Step Breakdown</h3>
            <div className="space-y-1">
              {stats.steps.map((step, i) => {
                // Property 5: Drop-off is inverse of conversion (validated by utility function)
                const isLastStep = i === stats.steps.length - 1
                
                return (
                  <div key={i}>
                    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{step.step_name}</div>
                        <div className="text-xs text-neutral-500">
                          {step.count.toLocaleString()} users
                          {step.avg_time_to_next_ms && !isLastStep && (
                            <span className="ml-2 text-blue-400">
                              → {formatDuration(step.avg_time_to_next_ms)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right w-24">
                        <div className="text-sm text-green-400 font-medium">
                          {step.conversion_rate.toFixed(1)}% conv
                        </div>
                        {step.drop_off_rate > 0 && (
                          <div className="text-xs text-red-400">
                            -{step.drop_off_rate.toFixed(1)}% drop
                          </div>
                        )}
                      </div>
                      {/* Visual drop-off indicator */}
                      <div className="w-20">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                            style={{ width: `${step.conversion_rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Drop-off indicator between steps */}
                    {!isLastStep && step.drop_off_rate > 0 && (
                      <div className="flex items-center gap-2 ml-12 py-1">
                        <div className="flex-1 border-l-2 border-dashed border-red-500/30 h-4" />
                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                          ↓ {step.drop_off_rate.toFixed(0)}% dropped
                        </span>
                        <div className="flex-1" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Time to Conversion */}
          {stats.avg_time_to_conversion_ms && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-2">Time to Conversion</h3>
              <div className="text-2xl font-bold text-blue-400">
                {formatDuration(stats.avg_time_to_conversion_ms)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Average time from first step to completion
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-neutral-500 text-center py-8">Select a funnel to view stats</div>
      )}
    </div>
  )
}
