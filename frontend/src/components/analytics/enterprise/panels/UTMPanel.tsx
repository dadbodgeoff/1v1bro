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

// Raw data from API (matches backend response)
interface RawUTMData {
  sources: Array<{ name: string; visitors: number; conversions: number; conversion_rate: number }>
  campaigns: Array<{ name: string; visitors: number; conversions: number; conversion_rate: number }>
}

// Transformed data for display
interface UTMData {
  sources: Array<{ name: string; count: number; conversions?: number; conversion_rate?: number }>
  campaigns: Array<{ name: string; count: number; conversions?: number; conversion_rate?: number }>
}

// Transform raw API data to display format
function transformUTMData(raw: RawUTMData | null): UTMData | null {
  if (!raw) return null
  return {
    sources: (raw.sources || []).map(s => ({
      name: s.name,
      count: s.visitors,
      conversions: s.conversions,
      conversion_rate: s.conversion_rate,
    })),
    campaigns: (raw.campaigns || []).map(c => ({
      name: c.name,
      count: c.visitors,
      conversions: c.conversions,
      conversion_rate: c.conversion_rate,
    })),
  }
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
      setData(transformUTMData(result as RawUTMData))
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
  const campaignData = data?.campaigns.slice(0, 6).map(c => ({ label: c.name || 'none', value: c.count })) || []

  // Source columns with conversion rate
  const sourceColumns: Column<{ name: string; count: number; conversions?: number; conversion_rate?: number }>[] = [
    { 
      key: 'name', 
      label: 'Source', 
      render: (r) => <span className="font-mono text-xs">{r.name || '(direct)'}</span> 
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
      align: 'right', 
      render: (r) => {
        const rate = r.conversion_rate ?? calculateConversionRate(r.conversions || 0, r.count)
        return (
          <span className={rate > 5 ? 'text-green-400' : rate > 2 ? 'text-yellow-400' : 'text-neutral-400'}>
            {rate.toFixed(1)}%
          </span>
        )
      }
    },
  ]

  // Campaign columns with conversion rate
  const campaignColumns: Column<{ name: string; count: number; conversions?: number; conversion_rate?: number }>[] = [
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
      align: 'right', 
      render: (r) => {
        const rate = r.conversion_rate ?? calculateConversionRate(r.conversions || 0, r.count)
        return (
          <span className={rate > 5 ? 'text-green-400' : rate > 2 ? 'text-yellow-400' : 'text-neutral-400'}>
            {rate.toFixed(1)}%
          </span>
        )
      }
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Row - Sources & Campaigns Charts */}
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
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Campaigns</h3>
          {campaignData.length > 0 ? (
            <DonutChart data={campaignData} size={100} colors={['#8b5cf6', '#14b8a6', '#f97316', '#3b82f6', '#22c55e', '#eab308']} />
          ) : (
            <div className="text-neutral-500 text-sm">No campaign data</div>
          )}
        </div>
      </div>

      {/* Sources Table with Conversion Rates */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Source Performance</h3>
        {data?.sources && data.sources.length > 0 ? (
          <DataTable
            columns={sourceColumns}
            data={data.sources}
            keyField="name"
            maxHeight="250px"
            emptyMessage="No source data"
          />
        ) : (
          <div className="text-neutral-500 text-sm">No source data</div>
        )}
      </div>

      {/* Campaigns Table with Conversion Rates */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Campaign Performance</h3>
        {data?.campaigns && data.campaigns.length > 0 ? (
          <DataTable
            columns={campaignColumns}
            data={data.campaigns}
            keyField="name"
            maxHeight="250px"
            emptyMessage="No campaign data"
          />
        ) : (
          <div className="text-neutral-500 text-sm">No campaign data</div>
        )}
      </div>
    </div>
  )
}
