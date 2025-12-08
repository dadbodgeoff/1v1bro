/**
 * SeasonHeader Component - 2025 Design System
 * Requirements: 4.7
 *
 * Season info with:
 * - Season name and theme display
 * - Banner/artwork image
 * - Days remaining countdown
 * - "Ending Soon" warning if < 3 days
 */

import { cn } from '@/utils/helpers'
import { useCountdown } from '@/hooks/useCountdown'

interface Season {
  id: string
  name: string
  theme?: string
  banner_url?: string
  start_date: string
  end_date: string
}

interface SeasonHeaderProps {
  season: Season
  className?: string
}

export function SeasonHeader({ season, className }: SeasonHeaderProps) {
  const countdown = useCountdown(new Date(season.end_date))
  const isEndingSoon = countdown && countdown.days < 3 && !countdown.isExpired

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)]',
        className
      )}
    >
      {/* Background Image */}
      {season.banner_url && (
        <div className="absolute inset-0">
          <img
            src={season.banner_url}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-card)] via-[var(--color-bg-card)]/80 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Season Info */}
          <div>
            {season.theme && (
              <p className="text-sm font-medium text-[var(--color-accent-primary)] mb-1">
                {season.theme}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {season.name}
            </h1>
          </div>

          {/* Countdown */}
          {countdown && !countdown.isExpired && (
            <div className="flex items-center gap-4">
              {isEndingSoon && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f43f5e]/20 border border-[#f43f5e]/30 rounded-full">
                  <span className="w-2 h-2 bg-[#f43f5e] rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-[#f43f5e]">Ending Soon</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {countdown.days > 0 && (
                  <TimeUnit value={countdown.days} label="Days" />
                )}
                <TimeUnit value={countdown.hours} label="Hours" />
                <TimeUnit value={countdown.minutes} label="Min" />
                {countdown.days === 0 && (
                  <TimeUnit value={countdown.seconds} label="Sec" />
                )}
              </div>
            </div>
          )}

          {countdown?.isExpired && (
            <div className="px-4 py-2 bg-[var(--color-bg-elevated)] rounded-lg">
              <span className="text-[var(--color-text-muted)]">Season Ended</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 md:w-14 md:h-14 bg-[var(--color-bg-elevated)] rounded-lg flex items-center justify-center border border-[var(--color-border-subtle)]">
        <span className="text-lg md:text-xl font-bold text-white">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-[var(--color-text-muted)] mt-1">{label}</span>
    </div>
  )
}
