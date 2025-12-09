/**
 * MobileControls - Virtual joystick and fire button for mobile devices
 * Only renders on touch devices
 * 
 * Features:
 * - Fullscreen mode on mobile for immersive gameplay
 * - Landscape orientation lock for optimal control layout
 * - Joystick on left, fire button on right (thumb-friendly)
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import type { Vector2 } from '@/game'

interface MobileControlsProps {
  onMove: (velocity: Vector2) => void
  onFire: () => void
  enabled?: boolean
}

/**
 * Request fullscreen and lock to landscape orientation
 */
async function enterFullscreenLandscape(): Promise<void> {
  try {
    // Request fullscreen
    const docEl = document.documentElement
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen()
    } else if ((docEl as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
      // Safari/iOS
      await (docEl as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen()
    }
    
    // Lock to landscape orientation (if supported)
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> }
    if (orientation?.lock) {
      try {
        await orientation.lock('landscape')
      } catch {
        // Orientation lock not supported or denied - that's okay
      }
    }
  } catch {
    // Fullscreen not supported or denied - continue without it
  }
}

export function MobileControls({ onMove, onFire, enabled = true }: MobileControlsProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const joystickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const touchIdRef = useRef<number | null>(null)
  const centerRef = useRef<Vector2>({ x: 0, y: 0 })
  const hasRequestedFullscreen = useRef(false)

  // Detect touch device and request fullscreen on first interaction
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsTouchDevice(isTouch)
    
    // Request fullscreen on first touch (must be user-initiated)
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

  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || touchIdRef.current !== null) return
    
    const touch = e.touches[0]
    touchIdRef.current = touch.identifier
    
    const rect = joystickRef.current?.getBoundingClientRect()
    if (rect) {
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    }
    
    updateJoystick(touch.clientX, touch.clientY)
  }, [enabled])

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current === null) return
    
    const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current)
    if (touch) {
      updateJoystick(touch.clientX, touch.clientY)
    }
  }, [])

  const handleJoystickEnd = useCallback(() => {
    touchIdRef.current = null
    onMove({ x: 0, y: 0 })
    
    // Reset knob position
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)'
    }
  }, [onMove])

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x
    const dy = clientY - centerRef.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = 40 // Max joystick travel
    
    // Normalize and clamp
    let normalizedX = dx / maxDistance
    let normalizedY = dy / maxDistance
    
    if (distance > maxDistance) {
      normalizedX = dx / distance
      normalizedY = dy / distance
    }
    
    // Update knob visual position
    if (knobRef.current) {
      const clampedX = Math.max(-maxDistance, Math.min(maxDistance, dx))
      const clampedY = Math.max(-maxDistance, Math.min(maxDistance, dy))
      knobRef.current.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`
    }
    
    // Emit velocity
    onMove({ x: normalizedX, y: normalizedY })
  }, [onMove])

  const handleFire = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (enabled) {
      onFire()
    }
  }, [enabled, onFire])

  // Don't render on non-touch devices
  if (!isTouchDevice) return null

  return (
    <>
      {/* Joystick - Bottom left corner, sized for thumb control */}
      <div
        ref={joystickRef}
        className="fixed pointer-events-auto rounded-full bg-slate-800/60 border-2 border-slate-500/50 relative touch-none z-50 backdrop-blur-sm"
        style={{
          // Position in bottom-left with safe area padding
          left: 'max(env(safe-area-inset-left, 16px), 16px)',
          bottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
          // Larger touch target for better control
          width: '120px',
          height: '120px',
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {/* Joystick knob */}
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 w-14 h-14 rounded-full bg-indigo-500/80 border-2 border-indigo-300/90 shadow-lg shadow-indigo-500/30"
          style={{ transform: 'translate(-50%, -50%)' }}
        />
        {/* Direction indicators */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <div className="absolute top-2 text-white text-xs">▲</div>
          <div className="absolute bottom-2 text-white text-xs">▼</div>
          <div className="absolute left-2 text-white text-xs">◀</div>
          <div className="absolute right-2 text-white text-xs">▶</div>
        </div>
      </div>

      {/* Fire Button - Bottom right corner, large and prominent */}
      <button
        className="fixed pointer-events-auto rounded-full bg-red-600/80 border-4 border-red-400/90 shadow-lg shadow-red-500/40 active:bg-red-500 active:scale-95 transition-transform touch-none flex items-center justify-center z-50 backdrop-blur-sm"
        style={{
          // Position in bottom-right with safe area padding
          right: 'max(env(safe-area-inset-right, 16px), 16px)',
          bottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
          // Large touch target for easy firing
          width: '100px',
          height: '100px',
        }}
        onTouchStart={handleFire}
      >
        <span className="text-white font-bold text-lg drop-shadow-md">FIRE</span>
      </button>
    </>
  )
}
