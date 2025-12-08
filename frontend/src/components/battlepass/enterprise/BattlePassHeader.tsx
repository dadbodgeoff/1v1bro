/**
 * BattlePassHeader - Enterprise Battle Pass Header Component
 * 
 * Features:
 * - Season name with gradient text (H1 level, 4xl-5xl extrabold)
 * - Theme subtitle with uppercase tracking-wider
 * - Integrated XP quick display with tier badge
 * - Season countdown timer
 * - Gradient accent bar (1.5px)
 * - Optional banner image background with gradient overlay
 * - Seasonal theme colors (default, winter, summer, halloween, neon)
 * 
 * Requirements: 2.1, 4.4
 */

import { cn } from '@/utils/helpers'
import { useCountdown } from '@/hooks/useCountdown'

type ThemeColor = 'default' | 'winter' | 'summer' | 'halloween' | 'neon'

interface BattlePassHeaderProps {
  seasonName: string
  seasonTheme?: string
  seasonThemeColor?: ThemeColor
  currentTier: number
  currentXP: number
  xpToNextTier: number
  seasonEndDate: Date | null
  bannerUrl?: string
  className?: string
}

const themeStyles: Record<ThemeColor, { gradient: string; barGradient: string; accent: string }> = {
  default: {
    // Clean white to silver - premium look
    gradient: 'from-white via-[#e2e8f0] to-[#94a3b8]',
    barGradient: 'from-[#f59e0b] via-[#d97706] to-[#b45309]',
    accent: '#f59e0b',
  },
  winter: {
    // Ice blue tones
    gradient: 'from-white via-[#e0f2fe] to-[#bae6fd]',
    barGradient: 'from-[#38bdf8] via-[#0ea5e9] to-[#0284c7]',
    accent: '#0ea5e9',
  },
  summer: {
    // Warm gold tones
    gradient: 'from-white via-[#fef3c7] to-[#fcd34d]',
    barGradient: 'from-[#f59e0b] via-[#d97706] to-[#b45309]',
    accent: '#f59e0b',
  },
  halloween: {
    // Orange tones
    gradient: 'from-white via-[#fed7aa] to-[#fdba74]',
    barGradient: 'from-[#f97316] via-[#ea580c] to-[#c2410c]',
    accent: '#f97316',
  },
  neon: {
    // Clean white with gold bar
    gradient: 'from-white via-[#f1f5f9] to-[#cbd5e1]',
    barGradient: 'from-[#f59e0b] via-[#d97706] to-[#b45309]',
    accent: '#f59e0b',
  },
}

export function BattlePassHeader({
  seasonName,
  seasonTheme,
  seasonThemeColor = 'default',
  currentTier,
  currentXP,
  xpToNextTier,
  seasonEndDate,
  bannerUrl,
  className,
}: BattlePassHeaderProps) {
  const countdown = useCountdown(seasonEndDate)
  const theme = themeStyles[seasonThemeColor]
  const isEndingSoon = countdown && countdown.days < 3 && !countdown.isExpired

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)]',
        className
      )}
    >
      {/* Background Image with Gradient Overlay */}
      {bannerUrl && (
        <div className="absolute inset-0">
          <img
            src={bannerUrl}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-card)] via-[var(--color-bg-card)]/80 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Season Info */}
          <div className="space-y-2">
            {/* Theme Subtitle - sm uppercase tracking-wider */}
            {seasonTheme && (
              <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                {seasonTheme}
              </p>
            )}
            
            {/* Season Name - H1 with gradient text */}
            <h1
              className={cn(
                'text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r',
                theme.gradient
              )}
            >
              {seasonName}
            </h1>
            
            {/* Gradient Accent Bar - gold, not AI rainbow */}
            <div
              className={cn(
                'h-1 w-32 bg-gradient-to-r rounded-full',
                theme.barGradient
              )}
            />
          </div>

          {/* Right Side: XP Display + Countdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* XP Quick Display */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)]">
              {/* Tier Badge */}
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ backgroundColor: `${theme.accent}20` }}
              >
                <span
                  className="text-lg font-extrabold"
                  style={{ color: theme.accent }}
                >
                  {currentTier}
                </span>
              </div>
              
              {/* XP Info */}
              <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                  Current Tier
                </span>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {currentXP.toLocaleString()} / {xpToNextTier.toLocaleString()} XP
                </span>
              </div>
            </div>

            {/* Countdown Timer */}
            {countdown && !countdown.isExpired && (
              <div className="flex items-center gap-3">
                {/* Ending Soon Warning */}
                {isEndingSoon && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f43f5e]/20 border border-[#f43f5e]/30 rounded-full animate-pulse">
                    <span className="w-2 h-2 bg-[#f43f5e] rounded-full" />
                    <span className="text-xs font-semibold text-[#f43f5e] uppercase tracking-wide">
                      Ending Soon
                    </span>
                  </div>
                )}

                {/* Time Units */}
                <div className="flex items-center gap-1.5">
                  {countdown.days > 0 && (
                    <TimeUnit value={countdown.days} label="D" />
                  )}
                  <TimeUnit value={countdown.hours} label="H" />
                  <TimeUnit value={countdown.minutes} label="M" />
                  {countdown.days === 0 && (
                    <TimeUnit value={countdown.seconds} label="S" />
                  )}
                </div>
              </div>
            )}

            {countdown?.isExpired && (
              <div className="px-4 py-2 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-subtle)]">
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Season Ended
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface TimeUnitProps {
  value: number
  label: string
}

function TimeUnit({ value, label }: TimeUnitProps) {
  return (
    <div className="flex items-center gap-0.5 px-2.5 py-1.5 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-subtle)]">
      <span className="text-base font-bold text-white tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-xs font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  )
}

/**
 * Calculate countdown values from end date.
 * Exported for property testing.
 */
export function calculateCountdown(endDate: Date | null): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
} | null {
  if (!endDate) return null
  
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return { days, hours, minutes, seconds, isExpired: false }
}

export default BattlePassHeader
