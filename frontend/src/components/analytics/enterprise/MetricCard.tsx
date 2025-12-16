/**
 * MetricCard - Reusable metric display component
 * 
 * Requirements: 10.4 - Display value, label, trend indicator, and comparison to previous period
 */

import type { ReactNode } from 'react'

export type MetricFormat = 'number' | 'percent' | 'duration' | 'currency'

export interface MetricCardProps {
  label: string
  value: number | string | null | undefined
  previousValue?: number // For trend calculation
  unit?: string
  change?: number // percentage change (overrides calculated trend)
  format?: MetricFormat
  trend?: 'up' | 'down' | 'neutral' // Override calculated trend direction
  trendLabel?: string // Custom label for trend (e.g., "vs last week")
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  loading?: boolean
}

/**
 * Calculates the percentage change between current and previous values
 * Returns null if calculation is not possible
 */
export function calculateTrendPercentage(
  currentValue: number | string | null | undefined,
  previousValue: number | undefined
): number | null {
  if (previousValue === undefined || previousValue === null) return null
  if (currentValue === null || currentValue === undefined) return null
  if (typeof currentValue === 'string') return null
  if (previousValue === 0) {
    // If previous was 0 and current is positive, it's infinite growth
    // Return 100% as a reasonable cap
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
}: MetricCardProps) {
  // Calculate trend from previousValue if change not provided
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

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const valueSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  const variantColors = {
    default: 'text-white',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  }

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-neutral-500',
  }

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  }

  if (loading) {
    return (
      <div className={`bg-white/5 rounded-xl border border-white/10 ${sizeClasses[size]} animate-pulse`}>
        <div className="h-3 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-8 bg-white/10 rounded w-3/4" />
      </div>
    )
  }

  return (
    <div className={`bg-white/5 rounded-xl border border-white/10 ${sizeClasses[size]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-400 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-neutral-500">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-bold ${valueSizes[size]} ${variantColors[variant]}`}>
          {formatValue(value)}
        </span>
        {unit && <span className="text-sm text-neutral-500">{unit}</span>}
      </div>
      {calculatedChange !== null && (
        <div className={`text-xs mt-1 flex items-center gap-1 ${trendColors[trendDirection]}`}>
          <span>{trendIcons[trendDirection]}</span>
          <span>{Math.abs(calculatedChange).toFixed(1)}%</span>
          {trendLabel && <span className="text-neutral-500">{trendLabel}</span>}
        </div>
      )}
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

  const barWidth = value !== null 
    ? Math.min(100, (value / thresholds.poor) * 100) 
    : 0

  const barColor = value !== null
    ? value <= thresholds.good ? 'bg-green-500' 
      : value <= thresholds.poor ? 'bg-yellow-500' 
      : 'bg-red-500'
    : 'bg-neutral-600'

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-lg font-bold text-white">{name}</span>
          <p className="text-xs text-neutral-500">{label}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium border ${gradeColor}`}>
          {grade}
        </span>
      </div>
      <div className="text-2xl font-bold text-white mb-2">
        {value !== null ? `${value}${unit}` : '—'}
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${barWidth}%` }} />
      </div>
      <div className="flex justify-between text-xs text-neutral-500 mt-1">
        <span>0</span>
        <span className="text-green-400">{thresholds.good}{unit}</span>
        <span className="text-red-400">{thresholds.poor}{unit}</span>
      </div>
    </div>
  )
}
