/**
 * JourneysPanel - User journey visualization and analysis
 */

import { useEffect, useState } from 'react'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface Journey {
  journey_id: string
  session_id: string
  user_id?: string
  started_at: string
  ended_at?: string
  page_count: number
  duration_seconds: number
  entry_page: string
  exit_page: string
  converted: boolean
}

interface JourneyStep {
  page: string
  timestamp: string
  time_on_page: number
  scroll_depth: number
}

interface Props {
  dateRange: DateRange
}

export function JourneysPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [selectedJourney, setSelectedJourney] = useState<string | null>(null)
  const [steps, setSteps] = useState<JourneyStep[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSteps, setLoadingSteps] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getJourneys(dateRange)
      setJourneys((result as { journeys: Journey[] })?.journeys || [])
      setLoading(false)
    }
    load()
  }, [dateRange])

  const loadSteps = async (journeyId: string) => {
    if (selectedJourney === journeyId) {
      setSelectedJourney(null)
      setSteps([])
      return
    }
    setSelectedJourney(journeyId)
    setLoadingSteps(true)
    const result = await api.getJourneySteps(journeyId)
    setSteps((result as { steps: JourneyStep[] })?.steps || [])
    setLoadingSteps(false)
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s'
    if (seconds < 60) return `${Math.round(seconds)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const columns: Column<Journey>[] = [
    { 
      key: 'started_at', 
      label: 'Started', 
      render: (r) => <span className="text-xs text-neutral-400">{formatTime(r.started_at)}</span> 
    },
    { 
      key: 'entry_page', 
      label: 'Entry', 
      render: (r) => <span className="font-mono text-xs text-green-400">{r.entry_page}</span> 
    },
    { 
      key: 'exit_page', 
      label: 'Exit', 
      render: (r) => <span className="font-mono text-xs text-red-400">{r.exit_page}</span> 
    },
    { 
      key: 'page_count', 
      label: 'Pages', 
      sortable: true, 
      align: 'center',
      render: (r) => <span className="text-orange-400 font-medium">{r.page_count}</span>
    },
    { 
      key: 'duration_seconds', 
      label: 'Duration', 
      sortable: true, 
      align: 'right',
      render: (r) => <span className="text-blue-400">{formatDuration(r.duration_seconds)}</span>
    },
    { 
      key: 'converted', 
      label: 'Converted', 
      align: 'center',
      render: (r) => r.converted 
        ? <span className="text-green-400">✓</span> 
        : <span className="text-neutral-600">—</span>
    },
  ]

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-500">Total Journeys</div>
          <div className="text-2xl font-bold text-white">{journeys.length}</div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-500">Avg Pages/Journey</div>
          <div className="text-2xl font-bold text-orange-400">
            {journeys.length ? (journeys.reduce((a, j) => a + j.page_count, 0) / journeys.length).toFixed(1) : 0}
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-500">Avg Duration</div>
          <div className="text-2xl font-bold text-blue-400">
            {formatDuration(journeys.length ? journeys.reduce((a, j) => a + j.duration_seconds, 0) / journeys.length : 0)}
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-500">Conversion Rate</div>
          <div className="text-2xl font-bold text-green-400">
            {journeys.length ? ((journeys.filter(j => j.converted).length / journeys.length) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Journeys Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">User Journeys</h3>
        <DataTable
          columns={columns}
          data={journeys}
          keyField="journey_id"
          maxHeight="400px"
          emptyMessage="No journey data"
          onRowClick={(row) => loadSteps(row.journey_id)}
        />
      </div>

      {/* Journey Steps Detail */}
      {selectedJourney && (
        <div className="bg-white/5 rounded-xl border border-orange-500/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-orange-400">Journey Steps</h3>
            <button onClick={() => setSelectedJourney(null)} className="text-xs text-neutral-500 hover:text-white">
              Close ✕
            </button>
          </div>
          {loadingSteps ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-sm text-white">{step.page}</div>
                    <div className="text-xs text-neutral-500">
                      {formatDuration(step.time_on_page)} · {step.scroll_depth}% scrolled
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500">{formatTime(step.timestamp)}</div>
                </div>
              ))}
              {steps.length === 0 && <div className="text-neutral-500 text-sm">No steps found</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
