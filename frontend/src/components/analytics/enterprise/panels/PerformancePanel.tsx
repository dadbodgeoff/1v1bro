/**
 * PerformancePanel - Core Web Vitals and performance metrics
 * 
 * Requirements: 13.1, 13.2, 13.4 - Web Vitals grading, percentiles, warning indicators
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

/**
 * Web Vitals thresholds based on Google's Core Web Vitals standards
 * Used for grading and warning indicators
 */
export const WEB_VITALS_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000, unit: 'ms' },
  fid: { good: 100, poor: 300, unit: 'ms' },
  cls: { good: 0.1, poor: 0.25, unit: '' },
  ttfb: { good: 800, poor: 1800, unit: 'ms' },
  fcp: { good: 1800, poor: 3000, unit: 'ms' },
} as const

export type VitalGrade = 'Good' | 'Needs Improvement' | 'Poor' | 'N/A'

/**
 * Calculates the grade for a Web Vital metric based on standard thresholds
 * Property 14: Web Vitals grading follows thresholds
 */
export function getWebVitalGrade(
  metric: keyof typeof WEB_VITALS_THRESHOLDS,
  value: number | null
): VitalGrade {
  if (value === null || value === undefined) return 'N/A'
  const thresholds = WEB_VITALS_THRESHOLDS[metric]
  if (value <= thresholds.good) return 'Good'
  if (value <= thresholds.poor) return 'Needs Improvement'
  return 'Poor'
}

/**
 * Validates that p75 <= p95 for percentile ordering
 * Property 15: Percentile ordering
 */
export function validatePercentileOrdering(p75: number | null, p95: number | null): boolean {
  if (p75 === null || p95 === null) return true // Can't validate if missing
  return p75 <= p95
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

  // Calculate grades using our grading function
  const lcpGrade = getWebVitalGrade('lcp', perf?.aggregates.lcp.p75 ?? null)
  const fidGrade = getWebVitalGrade('fid', perf?.aggregates.fid.p75 ?? null)
  const clsGrade = getWebVitalGrade('cls', perf?.aggregates.cls.p75 ?? null)

  // Check for degraded performance (any Poor grades)
  const hasDegradedPerformance = [lcpGrade, fidGrade, clsGrade].includes('Poor')

  return (
    <div className="space-y-6">
      {/* Performance Warning Banner */}
      {hasDegradedPerformance && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-red-400 text-xl">⚠️</span>
          <div>
            <h4 className="text-sm font-medium text-red-400">Performance Issues Detected</h4>
            <p className="text-xs text-red-400/70">One or more Core Web Vitals are below acceptable thresholds</p>
          </div>
        </div>
      )}

      {/* Core Web Vitals */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Core Web Vitals (p75)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WebVitalCard
            name="LCP"
            label="Largest Contentful Paint"
            value={perf?.aggregates.lcp.p75 ?? null}
            unit="ms"
            grade={lcpGrade}
            thresholds={{ good: 2500, poor: 4000 }}
          />
          <WebVitalCard
            name="FID"
            label="First Input Delay"
            value={perf?.aggregates.fid.p75 ?? null}
            unit="ms"
            grade={fidGrade}
            thresholds={{ good: 100, poor: 300 }}
          />
          <WebVitalCard
            name="CLS"
            label="Cumulative Layout Shift"
            value={perf?.aggregates.cls.p75 ?? null}
            unit=""
            grade={clsGrade}
            thresholds={{ good: 0.1, poor: 0.25 }}
          />
        </div>
      </div>

      {/* Percentile Comparison (p75 vs p95) */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Percentile Comparison (p75 / p95)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PercentileCard
            label="LCP"
            p75={perf?.aggregates.lcp.p75 ?? null}
            p95={perf?.aggregates.lcp.p95 ?? null}
            unit="ms"
            thresholds={WEB_VITALS_THRESHOLDS.lcp}
          />
          <PercentileCard
            label="FID"
            p75={perf?.aggregates.fid.p75 ?? null}
            p95={perf?.aggregates.fid.p95 ?? null}
            unit="ms"
            thresholds={WEB_VITALS_THRESHOLDS.fid}
          />
          <PercentileCard
            label="CLS"
            p75={perf?.aggregates.cls.p75 ?? null}
            p95={perf?.aggregates.cls.p95 ?? null}
            unit=""
            thresholds={WEB_VITALS_THRESHOLDS.cls}
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
            {lcpGrade === 'Poor' && (
              <li>• LCP is poor. Consider optimizing images and reducing render-blocking resources.</li>
            )}
            {fidGrade === 'Poor' && (
              <li>• FID is poor. Reduce JavaScript execution time and break up long tasks.</li>
            )}
            {clsGrade === 'Poor' && (
              <li>• CLS is poor. Add size attributes to images and avoid inserting content above existing content.</li>
            )}
            {lcpGrade === 'Needs Improvement' && (
              <li>• LCP needs improvement. Consider lazy loading images and optimizing server response time.</li>
            )}
            {fidGrade === 'Needs Improvement' && (
              <li>• FID needs improvement. Consider code splitting and deferring non-critical JavaScript.</li>
            )}
            {clsGrade === 'Needs Improvement' && (
              <li>• CLS needs improvement. Reserve space for dynamic content and use transform animations.</li>
            )}
            {lcpGrade === 'Good' && fidGrade === 'Good' && clsGrade === 'Good' && (
              <li>✓ All Core Web Vitals are passing! Great job.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * PercentileCard - Displays p75 and p95 values side by side
 * Requirement 13.2: Display p75 and p95 percentiles alongside averages
 */
interface PercentileCardProps {
  label: string
  p75: number | null
  p95: number | null
  unit: string
  thresholds: { good: number; poor: number }
}

function PercentileCard({ label, p75, p95, unit, thresholds }: PercentileCardProps) {
  const formatValue = (v: number | null) => {
    if (v === null) return '—'
    return unit === 'ms' ? `${Math.round(v)}${unit}` : v.toFixed(2)
  }

  const getValueColor = (v: number | null) => {
    if (v === null) return 'text-neutral-500'
    if (v <= thresholds.good) return 'text-green-400'
    if (v <= thresholds.poor) return 'text-yellow-400'
    return 'text-red-400'
  }

  // Validate percentile ordering (Property 15)
  const isValidOrdering = validatePercentileOrdering(p75, p95)

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4">
      <div className="text-xs text-neutral-400 uppercase tracking-wide mb-3">{label}</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-neutral-500 mb-1">p75</div>
          <div className={`text-lg font-bold ${getValueColor(p75)}`}>
            {formatValue(p75)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500 mb-1">p95</div>
          <div className={`text-lg font-bold ${getValueColor(p95)}`}>
            {formatValue(p95)}
          </div>
        </div>
      </div>
      {!isValidOrdering && (
        <div className="text-xs text-red-400 mt-2">⚠️ Invalid percentile ordering</div>
      )}
    </div>
  )
}
