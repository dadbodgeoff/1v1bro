/**
 * MetricCard - Reusable metric display component
 */

import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: number | string | null | undefined
  unit?: string
  change?: number // percentage change
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function MetricCard({ 
  label, 
  value, 
  unit = '', 
  change,
  icon,
  size = 'md',
  variant = 'default',
}: MetricCardProps) {
  const formatValue = (v: number | string | null | undefined) => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'string') return v
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
    return v.toLocaleString()
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
      {change !== undefined && (
        <div className={`text-xs mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
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
