/**
 * SessionsPanel - Session explorer with export functionality
 */

import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
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
}

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

  const columns: Column<Session>[] = [
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
  ]

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">
          {total.toLocaleString()} sessions found
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-500">Total Sessions</div>
          <div className="text-2xl font-bold text-white">{total.toLocaleString()}</div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-500">Avg Pages/Session</div>
          <div className="text-2xl font-bold text-orange-400">
            {sessions.length ? (sessions.reduce((a, s) => a + s.page_views, 0) / sessions.length).toFixed(1) : 0}
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-500">Avg Duration</div>
          <div className="text-2xl font-bold text-blue-400">
            {formatDuration(sessions.length ? sessions.reduce((a, s) => a + s.duration_seconds, 0) / sessions.length : 0)}
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-500">Mobile %</div>
          <div className="text-2xl font-bold text-purple-400">
            {sessions.length ? ((sessions.filter(s => s.device_type?.toLowerCase() === 'mobile').length / sessions.length) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

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
              data={sessions}
              keyField="session_id"
              maxHeight="400px"
              emptyMessage="No sessions found"
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
    </div>
  )
}
