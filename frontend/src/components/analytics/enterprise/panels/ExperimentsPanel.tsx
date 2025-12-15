/**
 * ExperimentsPanel - A/B test management and results
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
      render: (r) => <span className="text-neutral-400">{r.variants?.length || 0}</span>
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
              {/* Winner Banner */}
              {details.results.winner && details.results.statistical_significance && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-green-400 font-medium">
                    🏆 Winner: {details.results.winner}
                  </div>
                  <div className="text-xs text-green-400/70 mt-1">Statistically significant</div>
                </div>
              )}

              {/* Variant Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {details.results.variants.map((v, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-lg border ${
                      v.name === details.results.winner 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{v.name}</span>
                      {v.name === details.results.winner && <span className="text-green-400">🏆</span>}
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
                        <div className="text-orange-400">{v.conversion_rate.toFixed(2)}%</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 text-xs">Confidence</div>
                        <div className={v.confidence >= 95 ? 'text-green-400' : 'text-yellow-400'}>
                          {v.confidence.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
