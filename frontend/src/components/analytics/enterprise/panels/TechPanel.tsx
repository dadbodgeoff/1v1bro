/**
 * TechPanel - Browser, OS, screen size, and geo breakdown
 */

import { useEffect, useState } from 'react'
import { DonutChart, BarChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface TechData {
  browsers: Array<{ name: string; count: number }>
  operating_systems: Array<{ name: string; count: number }>
  screen_sizes: Array<{ name: string; count: number }>
}

interface GeoData {
  timezones: Array<{ name: string; count: number }>
  languages: Array<{ name: string; count: number }>
}

interface Props {
  dateRange: DateRange
}

export function TechPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [tech, setTech] = useState<TechData | null>(null)
  const [geo, setGeo] = useState<GeoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [t, g] = await Promise.all([
        api.getTechBreakdown(dateRange),
        api.getGeoBreakdown(dateRange),
      ])
      setTech(t as TechData)
      setGeo(g as GeoData)
      setLoading(false)
    }
    load()
  }, [dateRange])

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  const browserData = tech?.browsers.slice(0, 5).map(b => ({ label: b.name, value: b.count })) || []
  const osData = tech?.operating_systems.slice(0, 5).map(o => ({ label: o.name, value: o.count })) || []
  const screenData = tech?.screen_sizes.map(s => ({ label: s.name, value: s.count })) || []
  const langData = geo?.languages.slice(0, 6).map(l => ({ label: l.name, value: l.count })) || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Browsers */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Browsers</h3>
          {browserData.length > 0 ? (
            <DonutChart data={browserData} size={100} colors={['#3b82f6', '#22c55e', '#f97316', '#eab308', '#8b5cf6']} />
          ) : (
            <div className="text-neutral-500 text-sm">No browser data</div>
          )}
        </div>

        {/* Operating Systems */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Operating Systems</h3>
          {osData.length > 0 ? (
            <DonutChart data={osData} size={100} colors={['#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6']} />
          ) : (
            <div className="text-neutral-500 text-sm">No OS data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Screen Sizes */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Screen Sizes</h3>
          {screenData.length > 0 ? (
            <BarChart data={screenData} height={120} horizontal color="#22c55e" />
          ) : (
            <div className="text-neutral-500 text-sm">No screen data</div>
          )}
        </div>

        {/* Languages */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Languages</h3>
          {langData.length > 0 ? (
            <BarChart data={langData} height={120} horizontal color="#3b82f6" />
          ) : (
            <div className="text-neutral-500 text-sm">No language data</div>
          )}
        </div>
      </div>

      {/* Timezones */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Timezones</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {geo?.timezones.slice(0, 10).map((tz, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-neutral-500 truncate" title={tz.name}>
                {tz.name.split('/').pop()}
              </div>
              <div className="text-lg font-bold text-white">{tz.count}</div>
            </div>
          ))}
          {(!geo?.timezones || geo.timezones.length === 0) && (
            <div className="col-span-full text-neutral-500 text-sm">No timezone data</div>
          )}
        </div>
      </div>
    </div>
  )
}
