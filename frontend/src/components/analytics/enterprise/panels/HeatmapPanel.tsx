/**
 * HeatmapPanel - Click heatmap visualization
 */

import { useEffect, useState } from 'react'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface HeatmapData {
  heatmap: Array<{ x: number; y: number; count: number }>
  total_clicks: number
  rage_clicks: Array<{ x_percent: number; y_percent: number; element_text?: string }>
  dead_clicks: Array<{ x_percent: number; y_percent: number; element_text?: string }>
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
