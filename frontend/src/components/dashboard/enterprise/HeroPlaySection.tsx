/**
 * HeroPlaySection - Enterprise Hero Play Action Component (Mobile App)
 * Simplified for survival and 3D arena modes only
 */

import { useNavigate } from 'react-router-dom'
import { DashboardSection } from './DashboardSection'

export interface HeroPlaySectionProps {
  className?: string
}

export function HeroPlaySection({ className }: HeroPlaySectionProps) {
  const navigate = useNavigate()

  return (
    <DashboardSection className={className}>
      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-5">
        Quick Play
      </h2>

      <div className="space-y-4">
        {/* Primary Play Survival Button */}
        <button
          onClick={() => navigate('/survival')}
          className="w-full h-14 bg-[var(--color-brand)] text-white font-semibold rounded-xl hover:bg-[var(--color-brand-light)] transition-all min-h-[44px] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
        >
          <span className="flex items-center justify-center gap-2">
            <PlayIcon className="w-5 h-5" />
            Play Survival
          </span>
        </button>

        {/* Secondary Actions Row */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/arena')}
            className="py-3 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-xl hover:bg-white/[0.1] hover:text-white transition-all min-h-[44px]"
          >
            <span className="flex items-center justify-center gap-1.5">
              <ArenaIcon className="w-4 h-4" />
              3D Arena
            </span>
          </button>
          <button
            onClick={() => navigate('/survival/leaderboard')}
            className="py-3 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-xl hover:bg-white/[0.1] hover:text-white transition-all min-h-[44px]"
          >
            <span className="flex items-center justify-center gap-1.5">
              <LeaderboardIcon className="w-4 h-4" />
              Leaderboard
            </span>
          </button>
        </div>
      </div>
    </DashboardSection>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ArenaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function LeaderboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
