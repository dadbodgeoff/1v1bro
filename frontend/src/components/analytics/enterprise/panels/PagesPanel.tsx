/**
 * PagesPanel - Page-level analytics with time on page, scroll depth
 */

import { useEffect, useState } from 'react'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { BarChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface PageStats {
  page: string
  views: number
  avg_time_on_page: number
  avg_scroll_depth: number
}

interface Props {
  dateRange: DateRange
}

export function PagesPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [pages, setPages] = useState<PageStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getPageStats(dateRange)
      setPages((result as { pages: PageStats[] })?.pages || [])
      setLoading(false)
    }
    load()
  }, [dateRange])

  const formatTime = (seconds: number) => {
    if (!seconds) return '0s'
    if (seconds < 60) return `${Math.round(seconds)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const columns: Column<PageStats>[] = [
    { 
      key: 'page', 
      label: 'Page', 
      render: (r) => <span className="font-mono text-xs text-neutral-300">{r.page}</span> 
    },
    { 
      key: 'views', 
      label: 'Views', 
      sortable: true, 
      align: 'right',
      render: (r) => <span className="text-orange-400 font-medium">{r.views.toLocaleString()}</span>
    },
    { 
      key: 'avg_time_on_page', 
      label: 'Avg Time', 
      sortable: true, 
      align: 'right',
      render: (r) => <span className="text-blue-400">{formatTime(r.avg_time_on_page)}</span>
    },
    { 
      key: 'avg_scroll_depth', 
      label: 'Scroll Depth', 
      sortable: true, 
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${r.avg_scroll_depth}%` }} 
            />
          </div>
          <span className="text-green-400 w-10 text-right">{r.avg_scroll_depth}%</span>
        </div>
      )
    },
  ]

  // Top pages chart data
  const chartData = pages.slice(0, 8).map(p => ({
    label: p.page.replace(/^\//, '').slice(0, 12) || 'home',
    value: p.views,
  }))

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Top Pages Chart */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Pages by Views</h3>
        {chartData.length > 0 ? (
          <BarChart data={chartData} height={120} horizontal />
        ) : (
          <div className="text-neutral-500 text-sm">No page data</div>
        )}
      </div>

      {/* Full Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">All Pages</h3>
        <DataTable
          columns={columns}
          data={pages}
          keyField="page"
          maxHeight="400px"
          emptyMessage="No page data available"
        />
      </div>
    </div>
  )
}
