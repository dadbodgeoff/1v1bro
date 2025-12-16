/**
 * GeographyPanel - Country and city breakdown
 * 
 * Shows geographic distribution of users for advertisers
 */

import { useEffect, useState } from 'react'
import { MetricCard } from '../MetricCard'
import { DonutChart } from '../MiniChart'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface GeoData {
  countries: Array<{
    name: string
    code: string
    count: number
    conversions: number
    conversion_rate: number
  }>
  cities: Array<{
    name: string
    country: string
    count: number
  }>
}

interface Props {
  dateRange: DateRange
}

// Country flag emoji from country code
const getFlag = (code: string) => {
  if (!code || code.length !== 2) return '🌍'
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function GeographyPanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [data, setData] = useState<GeoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getCountries(dateRange)
      setData(result as GeoData)
      setLoading(false)
    }
    load()
  }, [dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-neutral-500 text-center py-12">Failed to load geographic data</div>
  }

  const totalVisitors = data.countries.reduce((sum, c) => sum + c.count, 0)
  const totalConversions = data.countries.reduce((sum, c) => sum + c.conversions, 0)
  const topCountries = data.countries.slice(0, 5)
  const otherCount = data.countries.slice(5).reduce((sum, c) => sum + c.count, 0)

  // Chart data for top countries
  const countryChartData = [
    ...topCountries.map(c => ({ label: c.name, value: c.count })),
    ...(otherCount > 0 ? [{ label: 'Other', value: otherCount }] : []),
  ]

  // Country columns
  const countryColumns: Column<GeoData['countries'][0]>[] = [
    { 
      key: 'name', 
      label: 'Country', 
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{getFlag(r.code)}</span>
          <span className="font-medium text-white">{r.name}</span>
        </div>
      )
    },
    { 
      key: 'count', 
      label: 'Visitors', 
      sortable: true, 
      align: 'right', 
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <span className="text-white">{r.count.toLocaleString()}</span>
          <span className="text-xs text-neutral-500">
            ({((r.count / totalVisitors) * 100).toFixed(1)}%)
          </span>
        </div>
      )
    },
    { 
      key: 'conversions', 
      label: 'Conversions', 
      sortable: true, 
      align: 'right', 
      render: (r) => <span className="text-green-400">{r.conversions}</span> 
    },
    { 
      key: 'conversion_rate', 
      label: 'Conv. Rate', 
      sortable: true, 
      align: 'right', 
      render: (r) => (
        <span className={r.conversion_rate > 5 ? 'text-green-400' : r.conversion_rate > 2 ? 'text-yellow-400' : 'text-neutral-400'}>
          {r.conversion_rate.toFixed(1)}%
        </span>
      )
    },
  ]

  // City columns
  const cityColumns: Column<GeoData['cities'][0]>[] = [
    { 
      key: 'name', 
      label: 'City', 
      render: (r) => <span className="font-medium text-white">{r.name}</span>
    },
    { 
      key: 'country', 
      label: 'Country', 
      render: (r) => <span className="text-neutral-400">{r.country}</span>
    },
    { 
      key: 'count', 
      label: 'Visitors', 
      sortable: true, 
      align: 'right', 
      render: (r) => <span className="text-white">{r.count.toLocaleString()}</span>
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Countries"
          value={data.countries.length}
          icon={<span className="text-lg">🌍</span>}
        />
        <MetricCard
          label="Total Visitors"
          value={totalVisitors}
          icon={<span className="text-lg">👥</span>}
        />
        <MetricCard
          label="Total Conversions"
          value={totalConversions}
          variant="success"
          icon={<span className="text-lg">🎯</span>}
        />
        <MetricCard
          label="Top Country"
          value={topCountries[0]?.name || 'N/A'}
          description={topCountries[0] ? `${((topCountries[0].count / totalVisitors) * 100).toFixed(1)}% of traffic` : ''}
          icon={<span className="text-lg">{getFlag(topCountries[0]?.code || '')}</span>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Traffic by Country</h3>
          {countryChartData.length > 0 ? (
            <DonutChart 
              data={countryChartData} 
              size={120} 
              showPercentages 
              colors={['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#6b7280']}
            />
          ) : (
            <div className="text-neutral-500 text-sm text-center py-8">No geographic data</div>
          )}
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Countries by Visitors</h3>
          {topCountries.length > 0 ? (
            <div className="space-y-3">
              {topCountries.map((country, i) => {
                const pct = (country.count / totalVisitors) * 100
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span>{getFlag(country.code)}</span>
                        <span className="text-white">{country.name}</span>
                      </div>
                      <span className="text-neutral-400">{country.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-neutral-500 text-sm text-center py-8">No data</div>
          )}
        </div>
      </div>

      {/* Country Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">All Countries</h3>
        <DataTable
          columns={countryColumns}
          data={data.countries}
          keyField="name"
          maxHeight="300px"
          emptyMessage="No country data"
        />
      </div>

      {/* City Table */}
      {data.cities.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Cities</h3>
          <DataTable
            columns={cityColumns}
            data={data.cities}
            keyField="name"
            maxHeight="250px"
            emptyMessage="No city data"
          />
        </div>
      )}

      {/* Geographic Insights */}
      {data.countries.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-6">
          <h3 className="text-lg font-medium text-white mb-4">🌍 Geographic Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-neutral-400 mb-1">Market Concentration</div>
              <div className="text-white">
                {topCountries.slice(0, 3).reduce((sum, c) => sum + c.count, 0) / totalVisitors > 0.8
                  ? `⚠️ ${((topCountries.slice(0, 3).reduce((sum, c) => sum + c.count, 0) / totalVisitors) * 100).toFixed(0)}% of traffic from top 3 countries. Consider diversifying.`
                  : `✅ Good geographic diversity across ${data.countries.length} countries.`}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-neutral-400 mb-1">Best Converting Region</div>
              <div className="text-white">
                {data.countries.filter(c => c.conversions > 0).sort((a, b) => b.conversion_rate - a.conversion_rate)[0]
                  ? `${getFlag(data.countries.filter(c => c.conversions > 0).sort((a, b) => b.conversion_rate - a.conversion_rate)[0].code)} ${data.countries.filter(c => c.conversions > 0).sort((a, b) => b.conversion_rate - a.conversion_rate)[0].name} has the highest conversion rate at ${data.countries.filter(c => c.conversions > 0).sort((a, b) => b.conversion_rate - a.conversion_rate)[0].conversion_rate.toFixed(1)}%`
                  : 'No conversion data yet'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
