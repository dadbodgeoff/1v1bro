/**
 * ExperimentsPanel - A/B test management and results
 * 
 * Requirements: 8.3, 8.4 - Variant weights sum to 100%, winning variant highlighting
 */

import { useEffect, useState } from 'react'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { LineChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'

interface Experiment {
  id: string
  name: string
  description?: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  variants: Array<{ name: string; weight: number }>
  metric: string
  start_date?: string
  end_date?: string
  created_at: string
}

/**
 * Validates that experiment variant weights sum to 100%
 * Property 9: Experiment variant weights sum to 100%
 * 
 * @param variants Array of variants with weight property
 * @param tolerance Floating point tolerance (default 0.1%)
 * @returns true if weights sum to 100% within tolerance
 */
export function validateVariantWeights(
  variants: Array<{ weight: number }>,
  tolerance = 0.1
): boolean {
  if (!variants || variants.length === 0) return false
  const sum = variants.reduce((acc, v) => acc + (v.weight || 0), 0)
  return Math.abs(sum - 100) <= tolerance
}

/**
 * Calculates the total weight of all variants
 */
export function calculateTotalWeight(variants: Array<{ weight: number }>): number {
  if (!variants || variants.length === 0) return 0
  return variants.reduce((acc, v) => acc + (v.weight || 0), 0)
}

interface ExperimentDetails {
  experiment: Experiment
  results: {
    variants: Array<{
      name: string
      participants: number
      conversions: number
      conversion_rate: number
      confidence: number
    }>
    winner?: string
    statistical_significance: boolean
  }
  daily_data: Array<{
    date: string
    variant: string
    participants: number
    conversions: number
  }>
}

export function ExperimentsPanel() {
  const api = useAnalyticsAPI()
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [selectedExp, setSelectedExp] = useState<string | null>(null)
  const [details, setDetails] = useState<ExperimentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getExperiments(1, statusFilter || undefined)
      setExperiments((result as { experiments: Experiment[] })?.experiments || [])
      setLoading(false)
    }
    load()
  }, [statusFilter])

  const loadDetails = async (expId: string) => {
    if (selectedExp === expId) {
      setSelectedExp(null)
      setDetails(null)
      return
    }
    setSelectedExp(expId)
    setLoadingDetails(true)
    const result = await api.getExperimentDetails(expId)
    setDetails(result as ExperimentDetails)
    setLoadingDetails(false)
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-500/20'
      case 'completed': return 'text-blue-400 bg-blue-500/20'
      case 'paused': return 'text-yellow-400 bg-yellow-500/20'
      default: return 'text-neutral-400 bg-white/10'
    }
  }

  const columns: Column<Experiment>[] = [
    { 
      key: 'name', 
      label: 'Experiment', 
      render: (r) => (
        <div>
          <div className="font-medium text-white">{r.name}</div>
          {r.description && <div className="text-xs text-neutral-500 truncate max-w-xs">{r.description}</div>}
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      align: 'center',
      render: (r) => (
        <span className={`px-2 py-1 text-xs rounded ${statusColor(r.status)}`}>
          {r.status}
        </span>
      )
    },
    { 
      key: 'metric', 
      label: 'Metric', 
      render: (r) => <span className="text-orange-400 text-sm">{r.metric}</span>
    },
    { 
      key: 'variants', 
      label: 'Variants', 
      align: 'center',
      render: (r) => {
        const isValid = validateVariantWeights(r.variants || [])
        const totalWeight = calculateTotalWeight(r.variants || [])
        return (
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">{r.variants?.length || 0}</span>
            {r.variants && r.variants.length > 0 && !isValid && (
              <span className="text-xs text-yellow-400" title={`Weights sum to ${totalWeight.toFixed(1)}%`}>
                ⚠️
              </span>
            )}
          </div>
        )
      }
    },
  ]

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-neutral-400">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
        >
          <option value="">All</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
        </select>
        <span className="text-sm text-neutral-500">{experiments.length} experiments</span>
      </div>

      {/* Experiments Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        {experiments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🧪</div>
            <h3 className="text-lg font-medium text-white mb-2">No Experiments</h3>
            <p className="text-neutral-500 text-sm">Create A/B tests in the backend to track here</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={experiments}
            keyField="id"
            maxHeight="300px"
            onRowClick={(row) => loadDetails(row.id)}
            selectedKey={selectedExp || undefined}
          />
        )}
      </div>

      {/* Experiment Details */}
      {selectedExp && (
        <div className="bg-white/5 rounded-xl border border-orange-500/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-orange-400">Experiment Results</h3>
            <button onClick={() => setSelectedExp(null)} className="text-xs text-neutral-500 hover:text-white">
              Close ✕
            </button>
          </div>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : details?.results ? (
            <div className="space-y-6">
              {/* Variant Weight Validation */}
              {details.experiment.variants && !validateVariantWeights(details.experiment.variants) && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span className="text-sm text-yellow-400">
                    Variant weights sum to {calculateTotalWeight(details.experiment.variants).toFixed(1)}% (should be 100%)
                  </span>
                </div>
              )}

              {/* Winner Banner - Enhanced highlighting for statistical significance */}
              {details.results.winner && details.results.statistical_significance && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center animate-pulse">
                  <div className="text-green-400 font-medium text-lg">
                    🏆 Winner: {details.results.winner}
                  </div>
                  <div className="text-xs text-green-400/70 mt-1">
                    Statistically significant (p &lt; 0.05)
                  </div>
                </div>
              )}

              {/* Pending significance notice */}
              {!details.results.statistical_significance && details.results.variants.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                  <span className="text-sm text-blue-400">
                    ⏳ Waiting for statistical significance...
                  </span>
                </div>
              )}

              {/* Variant Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {details.results.variants.map((v, i) => {
                  const isWinner = v.name === details.results.winner && details.results.statistical_significance
                  const variantConfig = details.experiment.variants?.find(ev => ev.name === v.name)
                  
                  return (
                    <div 
                      key={i} 
                      className={`p-4 rounded-lg border transition-all ${
                        isWinner 
                          ? 'bg-green-500/10 border-green-500/30 ring-2 ring-green-500/20' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{v.name}</span>
                        <div className="flex items-center gap-2">
                          {variantConfig && (
                            <span className="text-xs text-neutral-500 bg-white/5 px-2 py-0.5 rounded">
                              {variantConfig.weight}% traffic
                            </span>
                          )}
                          {isWinner && <span className="text-green-400 text-lg">🏆</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-neutral-500 text-xs">Participants</div>
                          <div className="text-white">{v.participants.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-neutral-500 text-xs">Conversions</div>
                          <div className="text-white">{v.conversions.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-neutral-500 text-xs">Rate</div>
                          <div className={isWinner ? 'text-green-400 font-bold' : 'text-orange-400'}>
                            {v.conversion_rate.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-500 text-xs">Confidence</div>
                          <div className={v.confidence >= 95 ? 'text-green-400' : v.confidence >= 80 ? 'text-yellow-400' : 'text-neutral-400'}>
                            {v.confidence.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Daily Trend */}
              {details.daily_data && details.daily_data.length > 0 && (
                <div>
                  <h4 className="text-sm text-neutral-400 mb-3">Daily Trend</h4>
                  <LineChart 
                    data={details.daily_data.slice(0, 14).map(d => ({
                      label: d.date.slice(5),
                      value: d.conversions,
                    }))} 
                    height={120} 
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-neutral-500 text-center py-4">No results available</div>
          )}
        </div>
      )}
    </div>
  )
}
