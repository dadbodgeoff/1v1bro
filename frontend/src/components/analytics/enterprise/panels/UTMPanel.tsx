/**
 * UTMPanel - Campaign tracking with UTM parameters
 * 
 * Requirements: 14.2, 14.4 - Conversion rate calculation and trend comparison
 */

import { useEffect, useState } from 'react'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { DonutChart } from '../MiniChart'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface UTMData {
  sources: Array<{ name: string; count: number; conversions?: number; previous_count?: number }>
  mediums: Array<{ name: string; count: number; conversions?: number; previous_count?: number }>
  campaigns: Array<{ name: string; count: number; conversions?: number; previous_count?: number }>
  terms: Array<{ name: string; count: number }>
  contents: Array<{ name: string; count: number }>
}

/**
 * Calculates conversion rate for a campaign
 * Property 16: Campaign conversion rate calculation
 * 
 * @param conversions Number of conversions
 * @param visitors Number of visitors
 * @returns Conversion rate as percentage (0-100)
 */
export function calculateConversionRate(conversions: number, visitors: number): number {
  if (visitors <= 0) return 0
  return (conversions / visitors) * 100
}

/**
 * Calculates trend percentage between current and previous period
 */
export function calculateTrendPercentage(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
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

  const columns: Column<{ name: string; count: number }>[] = [
    { key: 'name', label: 'Value', render: (r) => <span className="font-mono text-xs">{r.name || '(none)'}</span> },
    { key: 'count', label: 'Sessions', sortable: true, align: 'right', render: (r) => <span className="text-orange-400">{r.count.toLocaleString()}</span> },
  ]

  // Campaign columns with conversion rate and trend
  const campaignColumns: Column<{ name: string; count: number; conversions?: number; previous_count?: number }>[] = [
    { 
      key: 'name', 
      label: 'Campaign', 
      render: (r) => <span className="font-mono text-xs">{r.name || '(none)'}</span> 
    },
    { 
      key: 'count', 
      label: 'Visitors', 
      sortable: true, 
      align: 'right', 
      render: (r) => <span className="text-white">{r.count.toLocaleString()}</span> 
    },
    { 
      key: 'conversions', 
      label: 'Conversions', 
      sortable: true, 
      align: 'right', 
      render: (r) => <span className="text-green-400">{(r.conversions || 0).toLocaleString()}</span> 
    },
    { 
      key: 'conversion_rate', 
      label: 'Conv. Rate', 
      sortable: true, 
      align: 'right', 
      render: (r) => {
        const rate = calculateConversionRate(r.conversions || 0, r.count)
        return (
          <span className={rate > 5 ? 'text-green-400' : rate > 2 ? 'text-yellow-400' : 'text-neutral-400'}>
            {rate.toFixed(2)}%
          </span>
        )
      }
    },
    { 
      key: 'trend', 
      label: 'Trend', 
      align: 'right', 
      render: (r) => {
        const trend = calculateTrendPercentage(r.count, r.previous_count || 0)
        if (trend === null) return <span className="text-neutral-500">—</span>
        const isPositive = trend > 0
        return (
          <span className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </span>
        )
      }
    },
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

      {/* Campaigns with Conversion Rates */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Campaign Performance</h3>
        {data?.campaigns && data.campaigns.length > 0 ? (
          <DataTable
            columns={campaignColumns}
            data={data.campaigns}
            keyField="name"
            maxHeight="300px"
            emptyMessage="No campaign data"
          />
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
