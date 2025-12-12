/**
 * FunnelsPanel - Conversion Funnel Analysis
 * 
 * Create, manage, and analyze conversion funnels.
 * Shows step-by-step conversion rates and drop-off points.
 */

import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/utils/constants'

interface FunnelStep {
  step: number
  type: 'pageview' | 'event'
  match: string
  name?: string
}

interface Funnel {
  id: string
  name: string
  description: string | null
  steps: FunnelStep[]
  is_active: boolean
  created_at: string
}

interface FunnelStats {
  step_number: number
  entered_count: number
  completed_count: number
  drop_off_count: number
  date: string
}

interface FunnelsPanelProps {
  token: string
  dateRange: { start: string; end: string }
}

export function FunnelsPanel({ token, dateRange }: FunnelsPanelProps) {
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null)
  const [funnelStats, setFunnelStats] = useState<FunnelStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const fetchFunnels = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/funnels`, { headers })
      const data = await res.json()
      if (data.success) {
        setFunnels(data.data.funnels || [])
      }
    } catch (err) {
      console.error('Failed to fetch funnels', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchFunnelStats = useCallback(async (funnelId: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/analytics/enterprise/dashboard/funnels/${funnelId}/stats?start_date=${dateRange.start}&end_date=${dateRange.end}`,
        { headers }
      )
      const data = await res.json()
      if (data.success) {
        setFunnelStats(data.data.stats || [])
      }
    } catch (err) {
      console.error('Failed to fetch funnel stats', err)
    }
  }, [token, dateRange])

  useEffect(() => {
    fetchFunnels()
  }, [fetchFunnels])

  useEffect(() => {
    if (selectedFunnel) {
      fetchFunnelStats(selectedFunnel.id)
    }
  }, [selectedFunnel, fetchFunnelStats])

  // Aggregate stats by step
  const aggregatedStats = selectedFunnel?.steps.map((step, i) => {
    const stepStats = funnelStats.filter(s => s.step_number === i + 1)
    const totalEntered = stepStats.reduce((a, s) => a + s.entered_count, 0)
    const totalCompleted = stepStats.reduce((a, s) => a + s.completed_count, 0)
    return {
      step: i + 1,
      name: step.name || `${step.type}: ${step.match}`,
      entered: totalEntered,
      completed: totalCompleted,
      dropOff: totalEntered - totalCompleted,
      conversionRate: totalEntered > 0 ? (totalCompleted / totalEntered) * 100 : 0,
    }
  }) || []

  // Calculate overall funnel conversion
  const overallConversion = aggregatedStats.length > 0 && aggregatedStats[0].entered > 0
    ? (aggregatedStats[aggregatedStats.length - 1]?.completed || 0) / aggregatedStats[0].entered * 100
    : 0

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Conversion Funnels</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-orange-500 rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          + Create Funnel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel List */}
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Your Funnels</h3>
          <div className="space-y-2">
            {funnels.map((funnel) => (
              <button
                key={funnel.id}
                onClick={() => setSelectedFunnel(funnel)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedFunnel?.id === funnel.id
                    ? 'bg-orange-500/20 border border-orange-500/40'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="font-medium text-sm">{funnel.name}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {funnel.steps.length} steps • {funnel.description || 'No description'}
                </div>
              </button>
            ))}
            {funnels.length === 0 && (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No funnels created yet.
                <br />
                Create one to start tracking conversions.
              </div>
            )}
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="lg:col-span-2 bg-white/5 rounded-xl p-6">
          {selectedFunnel ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium">{selectedFunnel.name}</h3>
                  <p className="text-sm text-neutral-400">{selectedFunnel.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-400">{overallConversion.toFixed(1)}%</div>
                  <div className="text-xs text-neutral-500">Overall Conversion</div>
                </div>
              </div>

              {/* Funnel Steps */}
              <div className="space-y-4">
                {aggregatedStats.map((step, i) => {
                  const widthPercent = aggregatedStats[0].entered > 0
                    ? (step.entered / aggregatedStats[0].entered) * 100
                    : 100
                  
                  return (
                    <div key={step.step} className="relative">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{step.name}</span>
                            <span className="text-sm text-neutral-400">{step.entered.toLocaleString()} users</span>
                          </div>
                          <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg transition-all duration-500"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Drop-off indicator */}
                      {i < aggregatedStats.length - 1 && step.dropOff > 0 && (
                        <div className="ml-12 mt-2 mb-2 flex items-center gap-2 text-xs text-red-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <span>{step.dropOff.toLocaleString()} dropped ({(100 - step.conversionRate).toFixed(1)}%)</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {aggregatedStats.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  No data for this funnel in the selected date range.
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-neutral-500">
              Select a funnel to view its conversion data
            </div>
          )}
        </div>
      </div>

      {/* Create Funnel Modal */}
      {showCreateModal && (
        <CreateFunnelModal
          token={token}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            fetchFunnels()
          }}
        />
      )}
    </div>
  )
}

// Create Funnel Modal Component
function CreateFunnelModal({
  token,
  onClose,
  onCreated,
}: {
  token: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<FunnelStep[]>([
    { step: 1, type: 'pageview', match: '/', name: 'Landing Page' },
  ])
  const [saving, setSaving] = useState(false)

  const addStep = () => {
    setSteps([...steps, { step: steps.length + 1, type: 'pageview', match: '', name: '' }])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step: i + 1 })))
  }

  const updateStep = (index: number, updates: Partial<FunnelStep>) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...updates } : s)))
  }

  const handleCreate = async () => {
    if (!name || steps.length < 2) return
    
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/analytics/enterprise/dashboard/funnels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, steps }),
      })
      
      const data = await res.json()
      if (data.success) {
        onCreated()
      }
    } catch (err) {
      console.error('Failed to create funnel', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Create Funnel</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Funnel Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Signup Flow"
              className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-2">Steps</label>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                    {i + 1}
                  </span>
                  <select
                    value={step.type}
                    onChange={(e) => updateStep(i, { type: e.target.value as 'pageview' | 'event' })}
                    className="px-2 py-1 bg-white/5 rounded border border-white/10 text-sm"
                  >
                    <option value="pageview">Page View</option>
                    <option value="event">Event</option>
                  </select>
                  <input
                    type="text"
                    value={step.match}
                    onChange={(e) => updateStep(i, { match: e.target.value })}
                    placeholder={step.type === 'pageview' ? '/path' : 'event_name'}
                    className="flex-1 px-2 py-1 bg-white/5 rounded border border-white/10 text-sm"
                  />
                  <input
                    type="text"
                    value={step.name || ''}
                    onChange={(e) => updateStep(i, { name: e.target.value })}
                    placeholder="Label"
                    className="w-24 px-2 py-1 bg-white/5 rounded border border-white/10 text-sm"
                  />
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(i)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addStep}
              className="mt-2 text-sm text-orange-400 hover:text-orange-300"
            >
              + Add Step
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name || steps.length < 2 || saving}
            className="px-4 py-2 bg-orange-500 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Funnel'}
          </button>
        </div>
      </div>
    </div>
  )
}
