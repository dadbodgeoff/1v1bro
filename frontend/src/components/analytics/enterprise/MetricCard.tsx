/**
 * MetricCard - Reusable metric display component
 * 
 * Requirements: 10.4 - Display value, label, trend indicator, and comparison to previous period
 * Enhanced with sparklines, better visual hierarchy, and status indicators
 */

import type { ReactNode } from 'react'

export type MetricFormat = 'number' | 'percent' | 'duration' | 'currency'

export interface MetricCardProps {
  label: string
  value: number | string | null | undefined
  previousValue?: number
  unit?: string
  change?: number
  format?: MetricFormat
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  loading?: boolean
  sparkline?: number[]
  description?: string
  target?: number
}

/**
 * Calculates the percentage change between current and previous values
 */
export function calculateTrendPercentage(
  currentValue: number | string | null | undefined,
  previousValue: number | undefined
): number | null {
  if (previousValue === undefined || previousValue === null) return null
  if (currentValue === null || currentValue === undefined) return null
  if (typeof currentValue === 'string') return null
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0
  }
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100
}

/**
 * Determines trend direction based on percentage change
 */
export function getTrendDirection(change: number | null): 'up' | 'down' | 'neutral' {
  if (change === null || Math.abs(change) < 0.1) return 'neutral'
  return change > 0 ? 'up' : 'down'
}

// Mini sparkline for metric cards
function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const width = 40
  const height = 16
  
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }))
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const trend = data[data.length - 1] > data[0] ? '#22c55e' : data[data.length - 1] < data[0] ? '#ef4444' : '#f97316'
  
  return (
    <svg width={width} height={height} className="opacity-60">
      <path d={pathD} fill="none" stroke={trend} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function MetricCard({ 
  label, 
  value, 
  previousValue,
  unit = '', 
  change,
  format = 'number',
  trend,
  trendLabel,
  icon,
  size = 'md',
  variant = 'default',
  loading = false,
  sparkline,
  description,
  target,
}: MetricCardProps) {
  const calculatedChange = change ?? calculateTrendPercentage(value, previousValue)
  const trendDirection = trend ?? getTrendDirection(calculatedChange)

  const formatValue = (v: number | string | null | undefined) => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'string') return v
    
    switch (format) {
      case 'percent':
        return `${v.toFixed(1)}%`
      case 'duration':
        if (v < 60) return `${Math.round(v)}s`
        if (v < 3600) return `${Math.floor(v / 60)}m ${Math.round(v % 60)}s`
        return `${Math.floor(v / 3600)}h ${Math.floor((v % 3600) / 60)}m`
      case 'currency':
        return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      default:
        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
        if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
        return v.toLocaleString()
    }
  }

  const sizeClasses = { sm: 'p-3', md: 'p-4', lg: 'p-5' }
  const valueSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
  const variantColors = { default: 'text-white', success: 'text-green-400', warning: 'text-yellow-400', danger: 'text-red-400' }
  const variantBorders = { default: 'border-white/10', success: 'border-green-500/20', warning: 'border-yellow-500/20', danger: 'border-red-500/20' }
  const variantBg = {
    default: 'bg-white/5',
    success: 'bg-gradient-to-br from-green-500/10 to-green-500/5',
    warning: 'bg-gradient-to-br from-yellow-500/10 to-yellow-500/5',
    danger: 'bg-gradient-to-br from-red-500/10 to-red-500/5',
  }
  const trendColors = { up: 'text-green-400 bg-green-500/10', down: 'text-red-400 bg-red-500/10', neutral: 'text-neutral-500 bg-white/5' }
  const trendIcons = { up: '↑', down: '↓', neutral: '→' }

  if (loading) {
    return (
      <div className={`bg-white/5 rounded-xl border border-white/10 ${sizeClasses[size]} animate-pulse`}>
        <div className="h-3 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-8 bg-white/10 rounded w-3/4" />
      </div>
    )
  }

  const numericValue = typeof value === 'number' ? value : 0
  const targetProgress = target && target > 0 ? Math.min(100, (numericValue / target) * 100) : null

  return (
    <div className={`${variantBg[variant]} rounded-xl border ${variantBorders[variant]} ${sizeClasses[size]} transition-all hover:border-white/20`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-400 uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          {sparkline && sparkline.length > 1 && <MiniSparkline data={sparkline} />}
          {icon && <span className="text-neutral-500">{icon}</span>}
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={`font-bold ${valueSizes[size]} ${variantColors[variant]}`}>{formatValue(value)}</span>
        {unit && <span className="text-sm text-neutral-500">{unit}</span>}
      </div>
      
      {targetProgress !== null && (
        <div className="mt-2">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${targetProgress >= 100 ? 'bg-green-500' : targetProgress >= 75 ? 'bg-yellow-500' : 'bg-orange-500'}`}
              style={{ width: `${targetProgress}%` }}
            />
          </div>
          <div className="text-xs text-neutral-500 mt-1">{targetProgress.toFixed(0)}% of {formatValue(target)} target</div>
        </div>
      )}
      
      {calculatedChange !== null && (
        <div className={`text-xs mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${trendColors[trendDirection]}`}>
          <span>{trendIcons[trendDirection]}</span>
          <span>{Math.abs(calculatedChange).toFixed(1)}%</span>
          {trendLabel && <span className="text-neutral-500 ml-1">{trendLabel}</span>}
        </div>
      )}
      
      {description && <div className="text-xs text-neutral-500 mt-2">{description}</div>}
    </div>
  )
}


// Web Vital specific card with grade
interface WebVitalCardProps {
  name: string
  label: string
  value: number | null
  unit: string
  grade: string
  thresholds: { good: number; poor: number }
}

export function WebVitalCard({ name, label, value, unit, grade, thresholds }: WebVitalCardProps) {
  const gradeColor = {
    Good: 'bg-green-500/20 text-green-400 border-green-500/30',
    'Needs Improvement': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Poor: 'bg-red-500/20 text-red-400 border-red-500/30',
    'N/A': 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  }[grade] || 'bg-neutral-500/20 text-neutral-400'

  const barWidth = value !== null ? Math.min(100, (value / thresholds.poor) * 100) : 0
  const barColor = value !== null
    ? value <= thresholds.good ? 'bg-green-500' : value <= thresholds.poor ? 'bg-yellow-500' : 'bg-red-500'
    : 'bg-neutral-600'

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-lg font-bold text-white">{name}</span>
          <p className="text-xs text-neutral-500">{label}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium border ${gradeColor}`}>{grade}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-2">{value !== null ? `${value}${unit}` : '—'}</div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${barWidth}%` }} />
      </div>
      <div className="flex justify-between text-xs text-neutral-500 mt-1">
        <span>0</span>
        <span className="text-green-400">{thresholds.good}{unit}</span>
        <span className="text-red-400">{thresholds.poor}{unit}</span>
      </div>
    </div>
  )
}

// KPI Card - larger format for key metrics
interface KPICardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: { value: number; label: string }
  icon?: ReactNode
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'red'
}

export function KPICard({ title, value, subtitle, trend, icon, color = 'orange' }: KPICardProps) {
  const colorClasses = {
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
  }

  const textColors = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border p-6`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-neutral-400 uppercase tracking-wide">{title}</span>
        {icon && <span className={`text-2xl ${textColors[color]}`}>{icon}</span>}
      </div>
      <div className={`text-4xl font-bold ${textColors[color]} mb-2`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && <div className="text-sm text-neutral-500">{subtitle}</div>}
      {trend && (
        <div className={`text-sm mt-3 ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
        </div>
      )}
    </div>
  )
}

// Stat Row - compact horizontal stat display
interface StatRowProps {
  stats: Array<{ label: string; value: string | number; color?: string }>
}

export function StatRow({ stats }: StatRowProps) {
  return (
    <div className="flex items-center divide-x divide-white/10">
      {stats.map((stat, i) => (
        <div key={i} className="flex-1 px-4 py-2 text-center first:pl-0 last:pr-0">
          <div className={`text-lg font-bold ${stat.color || 'text-white'}`}>
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </div>
          <div className="text-xs text-neutral-500">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
