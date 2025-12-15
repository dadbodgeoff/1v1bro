/**
 * UTMPanel - Campaign tracking with UTM parameters
 */

import { useEffect, useState } from 'react'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { BarChart, DonutChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface UTMData {
  sources: Array<{ name: string; count: number }>
  mediums: Array<{ name: string; count: number }>
  campaigns: Array<{ name: string; count: number }>
  terms: Array<{ name: string; count: number }>
  contents: Array<{ name: string; count: number }>
}

interface Props {
  dateRange: DateRange
}

export function UTMPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [data, setData] = useState<UTMData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getUTMBreakdown(dateRange)
      setData(result as UTMData)
      setLoading(false)
    }
    load()
  }, [dateRange])

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  const sourceData = data?.sources.slice(0, 6).map(s => ({ label: s.name || 'direct', value: s.count })) || []
  const mediumData = data?.mediums.slice(0, 6).map(m => ({ label: m.name || 'none', value: m.count })) || []
  const campaignData = data?.campaigns.slice(0, 8).map(c => ({ label: c.name || 'none', value: c.count })) || []

  const columns: Column<{ name: string; count: number }>[] = [
    { key: 'name', label: 'Value', render: (r) => <span className="font-mono text-xs">{r.name || '(none)'}</span> },
    { key: 'count', label: 'Sessions', sortable: true, align: 'right', render: (r) => <span className="text-orange-400">{r.count.toLocaleString()}</span> },
  ]

  return (
    <div className="space-y-6">
      {/* Top Row - Sources & Mediums */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Traffic Sources</h3>
          {sourceData.length > 0 ? (
            <DonutChart data={sourceData} size={100} colors={['#3b82f6', '#22c55e', '#f97316', '#eab308', '#8b5cf6', '#ec4899']} />
          ) : (
            <div className="text-neutral-500 text-sm">No source data</div>
          )}
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Mediums</h3>
          {mediumData.length > 0 ? (
            <DonutChart data={mediumData} size={100} colors={['#8b5cf6', '#14b8a6', '#f97316', '#3b82f6', '#22c55e', '#eab308']} />
          ) : (
            <div className="text-neutral-500 text-sm">No medium data</div>
          )}
        </div>
      </div>

      {/* Campaigns Bar Chart */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Campaigns</h3>
        {campaignData.length > 0 ? (
          <BarChart data={campaignData} height={140} horizontal color="#f97316" />
        ) : (
          <div className="text-neutral-500 text-sm">No campaign data</div>
        )}
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">UTM Terms</h3>
          <DataTable columns={columns} data={data?.terms || []} keyField="name" maxHeight="200px" emptyMessage="No term data" />
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">UTM Content</h3>
          <DataTable columns={columns} data={data?.contents || []} keyField="name" maxHeight="200px" emptyMessage="No content data" />
        </div>
      </div>
    </div>
  )
}
