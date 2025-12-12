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
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center px-8">
      {/* Animated phone rotation icon */}
      <div className="w-20 h-20 mb-6 text-indigo-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-[spin_3s_ease-in-out_infinite]" style={{ animationDirection: 'alternate' }}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M12 18h.01" />
        </svg>
      </div>
      <p className="text-white text-xl font-semibold text-center mb-2">Rotate Your Device</p>
      <p className="text-neutral-400 text-sm text-center mb-8 max-w-xs">
        Turn your phone sideways for the best arena experience with full controls
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onFullscreen}
          className="w-full px-6 py-3 min-h-[48px] bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors touch-manipulation"
        >
          Enter Fullscreen & Play
        </button>
        <button
          onClick={onDismiss}
          className="w-full px-6 py-3 min-h-[48px] bg-white/10 hover:bg-white/20 text-white/70 text-sm font-medium rounded-xl transition-colors touch-manipulation"
        >
          Continue in Portrait
        </button>
      </div>
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
