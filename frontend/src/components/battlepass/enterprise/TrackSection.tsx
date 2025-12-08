/**
 * TrackSection - Enterprise Section Container
 * 
 * Features:
 * - Section header with icon container (12x12 / 48px)
 * - H2 title (2xl-3xl bold) and subtitle (sm muted)
 * - Badge variants (default, hot, new, limited, premium)
 * - Optional countdown timer
 * - Consistent padding (24px) and margin (48px bottom)
 * - Optional View All link
 * 
 * Requirements: 2.2, 6.1, 6.3
 */

import { cn } from '@/utils/helpers'
import { useCountdown } from '@/hooks/useCountdown'

export type BadgeVariant = 'default' | 'hot' | 'new' | 'limited' | 'premium'

interface TrackSectionProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: string
  badgeVariant?: BadgeVariant
  endTime?: Date | null
  viewAllHref?: string
  onViewAll?: () => void
  children: React.ReactNode
  className?: string
}

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#6366f1] text-white',
  hot: 'bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white shadow-lg shadow-orange-500/20',
  new: 'bg-[#10b981] text-white',
  limited: 'bg-[#f43f5e] text-white animate-pulse',
  premium: 'bg-[#f59e0b] text-black',
}

export function TrackSection({
  title,
  subtitle,
  icon,
  badge,
  badgeVariant = 'default',
  endTime,
  viewAllHref,
  onViewAll,
  children,
  className,
}: TrackSectionProps) {
  const countdown = useCountdown(endTime ?? null)
  const showCountdown = countdown && !countdown.isExpired && endTime

  return (
    <section className={cn('mb-12', className)}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Icon Container - 48px (12x12) with gradient background */}
          {icon && (
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]',
                'shadow-lg shadow-[#6366f1]/20'
              )}
            >
              {icon}
            </div>
          )}

          {/* Title and Subtitle */}
          <div>
            <div className="flex items-center gap-3">
              {/* H2 Title - 2xl-3xl bold with tight tracking */}
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {title}
              </h2>

              {/* Badge */}
              {badge && (
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
                    badgeStyles[badgeVariant]
                  )}
                >
                  {badge}
                </span>
              )}
            </div>

            {/* Subtitle - sm muted */}
            {subtitle && (
              <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Countdown or View All */}
        <div className="flex items-center gap-4">
          {/* Countdown Timer */}
          {showCountdown && (
            <div className="flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium text-[var(--color-text-secondary)] tabular-nums">
                {formatCountdown(countdown)}
              </span>
            </div>
          )}

          {/* View All Link */}
          {(viewAllHref || onViewAll) && (
            <button
              onClick={onViewAll}
              className={cn(
                'text-sm font-semibold text-[var(--color-accent-primary)]',
                'hover:text-[var(--color-accent-hover)] transition-colors',
                'flex items-center gap-1'
              )}
            >
              View All
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area - consistent padding */}
      <div className="p-0">{children}</div>
    </section>
  )
}

// Helper function
function formatCountdown(countdown: {
  days: number
  hours: number
  minutes: number
  seconds: number
}): string {
  if (countdown.days > 0) {
    return `${countdown.days}d ${countdown.hours}h remaining`
  }
  if (countdown.hours > 0) {
    return `${countdown.hours}h ${countdown.minutes}m remaining`
  }
  return `${countdown.minutes}m ${countdown.seconds}s remaining`
}

// Icons
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

/**
 * Get badge style for a given variant.
 * Exported for property testing.
 */
export function getBadgeStyle(variant: BadgeVariant): string {
  return badgeStyles[variant]
}

export default TrackSection
