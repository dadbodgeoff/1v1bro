/**
 * RevenuePanel - Monetization metrics for advertisers
 * 
 * Shows: Revenue, ARPU, ARPPU, conversion funnel, top items
 */

import { useEffect, useState } from 'react'
import { MetricCard, KPICard } from '../MetricCard'
import { LineChart, FunnelChart } from '../MiniChart'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import { useAnalyticsAPI } from '../useAnalyticsAPI'
import type { DateRange } from '../types'

interface RevenueData {
  total_revenue: number
  total_transactions: number
  unique_buyers: number
  total_users: number
  arpu: number
  arppu: number
  conversion_rate: number
  funnel: {
    shop_views: number
    item_views: number
    previews: number
    purchase_starts: number
    purchase_completes: number
  }
  top_items: Array<{
    item_id: string
    count: number
    revenue: number
    type?: string
    rarity?: string
  }>
  daily: Array<{
    date: string
    revenue: number
    transactions: number
  }>
}

interface Props {
  dateRange: DateRange
}

export function RevenuePanel({ dateRange }: Props) {
  const api = useAnalyticsAPI()
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await api.getRevenue(dateRange)
      setData(result as RevenueData)
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
    return <div className="text-neutral-500 text-center py-12">Failed to load revenue data</div>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Revenue chart data
  const revenueChartData = data.daily.map(d => ({
    label: d.date.slice(5), // MM-DD
    value: d.revenue,
  }))

  // Funnel data
  const funnelSteps = [
    { label: 'Shop Views', count: data.funnel.shop_views, rate: 100 },
    { label: 'Item Views', count: data.funnel.item_views, rate: data.funnel.shop_views > 0 ? (data.funnel.item_views / data.funnel.shop_views) * 100 : 0 },
    { label: 'Previews', count: data.funnel.previews, rate: data.funnel.shop_views > 0 ? (data.funnel.previews / data.funnel.shop_views) * 100 : 0 },
    { label: 'Started Purchase', count: data.funnel.purchase_starts, rate: data.funnel.shop_views > 0 ? (data.funnel.purchase_starts / data.funnel.shop_views) * 100 : 0 },
    { label: 'Completed', count: data.funnel.purchase_completes, rate: data.funnel.shop_views > 0 ? (data.funnel.purchase_completes / data.funnel.shop_views) * 100 : 0 },
  ]

  // Top items columns
  const itemColumns: Column<RevenueData['top_items'][0]>[] = [
    { 
      key: 'item_id', 
      label: 'Item', 
      render: (r) => (
        <div>
          <span className="font-medium text-white">{r.item_id}</span>
          {r.rarity && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
              r.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
              r.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
              r.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
              'bg-neutral-500/20 text-neutral-400'
            }`}>
              {r.rarity}
            </span>
          )}
        </div>
      )
    },
    { key: 'type', label: 'Type', render: (r) => <span className="text-neutral-400">{r.type || '—'}</span> },
    { key: 'count', label: 'Sold', sortable: true, align: 'right', render: (r) => <span className="text-white">{r.count}</span> },
    { 
      key: 'revenue', 
      label: 'Revenue', 
      sortable: true, 
      align: 'right', 
      render: (r) => <span className="text-green-400 font-medium">{formatCurrency(r.revenue)}</span> 
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(data.total_revenue)}
          subtitle={`${data.total_transactions} transactions`}
          icon="💰"
          color="green"
        />
        <KPICard
          title="ARPU"
          value={formatCurrency(data.arpu)}
          subtitle="Avg Revenue Per User"
          icon="👤"
          color="blue"
        />
        <KPICard
          title="ARPPU"
          value={formatCurrency(data.arppu)}
          subtitle="Avg Revenue Per Paying User"
          icon="💎"
          color="purple"
        />
        <KPICard
          title="Conversion Rate"
          value={`${data.conversion_rate}%`}
          subtitle={`${data.unique_buyers} of ${data.total_users} users`}
          icon="🎯"
          color={data.conversion_rate > 5 ? 'green' : data.conversion_rate > 2 ? 'orange' : 'red'}
        />
      </div>

      {/* Revenue Chart & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Revenue Over Time</h3>
          {revenueChartData.length > 0 ? (
            <LineChart data={revenueChartData} height={180} color="#22c55e" showLabels showGrid />
          ) : (
            <div className="text-neutral-500 text-sm text-center py-8">No revenue data for this period</div>
          )}
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-4">Purchase Funnel</h3>
          {data.funnel.shop_views > 0 ? (
            <FunnelChart steps={funnelSteps} />
          ) : (
            <div className="text-neutral-500 text-sm text-center py-8">No funnel data</div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Unique Buyers"
          value={data.unique_buyers}
          icon={<span className="text-lg">🛒</span>}
        />
        <MetricCard
          label="Total Users"
          value={data.total_users}
          icon={<span className="text-lg">👥</span>}
        />
        <MetricCard
          label="Avg Order Value"
          value={data.total_transactions > 0 ? formatCurrency(data.total_revenue / data.total_transactions) : '$0'}
          icon={<span className="text-lg">📦</span>}
        />
        <MetricCard
          label="Transactions"
          value={data.total_transactions}
          icon={<span className="text-lg">💳</span>}
        />
      </div>

      {/* Top Items */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Top Selling Items</h3>
        {data.top_items.length > 0 ? (
          <DataTable
            columns={itemColumns}
            data={data.top_items}
            keyField="item_id"
            maxHeight="300px"
            emptyMessage="No items sold"
          />
        ) : (
          <div className="text-neutral-500 text-sm text-center py-8">No sales data</div>
        )}
      </div>

      {/* Revenue Insights */}
      {data.total_revenue > 0 && (
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20 p-6">
          <h3 className="text-lg font-medium text-white mb-4">💡 Revenue Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-neutral-400 mb-1">Buyer Conversion</div>
              <div className="text-white">
                {data.conversion_rate > 5 
                  ? '✅ Excellent conversion rate! Your monetization is performing well.'
                  : data.conversion_rate > 2
                  ? '⚠️ Average conversion. Consider A/B testing pricing or offers.'
                  : '❌ Low conversion. Review your pricing strategy and user journey.'}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-neutral-400 mb-1">Revenue per User</div>
              <div className="text-white">
                {data.arpu > 5
                  ? '✅ Strong ARPU indicates good monetization depth.'
                  : data.arpu > 1
                  ? '⚠️ Moderate ARPU. Consider upselling or premium features.'
                  : '❌ Low ARPU. Focus on increasing engagement before monetization.'}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-neutral-400 mb-1">Funnel Health</div>
              <div className="text-white">
                {data.funnel.purchase_completes / Math.max(data.funnel.purchase_starts, 1) > 0.7
                  ? '✅ High checkout completion rate.'
                  : data.funnel.purchase_completes / Math.max(data.funnel.purchase_starts, 1) > 0.4
                  ? '⚠️ Some cart abandonment. Review checkout flow.'
                  : '❌ High abandonment. Simplify checkout or add trust signals.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
