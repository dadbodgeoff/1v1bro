/**
 * ShopSection - Enterprise Section Container
 * 
 * Features:
 * - Section header with title and optional timer
 * - View All link for expanded sections
 * - Configurable grid layouts
 * - Animated entrance effects
 * - Enterprise typography hierarchy (H2 level)
 */

import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'
import { useCountdown } from '@/hooks/useCountdown'

interface ShopSectionProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  endTime?: Date | null
  viewAllHref?: string
  onViewAll?: () => void
  badge?: string
  badgeVariant?: 'default' | 'hot' | 'new' | 'limited'
  children: ReactNode
  className?: string
}

const badgeStyles = {
  default: 'bg-[#6366f1] text-white',
  hot: 'bg-[#f97316] text-white shadow-lg shadow-orange-500/20',
  new: 'bg-[#10b981] text-white',
  limited: 'bg-[#f43f5e] text-white animate-pulse',
}

export function ShopSection({
  title,
  subtitle,
  icon,
  endTime,
  viewAllHref,
  onViewAll,
  badge,
  badgeVariant = 'default',
  children,
  className,
}: ShopSectionProps) {
  const countdown = useCountdown(endTime ?? null)

  return (
    <section className={cn('mb-12', className)}>
      {/* Section Header - H2 level in hierarchy */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Icon - larger, more prominent */}
          {icon && (
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#6366f1] border border-white/5">
              {icon}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-3">
              {/* Section Title - H2, second in hierarchy after page title */}
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
              
              {/* Badge - more prominent */}
              {badge && (
                <span className={cn(
                  'px-2.5 py-1 text-xs font-bold uppercase tracking-wide rounded-full',
                  badgeStyles[badgeVariant]
                )}>
                  {badge}
                </span>
              )}
            </div>
            
            {/* Subtitle - tertiary text */}
            {subtitle && (
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5 font-medium">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Side: Timer or View All */}
        <div className="flex items-center gap-4">
          {/* Countdown Timer - more prominent */}
          {countdown && (
            <div className="flex items-center gap-2.5 px-4 py-2 bg-[var(--color-bg-elevated)] rounded-xl border border-white/5">
              <ClockIcon className="w-5 h-5 text-[#f43f5e]" />
              <span className="text-sm font-semibold text-white tabular-nums">
                {countdown.days > 0 && `${countdown.days}d `}
                {countdown.hours}h {countdown.minutes}m
              </span>
            </div>
          )}
          
          {/* View All Link */}
          {(viewAllHref || onViewAll) && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#6366f1] hover:text-[#818cf8] transition-colors group"
            >
              View All
              <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Section Content */}
      <div className="relative">
        {children}
      </div>
    </section>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
