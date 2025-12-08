/**
 * StatsCard - Individual Statistic Display Component
 * 
 * Features:
 * - Prominent value display (2xl-3xl bold, tabular-nums)
 * - Muted uppercase label (xs-sm medium, tracking-wider)
 * - Optional trend indicator (↑/↓) with color coding
 * - Color code variants (default, success, warning, danger)
 * - Card background with subtle border
 * - Hover lift effect (translateY -2px, shadow enhancement)
 * - Optional icon display
 * 
 * Props:
 * - value: The statistic value to display
 * - label: The label describing the statistic
 * - trend: Optional trend data with direction and value
 * - colorCode: Color variant for the value
 * - icon: Optional icon element
 * - onClick: Optional click handler
 * - className: Additional CSS classes
 */

import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'

interface StatsCardProps {
  value: string | number
  label: string
  trend?: {
    value: number
    direction: 'up' | 'down'
    period?: string
  }
  colorCode?: 'default' | 'success' | 'warning' | 'danger'
  icon?: ReactNode
  onClick?: () => void
  className?: string
}

const colorCodeStyles = {
  default: 'text-white',
  success: 'text-[#10b981]',  // green
  warning: 'text-[#f59e0b]',  // amber
  danger: 'text-[#ef4444]',   // red
}

const trendStyles = {
  up: {
    color: 'text-[#10b981]',
    icon: '↑',
  },
  down: {
    color: 'text-[#ef4444]',
    icon: '↓',
  },
}

export function StatsCard({
  value,
  label,
  trend,
  colorCode = 'default',
  icon,
  onClick,
  className,
}: StatsCardProps) {
  const isClickable = !!onClick

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl',
        'bg-[var(--color-bg-card)] border border-white/5',
        'transition-all duration-200',
        isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-white/10',
        !isClickable && 'hover:border-white/10',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Icon */}
      {icon && (
        <div className="absolute top-3 right-3 text-lg opacity-50">
          {icon}
        </div>
      )}

      {/* Value */}
      <div className={cn(
        'text-2xl md:text-3xl font-bold tabular-nums',
        colorCodeStyles[colorCode]
      )}>
        {value}
      </div>

      {/* Label */}
      <div className="text-xs md:text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mt-1">
        {label}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div 
          className={cn(
            'flex items-center gap-1 mt-2 text-xs font-semibold',
            trendStyles[trend.direction].color
          )}
          title={trend.period}
        >
          <span>{trendStyles[trend.direction].icon}</span>
          <span>{Math.abs(trend.value)}%</span>
          {trend.period && (
            <span className="text-[var(--color-text-muted)] font-normal ml-1">
              {trend.period}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Calculate win rate percentage with color coding
 */
export function calculateWinRate(gamesPlayed: number, gamesWon: number): {
  value: string
  colorCode: 'default' | 'success' | 'warning' | 'danger'
} {
  if (gamesPlayed === 0) {
    return { value: 'N/A', colorCode: 'default' }
  }

  const rate = (gamesWon / gamesPlayed) * 100
  const value = `${rate.toFixed(1)}%`

  let colorCode: 'default' | 'success' | 'warning' | 'danger' = 'default'
  if (rate > 60) {
    colorCode = 'success'
  } else if (rate >= 40) {
    colorCode = 'warning'
  } else {
    colorCode = 'danger'
  }

  return { value, colorCode }
}

/**
 * Format large numbers with compact notation
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}
