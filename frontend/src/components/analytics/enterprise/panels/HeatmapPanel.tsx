/**
 * HeatmapPanel - Click heatmap visualization
 * 
 * Requirements: 12.3 - Scroll depth milestone display
 */

import { useEffect, useState } from 'react'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface ClickData {
  x_percent: number
  y_percent: number
  element_tag?: string
  element_id?: string
  element_text?: string
  click_type?: string
  is_rage_click?: boolean
  is_dead_click?: boolean
}

interface HeatmapData {
  heatmap: Array<{ x: number; y: number; count: number }>
  total_clicks: number
  rage_clicks: Array<ClickData>
  dead_clicks: Array<ClickData>
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

  // Returns RGB color string for gradient based on intensity (0-1)
  const getHeatColorRGB = (intensity: number): string => {
    if (intensity > 0.8) return 'rgba(239,68,68,0.9)'   // red
    if (intensity > 0.6) return 'rgba(249,115,22,0.85)' // orange
    if (intensity > 0.4) return 'rgba(234,179,8,0.8)'   // yellow
    if (intensity > 0.2) return 'rgba(34,197,94,0.75)'  // green
    return 'rgba(59,130,246,0.7)'                        // blue
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-400">Click Heatmap</h3>
              <span className="text-xs text-neutral-500">
                {data?.heatmap.length || 0} click zones detected
              </span>
            </div>
            
            {/* Page wireframe with heatmap overlay */}
            <div className="relative w-full aspect-[16/10] bg-neutral-950 rounded-lg overflow-hidden border border-white/5">
              {/* Simulated page wireframe */}
              <div className="absolute inset-0 opacity-20">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 h-[8%] bg-white/10 border-b border-white/5" />
                {/* Nav */}
                <div className="absolute top-[8%] left-[5%] w-[20%] h-[4%] bg-white/5 rounded" />
                <div className="absolute top-[8%] right-[5%] w-[15%] h-[4%] bg-white/5 rounded" />
                {/* Hero */}
                <div className="absolute top-[15%] left-[10%] right-[10%] h-[25%] bg-white/5 rounded" />
                {/* Content blocks */}
                <div className="absolute top-[45%] left-[5%] w-[28%] h-[20%] bg-white/5 rounded" />
                <div className="absolute top-[45%] left-[36%] w-[28%] h-[20%] bg-white/5 rounded" />
                <div className="absolute top-[45%] right-[5%] w-[28%] h-[20%] bg-white/5 rounded" />
                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-white/5 border-t border-white/5" />
              </div>
              
              {/* Heatmap dots with gradient effect */}
              {data?.heatmap.map((cell, i) => {
                const intensity = cell.count / maxCount
                const size = 20 + intensity * 40 // 20-60px based on intensity
                const opacity = 0.3 + intensity * 0.5 // 0.3-0.8 opacity
                return (
                  <div
                    key={i}
                    className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125"
                    style={{ 
                      left: `${cell.x}%`, 
                      top: `${cell.y}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      background: `radial-gradient(circle, ${getHeatColorRGB(intensity)} 0%, transparent 70%)`,
                      opacity,
                    }}
                    title={`${cell.count} clicks at (${cell.x}%, ${cell.y}%)`}
                  />
                )
              })}
              
              {/* Rage click markers */}
              {data?.rage_clicks.slice(0, 5).map((c, i) => (
                <div
                  key={`rage-${i}`}
                  className="absolute w-4 h-4 border-2 border-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{ left: `${c.x_percent}%`, top: `${c.y_percent}%` }}
                  title={`Rage click: ${c.element_text || 'unknown element'}`}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-400 whitespace-nowrap">
                    rage
                  </span>
                </div>
              ))}
              
              {(!data?.heatmap || data.heatmap.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🖱️</div>
                    <div>No click data for this page</div>
                    <div className="text-xs mt-1">Try selecting a different page or date range</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 70%)' }} /> 
                  Low
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.8) 0%, transparent 70%)' }} /> 
                  Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.8) 0%, transparent 70%)' }} /> 
                  High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.8) 0%, transparent 70%)' }} /> 
                  Very High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, transparent 70%)' }} /> 
                  Hot
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 border-2 border-red-500 rounded-full animate-pulse" />
                <span className="text-red-400">Rage clicks</span>
              </div>
            </div>
          </div>

          {/* Scroll Depth Milestones */}
          {data?.scroll_milestones && data.scroll_milestones.total_views > 0 && (
            <ScrollDepthMilestones 
              milestones={data.scroll_milestones} 
              totalViews={data.scroll_milestones.total_views} 
            />
          )}

          {/* Top Clicked Elements */}
          <TopClickedElements rageClicks={data?.rage_clicks || []} deadClicks={data?.dead_clicks || []} />

          {/* Problem Clicks */}
          {(data?.rage_clicks.length || data?.dead_clicks.length) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data?.rage_clicks.length ? (
                <div className="bg-white/5 rounded-xl border border-red-500/30 p-5">
                  <h3 className="text-sm font-medium text-red-400 mb-4">
                    🔥 Rage Clicks ({data.rage_clicks.length})
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Users clicking rapidly in frustration - indicates UX issues
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.rage_clicks.slice(0, 10).map((c, i) => (
                      <div key={i} className="text-xs p-2 bg-red-500/10 rounded flex items-center gap-2">
                        <span className="text-red-400 font-mono">{c.element_tag || 'div'}</span>
                        {c.element_id && <span className="text-neutral-500">#{c.element_id}</span>}
                        {c.element_text && (
                          <span className="text-white truncate flex-1" title={c.element_text}>
                            "{c.element_text.slice(0, 30)}{c.element_text.length > 30 ? '...' : ''}"
                          </span>
                        )}
                        <span className="text-neutral-600 text-[10px]">
                          ({c.x_percent.toFixed(0)}%, {c.y_percent.toFixed(0)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {data?.dead_clicks.length ? (
                <div className="bg-white/5 rounded-xl border border-yellow-500/30 p-5">
                  <h3 className="text-sm font-medium text-yellow-400 mb-4">
                    💀 Dead Clicks ({data.dead_clicks.length})
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Clicks on non-interactive elements - users expect these to be clickable
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.dead_clicks.slice(0, 10).map((c, i) => (
                      <div key={i} className="text-xs p-2 bg-yellow-500/10 rounded flex items-center gap-2">
                        <span className="text-yellow-400 font-mono">{c.element_tag || 'div'}</span>
                        {c.element_id && <span className="text-neutral-500">#{c.element_id}</span>}
                        {c.element_text && (
                          <span className="text-white truncate flex-1" title={c.element_text}>
                            "{c.element_text.slice(0, 30)}{c.element_text.length > 30 ? '...' : ''}"
                          </span>
                        )}
                        <span className="text-neutral-600 text-[10px]">
                          ({c.x_percent.toFixed(0)}%, {c.y_percent.toFixed(0)}%)
                        </span>
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


/**
 * TopClickedElements - Shows aggregated click data by element
 */
function TopClickedElements({ rageClicks, deadClicks }: { rageClicks: ClickData[]; deadClicks: ClickData[] }) {
  // Aggregate clicks by element
  const elementCounts = new Map<string, { count: number; tag: string; text: string; isRage: number; isDead: number }>()
  
  const processClicks = (clicks: ClickData[], isRage: boolean, isDead: boolean) => {
    for (const click of clicks) {
      const key = click.element_id || click.element_text?.slice(0, 30) || `${click.element_tag}-${Math.round(click.x_percent)}-${Math.round(click.y_percent)}`
      const existing = elementCounts.get(key) || { 
        count: 0, 
        tag: click.element_tag || 'unknown', 
        text: click.element_text || '', 
        isRage: 0, 
        isDead: 0 
      }
      existing.count++
      if (isRage) existing.isRage++
      if (isDead) existing.isDead++
      elementCounts.set(key, existing)
    }
  }
  
  processClicks(rageClicks, true, false)
  processClicks(deadClicks, false, true)
  
  const sortedElements = Array.from(elementCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
  
  if (sortedElements.length === 0) return null
  
  const maxCount = sortedElements[0]?.[1].count || 1
  
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-5">
      <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Clicked Elements</h3>
      <div className="space-y-3">
        {sortedElements.map(([key, data], i) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 w-4">{i + 1}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-cyan-400">&lt;{data.tag}&gt;</span>
                {data.text && (
                  <span className="text-xs text-neutral-300 truncate max-w-[200px]" title={data.text}>
                    {data.text.slice(0, 25)}{data.text.length > 25 ? '...' : ''}
                  </span>
                )}
                {data.isRage > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                    {data.isRage} rage
                  </span>
                )}
                {data.isDead > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                    {data.isDead} dead
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                  style={{ width: `${(data.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-white w-12 text-right">{data.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
