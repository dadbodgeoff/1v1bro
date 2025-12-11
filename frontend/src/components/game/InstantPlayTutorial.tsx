/**
 * InstantPlayTutorial - Quick tutorial overlay for guest players
 * 
 * Shows controls based on device type (WASD for desktop, touch for mobile).
 * Auto-dismisses after 5 seconds or on user interaction.
 * 
 * @module components/game/InstantPlayTutorial
 * Requirements: 1.3, 1.4, 6.2
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/helpers'

export interface InstantPlayTutorialProps {
  /** Whether the tutorial is visible */
  visible: boolean
  /** Callback when tutorial is dismissed */
  onDismiss: () => void
  /** Auto-dismiss timeout in ms (default: 5000) */
  autoDismissMs?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Detect if user is on a touch device
 */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Desktop controls display
 */
function DesktopControls() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white text-center">Controls</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Movement */}
        <div className="space-y-2">
          <p className="text-xs text-neutral-400 uppercase tracking-wider">Move</p>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center text-white font-mono text-sm">
              W
            </div>
            <div className="flex gap-1">
              <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center text-white font-mono text-sm">
                A
              </div>
              <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center text-white font-mono text-sm">
                S
              </div>
              <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center text-white font-mono text-sm">
                D
              </div>
            </div>
          </div>
        </div>

        {/* Shooting */}
        <div className="space-y-2">
          <p className="text-xs text-neutral-400 uppercase tracking-wider">Shoot</p>
          <div className="flex items-center justify-center">
            <div className="px-4 py-2 bg-white/10 border border-white/20 rounded flex items-center gap-2 text-white text-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm7 0v6H5V5h5zm2 0v14h7V5h-7zm-2 8H5v6h5v-6z"/>
              </svg>
              Click
            </div>
          </div>
        </div>
      </div>

      {/* Answer */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-400 uppercase tracking-wider text-center">Answer Questions</p>
        <div className="flex justify-center gap-1">
          {['1', '2', '3', '4'].map(key => (
            <div key={key} className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center text-white font-mono text-sm">
              {key}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile/touch controls display
 */
function TouchControls() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white text-center">Controls</h3>
      
      <div className="space-y-3">
        {/* Movement */}
        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
          <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Move</p>
            <p className="text-neutral-400 text-sm">Use the joystick on the left</p>
          </div>
        </div>


        {/* Shooting */}
        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
          <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07l-2.83 2.83M9.76 14.24l-2.83 2.83m0-10.14l2.83 2.83m4.48 4.48l2.83 2.83" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Shoot</p>
            <p className="text-neutral-400 text-sm">Tap the fire button on the right</p>
          </div>
        </div>

        {/* Answer */}
        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
          <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">?</span>
          </div>
          <div>
            <p className="text-white font-medium">Answer</p>
            <p className="text-neutral-400 text-sm">Tap the answer buttons below</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InstantPlayTutorial({
  visible,
  onDismiss,
  autoDismissMs = 5000,
  className,
}: InstantPlayTutorialProps) {
  const [isTouch] = useState(() => isTouchDevice())
  const [dismissTime, setDismissTime] = useState<number | null>(null)

  // Auto-dismiss after timeout
  useEffect(() => {
    if (!visible) return

    const startTime = Date.now()
    setDismissTime(startTime + autoDismissMs)

    const timer = setTimeout(() => {
      onDismiss()
    }, autoDismissMs)

    return () => clearTimeout(timer)
  }, [visible, autoDismissMs, onDismiss])

  // Handle click/tap to dismiss
  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  // Calculate remaining time for progress bar
  const [progress, setProgress] = useState(100)
  
  useEffect(() => {
    if (!visible || !dismissTime) return

    const interval = setInterval(() => {
      const remaining = dismissTime - Date.now()
      const pct = Math.max(0, (remaining / autoDismissMs) * 100)
      setProgress(pct)
    }, 50)

    return () => clearInterval(interval)
  }, [visible, dismissTime, autoDismissMs])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            'bg-black/70 backdrop-blur-sm',
            className
          )}
          onClick={handleDismiss}
          role="dialog"
          aria-label="Game tutorial"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {isTouch ? <TouchControls /> : <DesktopControls />}

            {/* Progress bar */}
            <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#F97316] transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Dismiss hint */}
            <p className="text-center text-neutral-500 text-xs mt-3">
              {isTouch ? 'Tap anywhere to start' : 'Click anywhere or press any key to start'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InstantPlayTutorial
