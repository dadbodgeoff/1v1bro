/**
 * QuickActionsWidget - Primary gameplay actions section (Mobile App)
 * Simplified for survival mode only
 */

import { useNavigate } from 'react-router-dom'

interface QuickActionsWidgetProps {
  className?: string
}

export function QuickActionsWidget({ className = '' }: QuickActionsWidgetProps) {
  const navigate = useNavigate()

  return (
    <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">Quick Play</h3>

      <div className="space-y-3">
        {/* Play Survival - Primary Action */}
        <button
          onClick={() => navigate('/survival')}
          className="w-full py-3.5 bg-[var(--color-accent-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-accent-primary-hover)] transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Play Survival
          </span>
        </button>

        {/* 3D Arena */}
        <button
          onClick={() => navigate('/arena')}
          className="w-full py-2.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            3D Arena
          </span>
        </button>

        {/* Leaderboard */}
        <button
          onClick={() => navigate('/survival/leaderboard')}
          className="w-full py-2.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Leaderboard
          </span>
        </button>
      </div>
    </div>
  )
}
