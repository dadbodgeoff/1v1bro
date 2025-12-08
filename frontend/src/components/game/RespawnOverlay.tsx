/**
 * Respawn Overlay - Shows countdown when player is dead
 * Includes option to watch death replay
 */

interface RespawnOverlayProps {
  timeRemaining: number // milliseconds
  visible: boolean
  hasReplay?: boolean
  onWatchReplay?: () => void
}

export function RespawnOverlay({
  timeRemaining,
  visible,
  hasReplay = false,
  onWatchReplay,
}: RespawnOverlayProps) {
  if (!visible) return null

  const seconds = Math.ceil(timeRemaining / 1000)

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Respawn content */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Eliminated text */}
        <div className="text-red-500 text-2xl font-bold tracking-wider animate-pulse">
          ELIMINATED
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center">
          <div className="text-white text-lg">Respawning in</div>
          <div className="text-indigo-400 text-6xl font-bold tabular-nums">
            {seconds}
          </div>
        </div>

        {/* Watch Replay button */}
        {hasReplay && onWatchReplay && (
          <button
            onClick={onWatchReplay}
            className="pointer-events-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Watch Replay
          </button>
        )}

        {/* Hint */}
        <div className="text-slate-400 text-sm mt-2">
          {hasReplay ? 'See what happened' : 'Get ready to fight!'}
        </div>
      </div>
    </div>
  )
}
