/**
 * PerformancePanel - Core Web Vitals and performance metrics
 */

import { useEffect, useState } from 'react'
import { WebVitalCard, MetricCard } from '../MetricCard'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface PerformanceData {
  aggregates: {
    lcp: { avg: number | null; p75: number | null; p95: number | null }
    fid: { avg: number | null; p75: number | null; p95: number | null }
    cls: { avg: number | null; p75: number | null; p95: number | null }
    ttfb: { avg: number | null; p75: number | null; p95: number | null }
    fcp: { avg: number | null; p75: number | null; p95: number | null }
    load_time: { avg: number | null; p75: number | null; p95: number | null }
  }
  grades: Record<string, string>
}

interface ScrollPage {
  page: string
  views: number
  avg_scroll_depth: number
  reached_25_pct: number
  reached_50_pct: number
  reached_75_pct: number
  reached_100_pct: number
}

interface Props {
  dateRange: DateRange
}

export function PerformancePanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [perf, setPerf] = useState<PerformanceData | null>(null)
  const [scrollPages, setScrollPages] = useState<ScrollPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [p, s] = await Promise.all([
        api.getPerformance(dateRange),
        api.getScrollDepth(dateRange),
      ])
      setPerf(p as PerformanceData)
      setScrollPages((s as { pages: ScrollPage[] })?.pages || [])
      setLoading(false)
    }
    load()
  }, [dateRange])

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  const scrollColumns: Column<ScrollPage>[] = [
    { key: 'page', label: 'Page', render: (r) => <span className="font-mono text-xs">{r.page}</span> },
    { key: 'views', label: 'Views', sortable: true, align: 'right', render: (r) => <span className="text-blue-400">{r.views}</span> },
    { key: 'avg_scroll_depth', label: 'Avg Depth', sortable: true, align: 'right', render: (r) => `${r.avg_scroll_depth}%` },
    { key: 'reached_50_pct', label: '50%', align: 'right', render: (r) => <span className="text-neutral-400">{r.reached_50_pct}%</span> },
    { key: 'reached_100_pct', label: '100%', align: 'right', render: (r) => <span className="text-green-400">{r.reached_100_pct}%</span> },
  ]

  return (
    <div className="space-y-6">
      {/* Core Web Vitals */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Core Web Vitals (p75)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WebVitalCard
            name="LCP"
            label="Largest Contentful Paint"
            value={perf?.aggregates.lcp.p75 ?? null}
            unit="ms"
            grade={perf?.grades.lcp || 'N/A'}
            thresholds={{ good: 2500, poor: 4000 }}
          />
          <WebVitalCard
            name="FID"
            label="First Input Delay"
            value={perf?.aggregates.fid.p75 ?? null}
            unit="ms"
            grade={perf?.grades.fid || 'N/A'}
            thresholds={{ good: 100, poor: 300 }}
          />
          <WebVitalCard
            name="CLS"
            label="Cumulative Layout Shift"
            value={perf?.aggregates.cls.p75 ?? null}
            unit=""
            grade={perf?.grades.cls || 'N/A'}
            thresholds={{ good: 0.1, poor: 0.25 }}
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Loading Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="TTFB (p75)" value={perf?.aggregates.ttfb.p75} unit="ms" />
          <MetricCard label="FCP (p75)" value={perf?.aggregates.fcp.p75} unit="ms" />
          <MetricCard label="Load Time (p75)" value={perf?.aggregates.load_time.p75} unit="ms" />
          <MetricCard label="Load Time (avg)" value={perf?.aggregates.load_time.avg} unit="ms" />
        </div>
      </div>

      {/* Scroll Depth */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Scroll Depth by Page</h3>
        <DataTable
          columns={scrollColumns}
          data={scrollPages}
          keyField="page"
          maxHeight="300px"
          emptyMessage="No scroll data available"
        />
      </div>

      {/* Performance Tips */}
      {perf && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-400 mb-2">Performance Insights</h4>
          <ul className="text-sm text-neutral-300 space-y-1">
            {perf.grades.lcp === 'Poor' && (
              <li>• LCP is poor. Consider optimizing images and reducing render-blocking resources.</li>
            )}
            {perf.grades.fid === 'Poor' && (
              <li>• FID is poor. Reduce JavaScript execution time and break up long tasks.</li>
            )}
            {perf.grades.cls === 'Poor' && (
              <li>• CLS is poor. Add size attributes to images and avoid inserting content above existing content.</li>
            )}
            {perf.grades.lcp === 'Good' && perf.grades.fid === 'Good' && perf.grades.cls === 'Good' && (
              <li>✓ All Core Web Vitals are passing! Great job.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
