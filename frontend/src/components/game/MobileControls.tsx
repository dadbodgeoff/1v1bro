/**
 * MobileControls - Virtual joystick and fire button for mobile devices
 * Only renders on touch devices
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import type { Vector2 } from '@/game'

interface MobileControlsProps {
  onMove: (velocity: Vector2) => void
  onFire: () => void
  enabled?: boolean
}

export function MobileControls({ onMove, onFire, enabled = true }: MobileControlsProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const joystickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const touchIdRef = useRef<number | null>(null)
  const centerRef = useRef<Vector2>({ x: 0, y: 0 })

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
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
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50 p-4">
      <div className="flex justify-between items-end max-w-screen-lg mx-auto">
        {/* Virtual Joystick - Left side */}
        <div
          ref={joystickRef}
          className="pointer-events-auto w-32 h-32 rounded-full bg-slate-800/60 border-2 border-slate-600/50 relative touch-none"
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
        >
          {/* Joystick knob */}
          <div
            ref={knobRef}
            className="absolute top-1/2 left-1/2 w-14 h-14 rounded-full bg-indigo-500/80 border-2 border-indigo-400 shadow-lg"
            style={{ transform: 'translate(-50%, -50%)' }}
          />
          {/* Direction indicators */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-slate-500 text-xs">▲</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-500 text-xs">▼</div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">◀</div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▶</div>
        </div>

        {/* Fire Button - Right side */}
        <button
          className="pointer-events-auto w-24 h-24 rounded-full bg-red-600/80 border-4 border-red-400 shadow-lg active:bg-red-500 active:scale-95 transition-transform touch-none flex items-center justify-center"
          onTouchStart={handleFire}
        >
          <span className="text-white font-bold text-lg">FIRE</span>
        </button>
      </div>
    </div>
  )
}
