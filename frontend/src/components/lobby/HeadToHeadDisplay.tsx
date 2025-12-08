/**
 * HeadToHeadDisplay - Fighting-game style head-to-head player card layout
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import type { Player } from '@/types/api'
import type { Cosmetic } from '@/types/cosmetic'
import { PlayerCardBanner } from './PlayerCardBanner'

interface HeadToHeadDisplayProps {
  /** Current user's player data */
  currentPlayer: Player | null
  /** Opponent's player data */
  opponent: Player | null
  /** Whether we're waiting for an opponent to join */
  isWaitingForOpponent: boolean
  /** Trivia category for this lobby */
  category?: string
}

/** Category display info */
const categoryInfo: Record<string, { name: string; icon: string }> = {
  fortnite: { name: 'Fortnite', icon: '🎮' },
  nfl: { name: 'NFL Football', icon: '🏈' },
}

/**
 * Convert Player's playercard to Cosmetic type for PlayerCardBanner
 */
function playerCardToCosmetic(player: Player | null): Cosmetic | null {
  if (!player?.playercard) return null
  
  return {
    id: player.playercard.id,
    name: player.playercard.name,
    type: player.playercard.type as Cosmetic['type'],
    rarity: player.playercard.rarity as Cosmetic['rarity'],
    image_url: player.playercard.image_url,
    price_coins: 0,
    is_limited: false,
  }
}

export function HeadToHeadDisplay({
  currentPlayer,
  opponent,
  isWaitingForOpponent,
  category = 'fortnite',
}: HeadToHeadDisplayProps) {
  const catInfo = categoryInfo[category] || { name: category, icon: '❓' }
  
  return (
    <div 
      className="flex flex-col items-center gap-4"
      data-testid="head-to-head-display"
    >
      {/* Category Badge */}
      <div 
        className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-full"
        data-testid="category-badge"
      >
        <span className="text-lg">{catInfo.icon}</span>
        <span className="text-sm font-medium text-neutral-300">{catInfo.name} Trivia</span>
      </div>
      
      {/* Players */}
      <div className="flex items-center justify-center gap-4 md:gap-8">
      {/* Left Side - Current User (always on left per Requirements 2.3) */}
      <div className="flex-shrink-0" data-testid="left-player">
        {currentPlayer ? (
          <PlayerCardBanner
            playercard={playerCardToCosmetic(currentPlayer)}
            playerName={currentPlayer.display_name || 'You'}
            isCurrentUser={true}
            size="large"
            showStatus={{
              isHost: currentPlayer.is_host,
              isReady: currentPlayer.is_ready,
            }}
          />
        ) : (
          <div className="w-[240px] h-[360px] bg-neutral-900/50 rounded-xl flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* VS Indicator (Requirements 2.4) */}
      <div 
        className="flex flex-col items-center justify-center px-2 md:px-4"
        data-testid="vs-indicator"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-xl bg-gradient-to-r from-red-500/30 via-white/20 to-blue-500/30" />
          
          {/* VS text */}
          <span className="relative text-3xl md:text-5xl font-black text-white tracking-tighter">
            VS
          </span>
        </div>
        
        {/* Decorative line */}
        <div className="w-px h-16 md:h-24 bg-gradient-to-b from-white/40 via-white/10 to-transparent mt-2" />
      </div>

      {/* Right Side - Opponent (Requirements 2.2, 2.3) */}
      <div className="flex-shrink-0" data-testid="right-player">
        {opponent ? (
          <PlayerCardBanner
            playercard={playerCardToCosmetic(opponent)}
            playerName={opponent.display_name || 'Opponent'}
            isCurrentUser={false}
            size="large"
            showStatus={{
              isHost: opponent.is_host,
              isReady: opponent.is_ready,
            }}
          />
        ) : isWaitingForOpponent ? (
          /* Waiting for opponent placeholder (Requirements 2.2) */
          <div 
            className="w-[240px] h-[360px] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center bg-neutral-900/30"
            data-testid="waiting-placeholder"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
              <span className="text-3xl text-neutral-600">?</span>
            </div>
            <span className="text-sm text-neutral-500">Waiting for</span>
            <span className="text-sm text-neutral-500">opponent...</span>
            
            {/* Animated dots */}
            <div className="flex gap-1 mt-3">
              <div className="w-2 h-2 rounded-full bg-neutral-600 animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-neutral-600 animate-pulse" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 rounded-full bg-neutral-600 animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        ) : (
          <div className="w-[240px] h-[360px] bg-neutral-900/50 rounded-xl" />
        )}
      </div>
      </div>
    </div>
  )
}
