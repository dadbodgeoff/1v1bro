/**
 * SessionsPanel - Session explorer with export functionality
 * 
 * Requirements: 2.1, 2.2 - Clickable session IDs with Session Explorer modal
 */

import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { SessionLink } from '../SessionLink'
import { SessionExplorer } from '../SessionExplorer'
import { useAuthStore } from '@/stores/authStore'
import { API_BASE } from '@/utils/constants'
import type { DateRange } from '../types'

interface Session {
  session_id: string
  user_id?: string
  started_at: string
  ended_at?: string
  page_views: number
  duration_seconds: number
  device_type: string
  browser: string
  os: string
  country?: string
  entry_page: string
  exit_page: string
  // Survival data
  survival_runs?: number
  survival_distance?: number
  survival_best_distance?: number
  survival_best_score?: number
  survival_best_combo?: number
  survival_top_death?: string
  trivia_answered?: number
  trivia_correct?: number
}

type SurvivalFilter = 'all' | 'with_runs' | 'multi_run' | 'no_runs'

interface Props {
  dateRange: DateRange
}

export function SessionsPanel({ dateRange }: Props) {
  const { token } = useAuthStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [exporting, setExporting] = useState(false)
  
  // Filtering state
  const [survivalFilter, setSurvivalFilter] = useState<SurvivalFilter>('all')
  
  // Session Explorer state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isExplorerOpen, setIsExplorerOpen] = useState(false)
  
  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setIsExplorerOpen(true)
  }
  
  const handleCloseExplorer = () => {
    setIsExplorerOpen(false)
    setSelectedSessionId(null)
  }

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
        page: String(page),
        per_page: '50',
      })
      const res = await fetch(`${API_BASE}/analytics/dashboard/sessions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setSessions(data.data.sessions || [])
        setTotal(data.data.total || 0)
      }
    } catch (e) {
      console.error('Failed to fetch sessions', e)
    }
    setLoading(false)
  }, [dateRange, page, token])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const exportData = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
        format,
      })
      const res = await fetch(`${API_BASE}/analytics/dashboard/sessions/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sessions-${dateRange.start}-${dateRange.end}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed', e)
    }
    setExporting(false)
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

  const deviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile': return '📱'
      case 'tablet': return '📱'
      default: return '💻'
    }
  }

  const formatDistance = (d: number) => {
    if (!d) return '—'
    return d >= 1000 ? `${(d / 1000).toFixed(1)}km` : `${Math.round(d)}m`
  }

  const deathIcon = (cause: string | null | undefined) => {
    if (!cause) return ''
    const lower = cause.toLowerCase()
    if (lower.includes('spike')) return '🔺'
    if (lower.includes('barrier') || lower.includes('wall')) return '🧱'
    if (lower.includes('gap') || lower.includes('hole')) return '🕳️'
    if (lower.includes('laser')) return '⚡'
    return '💀'
  }

  const columns: Column<Session>[] = [
    {
      key: 'session_id',
      label: 'Session',
      render: (r) => (
        <SessionLink 
          sessionId={r.session_id} 
          onClick={handleSessionClick}
        />
      )
    },
    { 
      key: 'started_at', 
      label: 'Started', 
      render: (r) => <span className="text-xs text-neutral-400">{formatTime(r.started_at)}</span> 
    },
    { 
      key: 'device_type', 
      label: 'Device', 
      align: 'center',
      render: (r) => <span title={`${r.browser} / ${r.os}`}>{deviceIcon(r.device_type)}</span>
    },
    { 
      key: 'entry_page', 
      label: 'Entry', 
      render: (r) => <span className="font-mono text-xs text-green-400 truncate max-w-[120px] block">{r.entry_page}</span> 
    },
    { 
      key: 'exit_page', 
      label: 'Exit', 
      render: (r) => <span className="font-mono text-xs text-red-400 truncate max-w-[120px] block">{r.exit_page}</span> 
    },
    { 
      key: 'page_views', 
      label: 'Pages', 
      sortable: true, 
      align: 'center',
      render: (r) => <span className="text-orange-400 font-medium">{r.page_views}</span>
    },
    { 
      key: 'duration_seconds', 
      label: 'Duration', 
      sortable: true, 
      align: 'right',
      render: (r) => <span className="text-blue-400">{formatDuration(r.duration_seconds)}</span>
    },
    {
      key: 'survival_runs',
      label: '🎮 Runs',
      sortable: true,
      align: 'center',
      render: (r) => r.survival_runs ? (
        <span className="text-orange-400 font-medium">{r.survival_runs}</span>
      ) : <span className="text-neutral-600">—</span>
    },
    {
      key: 'survival_distance',
      label: '📏 Distance',
      sortable: true,
      align: 'right',
      render: (r) => r.survival_distance ? (
        <span className="text-cyan-400">{formatDistance(r.survival_distance)}</span>
      ) : <span className="text-neutral-600">—</span>
    },
    {
      key: 'trivia_answered',
      label: '❓ Trivia',
      sortable: true,
      align: 'center',
      render: (r) => r.trivia_answered ? (
        <span className="text-purple-400">
          {r.trivia_correct}/{r.trivia_answered}
        </span>
      ) : <span className="text-neutral-600">—</span>
    },
    {
      key: 'survival_best_distance',
      label: '🏆 Best',
      sortable: true,
      align: 'right',
      render: (r) => r.survival_best_distance ? (
        <span className="text-green-400 font-medium">{formatDistance(r.survival_best_distance)}</span>
      ) : <span className="text-neutral-600">—</span>
    },
    {
      key: 'survival_top_death',
      label: '💀 Death',
      render: (r) => r.survival_top_death ? (
        <span className="text-red-400 text-xs flex items-center gap-1">
          {deathIcon(r.survival_top_death)}
          <span className="truncate max-w-[60px]">{r.survival_top_death}</span>
        </span>
      ) : <span className="text-neutral-600">—</span>
    },
  ]

  // Apply client-side filtering
  const filteredSessions = sessions.filter(s => {
    switch (survivalFilter) {
      case 'with_runs':
        return s.survival_runs && s.survival_runs > 0
      case 'multi_run':
        return s.survival_runs && s.survival_runs > 1
      case 'no_runs':
        return !s.survival_runs || s.survival_runs === 0
      default:
        return true
    }
  })

  const totalPages = Math.ceil(total / 50)
  
  // Calculate additional survival metrics
  const survivalSessions = sessions.filter(s => s.survival_runs && s.survival_runs > 0)
  const avgRunsPerSession = survivalSessions.length 
    ? survivalSessions.reduce((a, s) => a + (s.survival_runs || 0), 0) / survivalSessions.length 
    : 0
  const avgDistancePerRun = (() => {
    const totalRuns = survivalSessions.reduce((a, s) => a + (s.survival_runs || 0), 0)
    const totalDist = survivalSessions.reduce((a, s) => a + (s.survival_distance || 0), 0)
    return totalRuns > 0 ? totalDist / totalRuns : 0
  })()
  // Use best_distance for the best single run, fallback to total distance
  const bestSingleRun = Math.max(...survivalSessions.map(s => s.survival_best_distance || 0), 0)
  const bestScore = Math.max(...survivalSessions.map(s => s.survival_best_score || 0), 0)
  const bestCombo = Math.max(...survivalSessions.map(s => s.survival_best_combo || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header with Export and Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="text-sm text-neutral-400">
            {filteredSessions.length.toLocaleString()} of {total.toLocaleString()} sessions
          </div>
          
          {/* Survival Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Filter:</span>
            <select
              value={survivalFilter}
              onChange={(e) => setSurvivalFilter(e.target.value as SurvivalFilter)}
              className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Sessions</option>
              <option value="with_runs">🎮 Played Survival</option>
              <option value="multi_run">🔄 Played Again (2+ runs)</option>
              <option value="no_runs">📄 No Survival</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => exportData('csv')}
            disabled={exporting}
            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            {exporting ? '...' : 'Export CSV'}
          </button>
          <button
            onClick={() => exportData('json')}
            disabled={exporting}
            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            {exporting ? '...' : 'Export JSON'}
          </button>
        </div>
      </div>

      {/* Summary Stats - Enhanced */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-500 mb-1">Total Sessions</div>
          <div className="text-2xl font-bold text-white">{total.toLocaleString()}</div>
          <div className="text-xs text-neutral-500 mt-1">in selected period</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl border border-orange-500/20 p-4">
          <div className="text-xs text-orange-400 mb-1">Avg Pages/Session</div>
          <div className="text-2xl font-bold text-orange-400">
            {sessions.length ? (sessions.reduce((a, s) => a + s.page_views, 0) / sessions.length).toFixed(1) : 0}
          </div>
          <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${Math.min(100, (sessions.length ? (sessions.reduce((a, s) => a + s.page_views, 0) / sessions.length) : 0) * 20)}%` }}
            />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 p-4">
          <div className="text-xs text-blue-400 mb-1">Avg Duration</div>
          <div className="text-2xl font-bold text-blue-400">
            {formatDuration(sessions.length ? sessions.reduce((a, s) => a + s.duration_seconds, 0) / sessions.length : 0)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">per session</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20 p-4">
          <div className="text-xs text-purple-400 mb-1">Mobile Traffic</div>
          <div className="text-2xl font-bold text-purple-400">
            {sessions.length ? ((sessions.filter(s => s.device_type?.toLowerCase() === 'mobile').length / sessions.length) * 100).toFixed(0) : 0}%
          </div>
          <div className="flex gap-1 mt-2">
            <span className="text-xs text-neutral-500">📱 {sessions.filter(s => s.device_type?.toLowerCase() === 'mobile').length}</span>
            <span className="text-xs text-neutral-500">💻 {sessions.filter(s => s.device_type?.toLowerCase() !== 'mobile').length}</span>
          </div>
        </div>
      </div>

      {/* Survival Stats */}
      {sessions.some(s => s.survival_runs && s.survival_runs > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl border border-orange-500/20 p-4">
            <div className="text-xs text-orange-400 mb-1">🎮 Sessions w/ Runs</div>
            <div className="text-2xl font-bold text-orange-400">
              {sessions.filter(s => s.survival_runs && s.survival_runs > 0).length}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {sessions.length ? ((sessions.filter(s => s.survival_runs && s.survival_runs > 0).length / sessions.length) * 100).toFixed(0) : 0}% of sessions
            </div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-xl border border-cyan-500/20 p-4">
            <div className="text-xs text-cyan-400 mb-1">📏 Total Distance</div>
            <div className="text-2xl font-bold text-cyan-400">
              {formatDistance(sessions.reduce((a, s) => a + (s.survival_distance || 0), 0))}
            </div>
            <div className="text-xs text-neutral-500 mt-1">across all runs</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl border border-yellow-500/20 p-4">
            <div className="text-xs text-yellow-400 mb-1">🔄 Play Again Rate</div>
            <div className="text-2xl font-bold text-yellow-400">
              {(() => {
                const withRuns = sessions.filter(s => s.survival_runs && s.survival_runs > 0)
                const multiRun = withRuns.filter(s => s.survival_runs && s.survival_runs > 1)
                return withRuns.length ? ((multiRun.length / withRuns.length) * 100).toFixed(0) : 0
              })()}%
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {sessions.filter(s => s.survival_runs && s.survival_runs > 1).length} played again
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20 p-4">
            <div className="text-xs text-purple-400 mb-1">❓ Trivia Answered</div>
            <div className="text-2xl font-bold text-purple-400">
              {sessions.reduce((a, s) => a + (s.trivia_answered || 0), 0)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {(() => {
                const total = sessions.reduce((a, s) => a + (s.trivia_answered || 0), 0)
                const correct = sessions.reduce((a, s) => a + (s.trivia_correct || 0), 0)
                return total ? `${((correct / total) * 100).toFixed(0)}% correct` : 'no answers'
              })()}
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20 p-4">
            <div className="text-xs text-red-400 mb-1">💀 Top Death Cause</div>
            <div className="text-xl font-bold text-red-400 truncate">
              {(() => {
                const deaths: Record<string, number> = {}
                sessions.forEach(s => {
                  if (s.survival_top_death) {
                    deaths[s.survival_top_death] = (deaths[s.survival_top_death] || 0) + 1
                  }
                })
                const sorted = Object.entries(deaths).sort((a, b) => b[1] - a[1])
                return sorted[0] ? `${deathIcon(sorted[0][0])} ${sorted[0][0]}` : '—'
              })()}
            </div>
            <div className="text-xs text-neutral-500 mt-1">most common</div>
          </div>
        </div>
      )}

      {/* Additional Survival Metrics - only show when there's survival data */}
      {survivalSessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="text-xs text-neutral-500 mb-1">📊 Avg Runs/Session</div>
            <div className="text-2xl font-bold text-white">{avgRunsPerSession.toFixed(1)}</div>
            <div className="text-xs text-neutral-500 mt-1">for players who played</div>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="text-xs text-neutral-500 mb-1">📏 Avg Distance/Run</div>
            <div className="text-2xl font-bold text-white">{formatDistance(avgDistancePerRun)}</div>
            <div className="text-xs text-neutral-500 mt-1">per individual run</div>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="text-xs text-neutral-500 mb-1">🏆 Best Single Run</div>
            <div className="text-2xl font-bold text-green-400">{formatDistance(bestSingleRun)}</div>
            <div className="text-xs text-neutral-500 mt-1">
              {bestScore > 0 && <span>{bestScore.toLocaleString()} pts</span>}
              {bestCombo > 0 && <span className="ml-2">{bestCombo}x combo</span>}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="text-xs text-neutral-500 mb-1">⏱️ Avg Survival Duration</div>
            <div className="text-2xl font-bold text-white">
              {formatDuration(
                survivalSessions.length 
                  ? survivalSessions.reduce((a, s) => a + s.duration_seconds, 0) / survivalSessions.length 
                  : 0
              )}
            </div>
            <div className="text-xs text-neutral-500 mt-1">for survival sessions</div>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={filteredSessions}
              keyField="session_id"
              maxHeight="400px"
              emptyMessage={survivalFilter !== 'all' ? `No sessions match filter "${survivalFilter}"` : "No sessions found"}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs bg-white/5 rounded disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="text-xs text-neutral-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs bg-white/5 rounded disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Session Explorer Modal */}
      {selectedSessionId && (
        <SessionExplorer
          sessionId={selectedSessionId}
          isOpen={isExplorerOpen}
          onClose={handleCloseExplorer}
        />
      )}
    </div>
  )
}
