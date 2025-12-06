/**
 * PlayerCard - Clean player display
 */

import type { Player } from '@/types/api'

interface PlayerCardProps {
  player: Player
  isCurrentUser?: boolean
}

export function PlayerCard({ player, isCurrentUser }: PlayerCardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] border transition-all ${
        isCurrentUser ? 'border-white/[0.15]' : 'border-white/[0.06]'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
          player.is_host ? 'bg-white/[0.1] text-white' : 'bg-white/[0.06] text-neutral-400'
        }`}
      >
        {(player.display_name || 'P')[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {player.display_name || 'Player'}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-neutral-600">(you)</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {player.is_host && <span className="text-neutral-500">Host</span>}
          {!player.is_host && player.is_ready && (
            <span className="text-emerald-400">Ready</span>
          )}
          {!player.is_host && !player.is_ready && (
            <span className="text-neutral-500">Not ready</span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div
        className={`w-2 h-2 rounded-full ${
          player.is_ready || player.is_host ? 'bg-emerald-400' : 'bg-neutral-600'
        }`}
      />
    </div>
  )
}
