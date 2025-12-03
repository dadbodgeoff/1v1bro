import { cn } from '@/utils/helpers'
import type { Player } from '@/types/api'

interface PlayerCardProps {
  player: Player
  isCurrentUser?: boolean
}

export function PlayerCard({ player, isCurrentUser }: PlayerCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg',
        'bg-slate-800 border',
        isCurrentUser ? 'border-indigo-500' : 'border-slate-700'
      )}
    >
      {/* Avatar placeholder */}
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
          player.is_host ? 'bg-indigo-600' : 'bg-slate-600'
        )}
      >
        {(player.display_name || 'P')[0].toUpperCase()}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">
            {player.display_name || 'Player'}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-slate-400">(you)</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {player.is_host && (
            <span className="text-indigo-400">Host</span>
          )}
          {!player.is_host && player.is_ready && (
            <span className="text-green-400">Ready</span>
          )}
          {!player.is_host && !player.is_ready && (
            <span className="text-yellow-400">Not Ready</span>
          )}
        </div>
      </div>
    </div>
  )
}
