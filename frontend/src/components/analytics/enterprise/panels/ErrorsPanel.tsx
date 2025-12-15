/**
 * ErrorsPanel - JS error tracking and resolution
 */

import { useEffect, useState, useCallback } from 'react'
import { DataTable, Pagination } from '../DataTable'
import type { Column } from '../DataTable'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface ErrorItem {
  id: string
  error_type: string
  error_message: string
  error_source: string | null
  error_line: number | null
  component: string | null
  occurrence_count: number
  first_seen: string
  last_seen: string
  resolved: boolean
  browser: string
}

interface ErrorsData {
  errors: ErrorItem[]
  total: number
  summary: {
    by_type: Record<string, number>
    unresolved: number
  }
}

interface Props {
  dateRange: DateRange
}

export function ErrorsPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [data, setData] = useState<ErrorsData | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedError, setSelectedError] = useState<ErrorItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await api.getErrors(dateRange, page, showResolved, search)
    setData(result as ErrorsData)
    setLoading(false)
  }, [dateRange, page, showResolved, search])

  useEffect(() => {
    load()
  }, [load])

  const handleResolve = async (errorId: string) => {
    await api.resolveError(errorId)
    load()
    setSelectedError(null)
  }

  const columns: Column<ErrorItem>[] = [
    {
      key: 'error_message',
      label: 'Error',
      render: (r) => (
        <div className="max-w-md">
          <span className={`px-1.5 py-0.5 rounded text-xs mr-2 ${
            r.error_type === 'js_error' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {r.error_type}
          </span>
          <span className="text-neutral-300 text-xs">{r.error_message.slice(0, 80)}</span>
        </div>
      ),
    },
    {
      key: 'error_source',
      label: 'Source',
      render: (r) => r.error_source ? (
        <span className="font-mono text-xs text-neutral-500">
          {r.error_source.split('/').pop()}:{r.error_line}
        </span>
      ) : '—',
    },
    {
      key: 'occurrence_count',
      label: 'Count',
      sortable: true,
      align: 'right',
      render: (r) => <span className="text-orange-400 font-medium">{r.occurrence_count}</span>,
    },
    {
      key: 'browser',
      label: 'Browser',
      render: (r) => <span className="text-xs text-neutral-500">{r.browser}</span>,
    },
    {
      key: 'last_seen',
      label: 'Last Seen',
      sortable: true,
      render: (r) => <span className="text-xs text-neutral-500">{new Date(r.last_seen).toLocaleDateString()}</span>,
    },
  ]

  const totalPages = Math.ceil((data?.total || 0) / 50)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-xs text-neutral-400 mb-1">Total Errors</div>
          <div className="text-2xl font-bold text-white">{data?.total || 0}</div>
        </div>
        <div className="bg-red-500/10 rounded-xl border border-red-500/20 p-4">
          <div className="text-xs text-red-400 mb-1">Unresolved</div>
          <div className="text-2xl font-bold text-red-400">{data?.summary.unresolved || 0}</div>
        </div>
        {Object.entries(data?.summary.by_type || {}).slice(0, 2).map(([type, count]) => (
          <div key={type} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="text-xs text-neutral-400 mb-1">{type}</div>
            <div className="text-2xl font-bold text-white">{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search errors..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-white/5 rounded-lg text-sm border border-white/10 w-64"
        />
        <label className="flex items-center gap-2 text-sm text-neutral-400">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => { setShowResolved(e.target.checked); setPage(1) }}
            className="rounded bg-white/10 border-white/20"
          />
          Show resolved
        </label>
      </div>

      {/* Error List */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data?.errors || []}
              keyField="id"
              onRowClick={setSelectedError}
              selectedKey={selectedError?.id}
              maxHeight="400px"
              emptyMessage="No errors found"
            />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedError.error_type === 'js_error' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {selectedError.error_type}
                  </span>
                  <h3 className="text-lg font-medium text-white mt-2">{selectedError.error_message}</h3>
                </div>
                <button onClick={() => setSelectedError(null)} className="text-neutral-500 hover:text-white">✕</button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Source</span>
                  <span className="font-mono text-neutral-300">{selectedError.error_source}:{selectedError.error_line}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Component</span>
                  <span className="text-neutral-300">{selectedError.component || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Occurrences</span>
                  <span className="text-orange-400 font-medium">{selectedError.occurrence_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Browser</span>
                  <span className="text-neutral-300">{selectedError.browser}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">First Seen</span>
                  <span className="text-neutral-300">{new Date(selectedError.first_seen).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Last Seen</span>
                  <span className="text-neutral-300">{new Date(selectedError.last_seen).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {!selectedError.resolved && (
                  <button
                    onClick={() => handleResolve(selectedError.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
                <button
                  onClick={() => setSelectedError(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
