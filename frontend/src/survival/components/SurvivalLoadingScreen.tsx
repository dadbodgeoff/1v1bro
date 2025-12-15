/**
 * SurvivalLoadingScreen - Professional loading UI for Survival Mode
 * Shows progress, phase, and handles errors
 * 
 * Mobile Optimization:
 * - Responsive text sizing
 * - Safe area padding
 * - Touch-friendly retry button
 */

import type { LoadingState } from '../core/LoadingManager'
import { useMobileOptimization } from '../hooks/useMobileOptimization'

interface Props {
  state: LoadingState
  onRetry?: () => void
}

export function SurvivalLoadingScreen({ state, onRetry }: Props) {
  const { isMobile, mobileConfig, viewportState } = useMobileOptimization()
  const isError = state.phase === 'error'
  const isReady = state.phase === 'ready'
  
  // Safe area padding
  const safeArea = viewportState.safeAreaInsets
  const isCompact = mobileConfig.ui.compactMode

  // Phase descriptions
  const getPhaseText = (): string => {
    switch (state.phase) {
      case 'idle': return 'Preparing...'
      case 'initializing': return 'Initializing engine...'
      case 'loading-core': return 'Loading track assets...'
      case 'loading-obstacles': return 'Loading obstacles...'
      case 'loading-character': return 'Loading character...'
      case 'finalizing': return 'Almost ready...'
      case 'ready': return 'Ready to play!'
      case 'error': return 'Loading failed'
    }
  }

  // Progress bar color
  const getProgressColor = (): string => {
    if (isError) return 'bg-red-500'
    if (isReady) return 'bg-green-500'
    return 'bg-orange-500'
  }

  return (
    <div 
      className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center"
      style={{
        paddingTop: Math.max(safeArea.top, 16),
        paddingRight: Math.max(safeArea.right, 16),
        paddingBottom: Math.max(safeArea.bottom, 16),
        paddingLeft: Math.max(safeArea.left, 16),
      }}
    >
      {/* Logo/Title */}
      <div className={`${isCompact ? 'mb-6' : 'mb-8'} text-center`}>
        <h1 className={`${isCompact ? 'text-3xl' : 'text-4xl'} font-bold text-orange-500 mb-2`}>
          Survival Mode
        </h1>
        <p className="text-gray-500 text-sm">
          Neural Pathway Runner
        </p>
      </div>

      {/* Loading Card */}
      <div className={`w-full max-w-md bg-black/50 backdrop-blur-sm rounded-xl border border-white/10 ${isCompact ? 'p-4' : 'p-6'}`}>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`}
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">
            {getPhaseText()}
          </span>
          <span className="text-gray-400 text-sm tabular-nums">
            {Math.round(state.progress)}%
          </span>
        </div>

        {/* Current Asset */}
        {state.currentAsset && !isError && !isReady && (
          <p className="text-gray-500 text-sm truncate">
            {state.currentAsset}
          </p>
        )}

        {/* Error State */}
        {isError && (
          <div className="mt-4">
            <p className="text-red-400 text-sm mb-4">
              {state.error || 'An error occurred while loading assets.'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-lg transition-colors min-h-[48px]"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Ready State */}
        {isReady && (
          <div className="mt-4 text-center">
            <p className="text-green-400 text-sm mb-2">
              ✓ All assets loaded
            </p>
            <p className="text-gray-500 text-xs">
              Loaded in {(state.elapsedTime / 1000).toFixed(1)}s
            </p>
          </div>
        )}
      </div>

      {/* Loading Animation */}
      {!isError && !isReady && (
        <div className="mt-8 flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {/* Tips - device-specific */}
      <div className={`${isCompact ? 'mt-6' : 'mt-8'} text-center max-w-sm px-4`}>
        <p className="text-gray-600 text-xs">
          {!isError && !isReady && (
            isMobile ? (
              <>
                <span className="text-gray-500">TIP:</span> Swipe up to jump, 
                down to slide, tap sides to move
              </>
            ) : (
              <>
                <span className="text-gray-500">TIP:</span> Use A/D to switch lanes, 
                SPACE to jump, S to slide
              </>
            )
          )}
        </p>
      </div>
    </div>
  )
}
