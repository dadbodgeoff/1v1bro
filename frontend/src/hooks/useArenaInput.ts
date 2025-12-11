/**
 * useArenaInput - Manages input handling for GameArena
 * 
 * Handles mouse, touch, and mobile control inputs
 * 
 * @module hooks/useArenaInput
 */

import { useCallback, useRef } from 'react'
import type { MutableRefObject } from 'react'
import type { GameEngine, Vector2 } from '@/game'

interface UseArenaInputOptions {
  engineRef: MutableRefObject<GameEngine | null>
  combatEnabled: boolean
}

interface UseArenaInputResult {
  mobileVelocityRef: MutableRefObject<Vector2>
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
  handleTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void
  handleMobileMove: (velocity: Vector2) => void
  handleMobileFire: () => void
  handleMobileFireDirection: (direction: Vector2) => void
}

export function useArenaInput({
  engineRef,
  combatEnabled,
}: UseArenaInputOptions): UseArenaInputResult {
  const mobileVelocityRef = useRef<Vector2>({ x: 0, y: 0 })

  // Handle mouse move for aiming
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    engineRef.current?.handleMouseMove(e.clientX, e.clientY)
  }, [engineRef])

  // Handle fire input
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // Left click
      engineRef.current?.handleFire()
    }
  }, [engineRef])

  // Handle touch for aiming (tap to aim at position)
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!combatEnabled) return
    const touch = e.touches[0]
    if (touch) {
      engineRef.current?.handleMouseMove(touch.clientX, touch.clientY)
    }
  }, [combatEnabled, engineRef])

  // Mobile controls handlers
  const handleMobileMove = useCallback((velocity: Vector2) => {
    mobileVelocityRef.current = velocity
    engineRef.current?.setMobileVelocity?.(velocity)
  }, [engineRef])

  const handleMobileFire = useCallback(() => {
    engineRef.current?.handleFire()
  }, [engineRef])

  // Fire in a specific direction (for mobile joystick)
  const handleMobileFireDirection = useCallback((direction: Vector2) => {
    engineRef.current?.handleFireDirection(direction)
  }, [engineRef])

  return {
    mobileVelocityRef,
    handleMouseMove,
    handleMouseDown,
    handleTouchMove,
    handleMobileMove,
    handleMobileFire,
    handleMobileFireDirection,
  }
}
