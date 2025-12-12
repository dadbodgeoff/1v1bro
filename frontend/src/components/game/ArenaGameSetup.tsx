/**
 * ArenaGameSetup - Loading, waiting, and countdown screens for arena game
 * Extracted from ArenaGame.tsx for modularity
 */

import { PWAInstallPrompt } from '@/components/game/PWAInstallPrompt'

interface ArenaGameSetupProps {
  status: 'idle' | 'waiting' | 'countdown'
}

interface RotateDeviceHintProps {
  visible: boolean
  onDismiss: () => void
  onFullscreen: () => void
}

/**
 * Loading screen shown while waiting for opponent
 */
function WaitingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-4" />
      <p className="text-neutral-500 text-sm">Waiting for opponent...</p>
    </div>
  )
}

/**
 * Countdown screen shown before match starts
 */
function CountdownScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
      <p className="text-4xl font-semibold text-white tracking-tight">Ready</p>
      <p className="text-neutral-500 text-sm mt-2">Match starting...</p>
    </div>
  )
}

/**
 * Rotate device hint overlay - shown on mobile portrait
 */
export function RotateDeviceHint({ visible, onDismiss, onFullscreen }: RotateDeviceHintProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 safe-area-inset">
      {/* Animated phone rotation */}
      <div className="relative w-24 h-24 mb-6">
        {/* Phone outline */}
        <div className="absolute inset-0 flex items-center justify-center animate-[wiggle_2s_ease-in-out_infinite]">
          <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-indigo-400">
            <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="18" r="1" fill="currentColor" />
          </svg>
        </div>
        {/* Rotation arrow */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-indigo-400 animate-pulse">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <h2 className="text-white text-xl font-bold text-center mb-2">
        Rotate for Best Experience
      </h2>
      <p className="text-neutral-400 text-sm text-center mb-6 max-w-xs">
        Turn your phone sideways to see the full arena and access all controls
      </p>

      {/* Benefits list */}
      <div className="w-full max-w-xs space-y-2 mb-6">
        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
          <span className="text-lg">🎮</span>
          <span className="text-white text-sm">Full joystick & fire controls</span>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
          <span className="text-lg">👁️</span>
          <span className="text-white text-sm">See entire arena at once</span>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
          <span className="text-lg">⚡</span>
          <span className="text-white text-sm">Better aim & movement</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onFullscreen}
          className="w-full px-6 py-3 min-h-[48px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors touch-manipulation flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Go Fullscreen & Rotate
        </button>
        <button
          onClick={onDismiss}
          className="w-full px-6 py-3 min-h-[48px] bg-white/5 hover:bg-white/10 text-neutral-400 text-sm rounded-xl transition-colors touch-manipulation"
        >
          Continue in Portrait
        </button>
      </div>

      {/* CSS for wiggle animation */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * ArenaGameSetup - Renders appropriate setup screen based on game status
 */
export function ArenaGameSetup({ status }: ArenaGameSetupProps) {
  if (status === 'idle' || status === 'waiting') {
    return (
      <>
        <PWAInstallPrompt />
        <WaitingScreen />
      </>
    )
  }

  if (status === 'countdown') {
    return (
      <>
        <PWAInstallPrompt />
        <CountdownScreen />
      </>
    )
  }

  return null
}

export type { ArenaGameSetupProps, RotateDeviceHintProps }
