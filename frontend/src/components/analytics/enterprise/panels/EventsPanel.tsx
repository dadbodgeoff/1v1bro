/**
 * EventsPanel - Raw event explorer
 */

import { useEffect, useState } from 'react'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface AnalyticsEvent {
  id: string
  event_name: string
  page: string
  session_id: string
  visitor_id?: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface Props {
  dateRange: DateRange
}

export function EventsPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getEvents(dateRange)
      setEvents((result as { events: AnalyticsEvent[] })?.events || [])
      setLoading(false)
    }
    load()
  }, [dateRange])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const filteredEvents = filter
    ? events.filter(e => 
        e.event_name.toLowerCase().includes(filter.toLowerCase()) ||
        e.page.toLowerCase().includes(filter.toLowerCase())
      )
    : events

  // Group by event name for summary
  const eventCounts = events.reduce((acc, e) => {
    acc[e.event_name] = (acc[e.event_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const columns: Column<AnalyticsEvent>[] = [
    { 
      key: 'created_at', 
      label: 'Time', 
      width: '140px',
      render: (r) => <span className="text-xs text-neutral-400">{formatTime(r.created_at)}</span> 
    },
    { 
      key: 'event_name', 
      label: 'Event', 
      render: (r) => <span className="font-medium text-orange-400">{r.event_name}</span> 
    },
    { 
      key: 'page', 
      label: 'Page', 
      render: (r) => <span className="font-mono text-xs text-neutral-300">{r.page}</span> 
    },
    { 
      key: 'metadata', 
      label: 'Data', 
      align: 'center',
      render: (r) => r.metadata && Object.keys(r.metadata).length > 0 
        ? <span className="text-blue-400 cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>📋</span>
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
      {/* Top Events Summary */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Events</h3>
        <div className="flex flex-wrap gap-2">
          {topEvents.map(([name, count]) => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                filter === name 
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' 
                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {name} <span className="text-neutral-500 ml-1">{count}</span>
            </button>
          ))}
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 border border-red-500/50 text-red-400"
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Filter events..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm flex-1 max-w-md"
        />
        <span className="text-sm text-neutral-500">{filteredEvents.length} events</span>
      </div>

      {/* Events Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <DataTable
          columns={columns}
          data={filteredEvents}
          keyField="id"
          maxHeight="500px"
          emptyMessage="No events found"
        />
      </div>

      {/* Expanded Metadata */}
      {expandedId && (
        <div className="bg-white/5 rounded-xl border border-blue-500/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-400">Event Metadata</h3>
            <button onClick={() => setExpandedId(null)} className="text-xs text-neutral-500 hover:text-white">
              Close ✕
            </button>
          </div>
          <pre className="text-xs text-neutral-300 bg-black/30 p-3 rounded-lg overflow-x-auto">
            {JSON.stringify(events.find(e => e.id === expandedId)?.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
