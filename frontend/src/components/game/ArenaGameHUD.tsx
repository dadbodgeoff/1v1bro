/**
 * ArenaGameHUD - HUD overlays for arena game (health bars, kill feed, controls)
 * Extracted from ArenaGame.tsx for modularity
 */

import { LatencyIndicator } from '@/components/game/LatencyIndicator'
import type { KillFeedEntry } from '@/components/game/ArenaScoreboard'

interface HealthState {
  playerId: string
  health: number
  maxHealth: number
}

interface MobileLandscapeHUDProps {
  visible: boolean
  localHealth: HealthState
  opponentHealth: HealthState
}

interface MobileKillFeedProps {
  killFeed: KillFeedEntry[]
}

interface ControlsHintProps {
  isMobileLandscape: boolean
}

interface LeaveButtonProps {
  isMobileLandscape: boolean
  isFullscreen: boolean
  onLeave: () => void
}

/**
 * Mobile landscape floating HUD - ultra compact health bars
 */
export function MobileLandscapeHUD({ visible, localHealth, opponentHealth }: MobileLandscapeHUDProps) {
  if (!visible) return null

  return (
    <div 
      className="absolute z-20 flex items-center gap-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg"
      style={{ 
        top: 'max(8px, env(safe-area-inset-top, 8px))',
        left: '50%',
        transform: 'translateX(-50%)'
      }}
    >
      {/* Local player - green */}
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-green-500/30 border border-green-500 flex items-center justify-center">
          <span className="text-[8px] text-green-400 font-bold">Y</span>
        </div>
        <div className="w-12 h-1.5 bg-black/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-200"
            style={{ width: `${(localHealth.health / localHealth.maxHealth) * 100}%` }}
          />
        </div>
      </div>
      
      <span className="text-[10px] text-white/40 font-medium">vs</span>
      
      {/* Opponent - red */}
      <div className="flex items-center gap-1.5">
        <div className="w-12 h-1.5 bg-black/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-200"
            style={{ width: `${(opponentHealth.health / opponentHealth.maxHealth) * 100}%` }}
          />
        </div>
        <div className="w-5 h-5 rounded-full bg-red-500/30 border border-red-500 flex items-center justify-center">
          <span className="text-[8px] text-red-400 font-bold">O</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile kill feed - top right of canvas (hidden on desktop)
 */
export function MobileKillFeed({ killFeed }: MobileKillFeedProps) {
  if (killFeed.length === 0) return null

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 sm:hidden">
      {killFeed.slice(-3).map((entry) => (
        <div
          key={entry.id}
          className={`px-2 py-1 rounded text-[10px] font-medium backdrop-blur-sm bg-black/60 border border-white/10 ${
            entry.type === 'kill' ? 'text-red-400' :
            entry.type === 'hit' ? 'text-orange-400' :
            entry.type === 'quiz' ? 'text-green-400' :
            'text-blue-400'
          }`}
        >
          {entry.text}
        </div>
      ))}
    </div>
  )
}

/**
 * Controls hint + Latency indicator - bottom left corner
 */
export function ControlsHint({ isMobileLandscape: _ }: ControlsHintProps) {
  return (
    <div className="absolute bottom-2 lg:bottom-3 left-2 lg:left-3 flex items-center gap-2 z-10 safe-area-bottom">
      <LatencyIndicator />
      {/* Desktop controls only - mobile controls are self-explanatory */}
      <div className="hidden lg:block px-2 py-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded">
        <p className="text-[9px] text-neutral-500 font-mono">
          WASD move · Click shoot · 1-4 answer
        </p>
      </div>
    </div>
  )
}

/**
 * Leave button - bottom right corner of canvas
 */
export function LeaveButton({ isMobileLandscape, isFullscreen, onLeave }: LeaveButtonProps) {
  return (
    <div 
      className="absolute bottom-3 right-3 z-10 safe-area-bottom" 
      style={{ bottom: isMobileLandscape ? '140px' : '12px' }}
    >
      <div className="flex gap-2">
        {/* Exit fullscreen button - only show when in fullscreen */}
        {isFullscreen && (
          <button
            onClick={() => document.exitFullscreen?.()}
            className="px-2 py-1.5 text-[10px] text-neutral-500 hover:text-white bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded transition-colors min-h-[44px]"
          >
            Exit FS
          </button>
        )}
        <button
          onClick={onLeave}
          className="px-2 py-1.5 text-[10px] text-neutral-600 hover:text-red-400 bg-black/60 backdrop-blur-sm border border-white/[0.08] rounded transition-colors min-h-[44px] min-w-[44px]"
        >
          Leave
        </button>
      </div>
    </div>
  )
}

export type { HealthState, MobileLandscapeHUDProps, MobileKillFeedProps, ControlsHintProps, LeaveButtonProps }
