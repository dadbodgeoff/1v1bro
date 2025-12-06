/**
 * Replay Controls
 * Play/pause, step, and speed controls for replay playback
 */

interface ReplayControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onSpeedChange: (speed: number) => void
  currentSpeed: number
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2]

export function ReplayControls({
  isPlaying,
  onPlayPause,
  onStepForward,
  onStepBackward,
  onSpeedChange,
  currentSpeed,
}: ReplayControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Step backward */}
      <button
        onClick={onStepBackward}
        className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        title="Step backward (frame)"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Step forward */}
      <button
        onClick={onStepForward}
        className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        title="Step forward (frame)"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
        </svg>
      </button>

      {/* Speed selector */}
      <div className="flex items-center gap-1 ml-4">
        <span className="text-xs text-gray-400 mr-1">Speed:</span>
        {SPEED_OPTIONS.map((speed) => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentSpeed === speed
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  )
}
