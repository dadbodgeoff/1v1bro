/**
 * HeatmapPanel - Click heatmap visualization
 * 
 * Requirements: 12.3 - Scroll depth milestone display
 */

import { useEffect, useState } from 'react'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface HeatmapData {
  heatmap: Array<{ x: number; y: number; count: number }>
  total_clicks: number
  rage_clicks: Array<{ x_percent: number; y_percent: number; element_text?: string }>
  dead_clicks: Array<{ x_percent: number; y_percent: number; element_text?: string }>
  scroll_milestones?: {
    reached_25_pct: number
    reached_50_pct: number
    reached_75_pct: number
    reached_100_pct: number
    total_views: number
  }
}

/**
 * Validates that scroll depth milestones are monotonically decreasing
 * Property 13: Scroll depth milestones are monotonically decreasing
 * 
 * The percentage of users reaching each milestone should decrease as depth increases
 */
export function areScrollMilestonesMonotonicallyDecreasing(
  milestones: { reached_25_pct: number; reached_50_pct: number; reached_75_pct: number; reached_100_pct: number }
): boolean {
  return (
    milestones.reached_25_pct >= milestones.reached_50_pct &&
    milestones.reached_50_pct >= milestones.reached_75_pct &&
    milestones.reached_75_pct >= milestones.reached_100_pct
  )
}

/**
 * Calculates scroll depth percentages from raw counts
 */
export function calculateScrollPercentages(
  milestones: { reached_25_pct: number; reached_50_pct: number; reached_75_pct: number; reached_100_pct: number },
  totalViews: number
): { pct_25: number; pct_50: number; pct_75: number; pct_100: number } {
  if (totalViews <= 0) {
    return { pct_25: 0, pct_50: 0, pct_75: 0, pct_100: 0 }
  }
  return {
    pct_25: (milestones.reached_25_pct / totalViews) * 100,
    pct_50: (milestones.reached_50_pct / totalViews) * 100,
    pct_75: (milestones.reached_75_pct / totalViews) * 100,
    pct_100: (milestones.reached_100_pct / totalViews) * 100,
  }
}

interface Props {
  dateRange: DateRange
}

const COMMON_PAGES = ['/', '/dashboard', '/shop', '/survival', '/profile', '/login', '/signup']

export function HeatmapPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [selectedPage, setSelectedPage] = useState('/')
  const [data, setData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getHeatmap(dateRange, selectedPage)
      setData(result as HeatmapData)
      setLoading(false)
    }
    load()
  }, [dateRange, selectedPage])

  const maxCount = data?.heatmap.reduce((max, h) => Math.max(max, h.count), 0) || 1

  const getHeatColor = (count: number) => {
    const intensity = count / maxCount
    if (intensity > 0.8) return 'bg-red-500'
    if (intensity > 0.6) return 'bg-orange-500'
    if (intensity > 0.4) return 'bg-yellow-500'
    if (intensity > 0.2) return 'bg-green-500'
    return 'bg-blue-500'
  }

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-neutral-400">Page:</label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
        >
          {COMMON_PAGES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Custom path..."
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm flex-1 max-w-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSelectedPage((e.target as HTMLInputElement).value)
            }
          }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-neutral-500">Total Clicks</div>
              <div className="text-2xl font-bold text-white">{data?.total_clicks.toLocaleString() || 0}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-red-500/30 p-4">
              <div className="text-xs text-red-400">Rage Clicks</div>
              <div className="text-2xl font-bold text-red-400">{data?.rage_clicks.length || 0}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-yellow-500/30 p-4">
              <div className="text-xs text-yellow-400">Dead Clicks</div>
              <div className="text-2xl font-bold text-yellow-400">{data?.dead_clicks.length || 0}</div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-medium text-neutral-400 mb-4">Click Heatmap</h3>
            <div className="relative w-full aspect-[16/9] bg-neutral-900 rounded-lg overflow-hidden">
              {data?.heatmap.map((cell, i) => (
                <div
                  key={i}
                  className={`absolute w-[5%] h-[5%] ${getHeatColor(cell.count)} opacity-60 rounded-sm`}
                  style={{ left: `${cell.x}%`, top: `${cell.y}%` }}
                  title={`${cell.count} clicks`}
                />
              ))}
              {(!data?.heatmap || data.heatmap.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
                  No click data for this page
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> Low</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Medium</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded" /> High</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded" /> Very High</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> Hot</span>
            </div>
          </div>

          {/* Scroll Depth Milestones */}
          {data?.scroll_milestones && data.scroll_milestones.total_views > 0 && (
            <ScrollDepthMilestones 
              milestones={data.scroll_milestones} 
              totalViews={data.scroll_milestones.total_views} 
            />
          )}

          {/* Problem Clicks */}
          {(data?.rage_clicks.length || data?.dead_clicks.length) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data?.rage_clicks.length ? (
                <div className="bg-white/5 rounded-xl border border-red-500/30 p-5">
                  <h3 className="text-sm font-medium text-red-400 mb-4">Rage Clicks (Frustration)</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.rage_clicks.slice(0, 10).map((c, i) => (
                      <div key={i} className="text-xs p-2 bg-red-500/10 rounded">
                        <span className="text-neutral-400">({c.x_percent.toFixed(0)}%, {c.y_percent.toFixed(0)}%)</span>
                        {c.element_text && <span className="ml-2 text-white">"{c.element_text}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {data?.dead_clicks.length ? (
                <div className="bg-white/5 rounded-xl border border-yellow-500/30 p-5">
                  <h3 className="text-sm font-medium text-yellow-400 mb-4">Dead Clicks (No Response)</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.dead_clicks.slice(0, 10).map((c, i) => (
                      <div key={i} className="text-xs p-2 bg-yellow-500/10 rounded">
                        <span className="text-neutral-400">({c.x_percent.toFixed(0)}%, {c.y_percent.toFixed(0)}%)</span>
                        {c.element_text && <span className="ml-2 text-white">"{c.element_text}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

/**
 * ScrollDepthMilestones - Displays scroll depth milestone percentages
 * Requirement 12.3: Show 25%, 50%, 75%, 100% milestone percentages
 */
interface ScrollDepthMilestonesProps {
  milestones: {
    reached_25_pct: number
    reached_50_pct: number
    reached_75_pct: number
    reached_100_pct: number
  }
  totalViews: number
}

function ScrollDepthMilestones({ milestones, totalViews }: ScrollDepthMilestonesProps) {
  const percentages = calculateScrollPercentages(milestones, totalViews)
  const isValid = areScrollMilestonesMonotonicallyDecreasing(milestones)

  const milestoneData = [
    { label: '25%', value: percentages.pct_25, count: milestones.reached_25_pct },
    { label: '50%', value: percentages.pct_50, count: milestones.reached_50_pct },
    { label: '75%', value: percentages.pct_75, count: milestones.reached_75_pct },
    { label: '100%', value: percentages.pct_100, count: milestones.reached_100_pct },
  ]

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-400">Scroll Depth Milestones</h3>
        {!isValid && (
          <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
            ⚠️ Data anomaly
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {milestoneData.map((m) => (
          <div key={m.label} className="text-center">
            <div className="text-xs text-neutral-500 mb-1">Reached {m.label}</div>
            <div className="text-2xl font-bold text-white">{m.value.toFixed(1)}%</div>
            <div className="text-xs text-neutral-500">{m.count.toLocaleString()} users</div>
          </div>
        ))}
      </div>

      {/* Visual bar representation */}
      <div className="mt-4 space-y-2">
        {milestoneData.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 w-12">{m.label}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                style={{ width: `${Math.min(m.value, 100)}%` }}
              />
            </div>
            <span className="text-xs text-neutral-400 w-16 text-right">{m.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
