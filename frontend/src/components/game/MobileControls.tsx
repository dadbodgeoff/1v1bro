/**
 * MobileControls - Enterprise-grade dual control scheme for mobile devices
 * Only renders on touch devices
 *
 * Layout: Movement joystick (bottom-left) + Fire button (bottom-right)
 * Standard mobile game layout for two-thumb control
 * 
 * Enterprise features:
 * - Haptic feedback on fire
 * - Visual feedback with scale/glow animations
 * - Smooth joystick with easing
 * - Proper separation from UI elements
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import type { Vector2 } from '@/game'

interface MobileControlsProps {
  onMove: (velocity: Vector2) => void
  onFire: () => void
  onFireDirection?: (direction: Vector2) => void
  enabled?: boolean
}

// Haptic feedback helper
function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if ('vibrate' in navigator) {
    const duration = style === 'light' ? 10 : style === 'medium' ? 25 : 50
    navigator.vibrate(duration)
  }
}

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
  const [isFirePressed, setIsFirePressed] = useState(false)
  const [joystickActive, setJoystickActive] = useState(false)
  const joystickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)

  const moveTouchIdRef = useRef<number | null>(null)
  const joystickCenterRef = useRef<Vector2>({ x: 0, y: 0 })
  const currentDirectionRef = useRef<Vector2>({ x: 1, y: 0 })
  const hasRequestedFullscreen = useRef(false)
  const lastMoveRef = useRef<Vector2>({ x: 0, y: 0 })

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

  const fireInCurrentDirection = useCallback(() => {
    if (!enabled) return

    // Haptic feedback on fire
    triggerHaptic('medium')

    const dir = currentDirectionRef.current
    const magnitude = Math.sqrt(dir.x * dir.x + dir.y * dir.y)

    if (onFireDirection && magnitude > 0.1) {
      onFireDirection({ x: dir.x / magnitude, y: dir.y / magnitude })
    } else {
      onFire()
    }
  }, [enabled, onFire, onFireDirection])

  const handleJoystickStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      e.stopPropagation()
      e.preventDefault()

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
          setJoystickActive(true)
          triggerHaptic('light')
          updateJoystick(touch.clientX, touch.clientY)
          break
        }
      }
    },
    [enabled]
  )

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    if (moveTouchIdRef.current === null) return
    e.preventDefault()

    const touch = Array.from(e.touches).find(
      (t) => t.identifier === moveTouchIdRef.current
    )
    if (touch) {
      updateJoystick(touch.clientX, touch.clientY)
    }
  }, [])

  const handleJoystickEnd = useCallback(
    (e: React.TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === moveTouchIdRef.current) {
          moveTouchIdRef.current = null
          setJoystickActive(false)
          onMove({ x: 0, y: 0 })
          lastMoveRef.current = { x: 0, y: 0 }

          if (knobRef.current) {
            knobRef.current.style.transform = 'translate(-50%, -50%)'
            knobRef.current.style.transition = 'transform 0.15s ease-out'
            setTimeout(() => {
              if (knobRef.current) {
                knobRef.current.style.transition = ''
              }
            }, 150)
          }
          break
        }
      }
    },
    [onMove]
  )

  const updateJoystick = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - joystickCenterRef.current.x
      const dy = clientY - joystickCenterRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxDistance = 40 // Slightly larger for better feel

      let normalizedX = dx / maxDistance
      let normalizedY = dy / maxDistance

      if (distance > maxDistance) {
        normalizedX = dx / distance
        normalizedY = dy / distance
      }

      // Apply slight exponential curve for better precision at low speeds
      const magnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY)
      if (magnitude > 0) {
        const curved = Math.pow(magnitude, 1.3) // Slight curve for precision
        normalizedX = (normalizedX / magnitude) * Math.min(curved, 1)
        normalizedY = (normalizedY / magnitude) * Math.min(curved, 1)
      }

      if (magnitude > 0.15) {
        currentDirectionRef.current = { x: normalizedX, y: normalizedY }
      }

      if (knobRef.current) {
        const clampedX = Math.max(-maxDistance, Math.min(maxDistance, dx))
        const clampedY = Math.max(-maxDistance, Math.min(maxDistance, dy))
        knobRef.current.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`
      }

      // Smooth the output slightly
      const smoothing = 0.3
      const smoothedX = lastMoveRef.current.x + (normalizedX - lastMoveRef.current.x) * (1 - smoothing)
      const smoothedY = lastMoveRef.current.y + (normalizedY - lastMoveRef.current.y) * (1 - smoothing)
      lastMoveRef.current = { x: smoothedX, y: smoothedY }

      onMove({ x: smoothedX, y: smoothedY })
    },
    [onMove]
  )

  const handleFireStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!enabled) return
      setIsFirePressed(true)
      fireInCurrentDirection()
    },
    [enabled, fireInCurrentDirection]
  )

  const handleFireEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFirePressed(false)
  }, [])

  if (!isTouchDevice) return null

  return (
    <>
      {/* MOVEMENT JOYSTICK - Bottom Left */}
      <div
        ref={joystickRef}
        style={{
          position: 'fixed',
          left: '20px',
          bottom: 'max(70px, calc(30px + env(safe-area-inset-bottom, 40px)))',
          width: '110px',
          height: '110px',
          zIndex: 9999,
          touchAction: 'none',
        }}
        className={`rounded-full transition-all duration-150 ${
          joystickActive 
            ? 'bg-white/15 border-2 border-white/30 shadow-lg shadow-white/10' 
            : 'bg-white/8 border border-white/15'
        }`}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {/* Direction indicators - subtle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`absolute top-2 w-1 h-3 rounded-full transition-opacity ${joystickActive ? 'bg-white/30' : 'bg-white/10'}`} />
          <div className={`absolute bottom-2 w-1 h-3 rounded-full transition-opacity ${joystickActive ? 'bg-white/30' : 'bg-white/10'}`} />
          <div className={`absolute left-2 w-3 h-1 rounded-full transition-opacity ${joystickActive ? 'bg-white/30' : 'bg-white/10'}`} />
          <div className={`absolute right-2 w-3 h-1 rounded-full transition-opacity ${joystickActive ? 'bg-white/30' : 'bg-white/10'}`} />
        </div>
        
        {/* Draggable knob */}
        <div
          ref={knobRef}
          className={`absolute top-1/2 left-1/2 w-14 h-14 rounded-full transition-all duration-75 ${
            joystickActive 
              ? 'bg-white/50 border-2 border-white/60 shadow-lg' 
              : 'bg-white/25 border border-white/35'
          }`}
          style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
        />
      </div>

      {/* FIRE BUTTON - Bottom Right, positioned ABOVE Leave button area */}
      <div
        style={{
          position: 'fixed',
          right: '20px',
          // Position higher to avoid Leave button (which is at bottom: 140px on mobile landscape)
          bottom: 'max(160px, calc(120px + env(safe-area-inset-bottom, 40px)))',
          zIndex: 9999,
          touchAction: 'none',
        }}
        onTouchStart={handleFireStart}
        onTouchEnd={handleFireEnd}
        onTouchCancel={handleFireEnd}
      >
        <div
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-75 ${
            !enabled
              ? 'bg-gray-500/20 border border-gray-400/30 opacity-50'
              : isFirePressed
                ? 'bg-red-500/70 border-2 border-red-300 scale-90 shadow-xl shadow-red-500/40'
                : 'bg-gradient-to-br from-red-500/50 to-red-600/50 border-2 border-red-400/60 shadow-lg shadow-red-500/20'
          }`}
        >
          {/* Glow ring on press */}
          {isFirePressed && enabled && (
            <div className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
          )}
          
          {/* Crosshair icon */}
          <svg 
            viewBox="0 0 24 24" 
            className={`w-8 h-8 transition-all ${isFirePressed ? 'text-white scale-110' : 'text-white/80'}`}
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        
        {/* Label below button */}
        <div className="text-center mt-1">
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Fire</span>
        </div>
      </div>
    </>
  )
}
