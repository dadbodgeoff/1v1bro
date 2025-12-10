/**
 * MobileControls - Dual control scheme for mobile devices
 * Only renders on touch devices
 *
 * Control scheme: Movement joystick (left) + Fire button (right)
 * - Left joystick: drag to move character
 * - Right button: tap to fire in movement direction (with aim assist)
 *
 * Separated controls prevent touch conflicts and allow simultaneous move+shoot
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import type { Vector2 } from '@/game'

interface MobileControlsProps {
  onMove: (velocity: Vector2) => void
  onFire: () => void
  /** Fire in a specific direction (normalized vector) */
  onFireDirection?: (direction: Vector2) => void
  enabled?: boolean
}

/**
 * Request fullscreen and lock to landscape orientation
 */
async function enterFullscreenLandscape(): Promise<void> {
  try {
    const docEl = document.documentElement
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen()
    } else if (
      (docEl as unknown as { webkitRequestFullscreen?: () => Promise<void> })
        .webkitRequestFullscreen
    ) {
      await (
        docEl as unknown as { webkitRequestFullscreen: () => Promise<void> }
      ).webkitRequestFullscreen()
    }

    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>
    }
    if (orientation?.lock) {
      try {
        await orientation.lock('landscape')
      } catch {
        // Orientation lock not supported
      }
    }
  } catch {
    // Fullscreen not supported
  }
}

export function MobileControls({
  onMove,
  onFire,
  onFireDirection,
  enabled = true,
}: MobileControlsProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const joystickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)

  // Touch tracking - separate IDs for movement
  const moveTouchIdRef = useRef<number | null>(null)
  const joystickCenterRef = useRef<Vector2>({ x: 0, y: 0 })
  const currentDirectionRef = useRef<Vector2>({ x: 1, y: 0 }) // Default: fire right
  const hasRequestedFullscreen = useRef(false)

  // Detect touch device
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsTouchDevice(isTouch)

    if (isTouch && !hasRequestedFullscreen.current) {
      const handleFirstTouch = () => {
        if (!hasRequestedFullscreen.current) {
          hasRequestedFullscreen.current = true
          enterFullscreenLandscape()
        }
      }
      document.addEventListener('touchstart', handleFirstTouch, { once: true })
      return () => document.removeEventListener('touchstart', handleFirstTouch)
    }
  }, [])

  // Fire in current direction
  const fireInCurrentDirection = useCallback(() => {
    if (!enabled) return

    const dir = currentDirectionRef.current
    const magnitude = Math.sqrt(dir.x * dir.x + dir.y * dir.y)

    if (onFireDirection && magnitude > 0.1) {
      // Fire in movement direction (normalized)
      onFireDirection({ x: dir.x / magnitude, y: dir.y / magnitude })
    } else {
      // Fallback to basic fire
      onFire()
    }
  }, [enabled, onFire, onFireDirection])

  // Handle joystick touch start - ONLY for movement
  const handleJoystickStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      e.stopPropagation()

      // Find a touch that isn't already tracked
      for (const touch of Array.from(e.changedTouches)) {
        if (moveTouchIdRef.current === null) {
          const rect = joystickRef.current?.getBoundingClientRect()
          if (rect) {
            joystickCenterRef.current = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            }
          }
          moveTouchIdRef.current = touch.identifier
          updateJoystick(touch.clientX, touch.clientY)
          break
        }
      }
    },
    [enabled]
  )

  // Handle joystick movement
  const handleJoystickMove = useCallback(
    (e: React.TouchEvent) => {
      if (moveTouchIdRef.current === null) return

      const touch = Array.from(e.touches).find(
        (t) => t.identifier === moveTouchIdRef.current
      )
      if (touch) {
        updateJoystick(touch.clientX, touch.clientY)
      }
    },
    []
  )

  // Handle joystick release
  const handleJoystickEnd = useCallback(
    (e: React.TouchEvent) => {
      // Check if our tracked touch ended
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === moveTouchIdRef.current) {
          moveTouchIdRef.current = null
          onMove({ x: 0, y: 0 })

          // Reset knob position
          if (knobRef.current) {
            knobRef.current.style.transform = 'translate(-50%, -50%)'
          }
          break
        }
      }
    },
    [onMove]
  )

  // Update joystick position and direction
  const updateJoystick = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - joystickCenterRef.current.x
      const dy = clientY - joystickCenterRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxDistance = 40

      let normalizedX = dx / maxDistance
      let normalizedY = dy / maxDistance

      if (distance > maxDistance) {
        normalizedX = dx / distance
        normalizedY = dy / distance
      }

      // Store direction for firing (only if actually moving)
      const magnitude = Math.sqrt(
        normalizedX * normalizedX + normalizedY * normalizedY
      )
      if (magnitude > 0.2) {
        currentDirectionRef.current = { x: normalizedX, y: normalizedY }
      }

      // Update knob visual
      if (knobRef.current) {
        const clampedX = Math.max(-maxDistance, Math.min(maxDistance, dx))
        const clampedY = Math.max(-maxDistance, Math.min(maxDistance, dy))
        knobRef.current.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`
      }

      onMove({ x: normalizedX, y: normalizedY })
    },
    [onMove]
  )

  // Handle fire button tap - completely separate from joystick
  const handleFireTap = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!enabled) return
      fireInCurrentDirection()
    },
    [enabled, fireInCurrentDirection]
  )

  if (!isTouchDevice) return null

  return (
    <>
      {/* Movement Joystick - Left side */}
      <div
        ref={joystickRef}
        className="fixed pointer-events-auto rounded-full bg-slate-800/70 border-2 border-slate-500/60 relative touch-none z-50 backdrop-blur-sm"
        style={{
          left: 'max(env(safe-area-inset-left, 20px), 20px)',
          bottom: 'max(env(safe-area-inset-bottom, 28px), 28px)',
          width: '130px',
          height: '130px',
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-white/10" />

        {/* Direction indicators */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="absolute top-2 text-white text-[10px]">▲</div>
          <div className="absolute bottom-2 text-white text-[10px]">▼</div>
          <div className="absolute left-2 text-white text-[10px]">◀</div>
          <div className="absolute right-2 text-white text-[10px]">▶</div>
        </div>

        {/* Movement knob */}
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 border-2 border-slate-300/60 shadow-lg flex items-center justify-center"
          style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
        >
          <span className="text-white/60 font-bold text-[10px] select-none">
            MOVE
          </span>
        </div>

        {/* Hint text */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/40 whitespace-nowrap">
          drag to move
        </div>
      </div>

      {/* Fire Button - Right side, completely separate */}
      <div
        className="fixed pointer-events-auto touch-none z-50"
        style={{
          right: 'max(env(safe-area-inset-right, 20px), 20px)',
          bottom: 'max(env(safe-area-inset-bottom, 28px), 28px)',
        }}
        onTouchStart={handleFireTap}
      >
        <div
          className={`w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 border-4 border-red-400/90 shadow-lg shadow-red-500/50 flex items-center justify-center active:scale-90 transition-transform ${
            !enabled ? 'opacity-50' : ''
          }`}
        >
          <span className="text-white font-bold text-sm drop-shadow-md select-none">
            FIRE
          </span>
        </div>
        {/* Hint text */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/40 whitespace-nowrap">
          tap to shoot
        </div>
      </div>
    </>
  )
}
