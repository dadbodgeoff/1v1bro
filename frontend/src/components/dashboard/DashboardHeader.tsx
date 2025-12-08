/**
 * DashboardHeader - Header showing user profile summary with avatar, rank, and level.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.4
 * 
 * 2025 Redesign Updates:
 * - Avatar: 32px, rounded-full
 * - Coin balance with coin icon
 * - Notification bell with unread count
 * - No cyan/purple legacy colors (uses indigo/amber)
 */

import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useProfile } from '@/hooks/useProfile'
import { useBalance } from '@/hooks/useBalance'
import { useBattlePass } from '@/hooks/useBattlePass'
import { useEffect, useState, useCallback } from 'react'
import { getRankTier, RANK_TIERS, type RankTier } from '@/types/leaderboard'
import { leaderboardAPI } from '@/services/api'

// Coin icon component
function CoinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle cx="12" cy="12" r="7" fill="#0a0a0a" fillOpacity="0.3" />
      <text x="12" y="16" textAnchor="middle" fill="#0a0a0a" fontSize="10" fontWeight="bold">$</text>
    </svg>
  )
}

// Bell icon component
function BellIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

// Settings icon component
function SettingsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

interface DashboardHeaderProps {
  onMenuToggle: () => void
}

// Level calculation based on XP thresholds
// Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, etc.
// Formula: level = floor(sqrt(total_xp / 100)) + 1, minimum 1
export function calculateLevel(totalXp: number): number {
  if (totalXp < 0) return 1
  return Math.floor(Math.sqrt(totalXp / 100)) + 1
}

// XP progress to next level
// Level N requires (N-1)^2 * 100 XP to reach
// Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, etc.
export function calculateXpProgress(totalXp: number): { current: number; required: number; percent: number } {
  const level = calculateLevel(totalXp)
  // XP threshold for current level: (level-1)^2 * 100
  const xpForCurrentLevel = (level - 1) * (level - 1) * 100
  // XP threshold for next level: level^2 * 100
  const xpForNextLevel = level * level * 100
  const required = xpForNextLevel - xpForCurrentLevel
  const current = Math.max(0, totalXp - xpForCurrentLevel)
  const percent = required > 0 ? Math.min(100, Math.max(0, Math.round((current / required) * 100))) : 0
  return { current, required, percent }
}

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { profile, fetchProfile } = useProfile()
  const { progress, fetchProgress } = useBattlePass()
  const [eloRating, setEloRating] = useState<number | null>(null)
  const [rankTier, setRankTier] = useState<RankTier>('bronze')
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const fetchEloRating = useCallback(async () => {
    try {
      // Use the ELO-specific endpoint (different path structure than general categories)
      const response = await leaderboardAPI.getMyELORank()
      if (response.rating?.current_elo) {
        setEloRating(response.rating.current_elo)
        setRankTier(getRankTier(response.rating.current_elo))
      }
    } catch {
      // User has no ELO rating yet - use default bronze
      setEloRating(null)
      setRankTier('bronze')
    }
  }, [])

  useEffect(() => {
    fetchProfile()
    fetchProgress()
    fetchEloRating()
    // TODO: Fetch actual notification count from API
    setUnreadNotifications(0)
  }, [fetchProfile, fetchProgress, fetchEloRating])

  const displayName = profile?.display_name || user?.display_name || user?.email || 'Player'
  const avatarUrl = profile?.avatar_url
  
  // UNIFIED PROGRESSION: Use Battle Pass tier as player level
  // Battle Pass tier IS player level (Requirements: 6.1, 6.3)
  // Treat tier 0 as tier 1 for display (legacy users before unified progression)
  const { coins: coinBalance } = useBalance()
  const rawTier = progress?.current_tier ?? 1
  const tier = rawTier === 0 ? 1 : rawTier  // Treat tier 0 as tier 1 for display
  const currentXp = progress?.current_xp ?? 0
  const xpToNextTier = progress?.xp_to_next_tier ?? 1000
  const xpPercent = xpToNextTier > 0 ? Math.min(100, Math.round((currentXp / xpToNextTier) * 100)) : 0

  const tierInfo = RANK_TIERS[rankTier]
  const tierLabel = rankTier.charAt(0).toUpperCase() + rankTier.slice(1)

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  // Format coin balance with commas
  const formattedCoins = coinBalance.toLocaleString()

  return (
    <header className="h-16 bg-[var(--color-bg-card)] border-b border-[var(--color-border-subtle)] flex items-center px-4 gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-[var(--color-text-secondary)] hover:text-white transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Coin Balance */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
        <CoinIcon className="w-4 h-4 text-[var(--color-accent-premium)]" />
        <span className="text-sm font-medium text-white">{formattedCoins}</span>
      </div>

      {/* Notification Bell */}
      <button
        className="relative p-2 text-[var(--color-text-secondary)] hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
        aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
      >
        <BellIcon className="w-5 h-5" />
        {unreadNotifications > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--color-accent-error)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>

      {/* Settings */}
      <button
        onClick={handleSettingsClick}
        className="p-2 text-[var(--color-text-secondary)] hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
        aria-label="Settings"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>

      {/* Profile Summary - clickable */}
      <button
        onClick={handleProfileClick}
        className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
      >
        {/* Avatar - 32px (w-8 h-8), rounded-full */}
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border-2 border-[var(--color-border-visible)]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--color-accent-success)] border-2 border-[var(--color-bg-card)] rounded-full" />
        </div>

        {/* Name and Rank */}
        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">{displayName}</p>
            {/* Rank badge */}
            <span
              className="text-xs"
              title={`${tierLabel} Tier${eloRating ? ` (${eloRating} ELO)` : ''}`}
            >
              {tierInfo.icon}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)]">Tier {tier}</span>
            {/* XP Progress bar - using indigo gradient instead of purple/blue */}
            <div className="w-16 h-1.5 bg-white/[0.1] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </button>

      {/* Sign out */}
      <button
        onClick={logout}
        className="text-xs text-[var(--color-text-muted)] hover:text-white transition-colors px-2 py-1"
      >
        Sign out
      </button>
    </header>
  )
}
