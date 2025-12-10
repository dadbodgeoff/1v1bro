/**
 * MobileControls - Dual control scheme for mobile devices
 * Only renders on touch devices
 *
 * Layout: Movement joystick (bottom-left) + Fire button (bottom-right)
 * Standard mobile game layout for two-thumb control
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import type { Vector2 } from '@/game'

interface MobileControlsProps {
  onMove: (velocity: Vector2) => void
  onFire: () => void
  onFireDirection?: (direction: Vector2) => void
  enabled?: boolean
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
  const joystickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)

  const moveTouchIdRef = useRef<number | null>(null)
  const joystickCenterRef = useRef<Vector2>({ x: 0, y: 0 })
  const currentDirectionRef = useRef<Vector2>({ x: 1, y: 0 })
  const hasRequestedFullscreen = useRef(false)

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
          onMove({ x: 0, y: 0 })

          if (knobRef.current) {
            knobRef.current.style.transform = 'translate(-50%, -50%)'
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
      const maxDistance = 35

      let normalizedX = dx / maxDistance
      let normalizedY = dy / maxDistance

      if (distance > maxDistance) {
        normalizedX = dx / distance
        normalizedY = dy / distance
      }

      const magnitude = Math.sqrt(
        normalizedX * normalizedX + normalizedY * normalizedY
      )
      if (magnitude > 0.2) {
        currentDirectionRef.current = { x: normalizedX, y: normalizedY }
      }

      if (knobRef.current) {
        const clampedX = Math.max(-maxDistance, Math.min(maxDistance, dx))
        const clampedY = Math.max(-maxDistance, Math.min(maxDistance, dy))
        knobRef.current.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`
      }

      onMove({ x: normalizedX, y: normalizedY })
    },
    [onMove]
  )

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
      {/* MOVEMENT JOYSTICK - Bottom Left (extra padding for browser chrome) */}
      <div
        ref={joystickRef}
        style={{
          position: 'fixed',
          left: '15px',
          bottom: 'max(60px, calc(20px + env(safe-area-inset-bottom, 40px)))',
          width: '100px',
          height: '100px',
          zIndex: 9999,
          touchAction: 'none',
        }}
        className="rounded-full bg-white/10 border border-white/15"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {/* Draggable knob - subtle */}
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-white/30 border border-white/40"
          style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
        />
      </div>

      {/* FIRE BUTTON - Bottom Right (extra padding for browser chrome) */}
      <div
        style={{
          position: 'fixed',
          right: '15px',
          bottom: 'max(60px, calc(20px + env(safe-area-inset-bottom, 40px)))',
          zIndex: 9999,
          touchAction: 'none',
        }}
        onTouchStart={handleFireTap}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            enabled
              ? 'bg-red-500/40 border border-red-400/50 active:bg-red-500/60 active:scale-95'
              : 'bg-gray-500/20 border border-gray-400/30 opacity-50'
          } transition-all`}
        >
          <span className="text-white/70 font-bold text-sm select-none">
            FIRE
          </span>
        </div>
      </div>
    </>
  )
}
