/**
 * useInterpolation - Handles position interpolation for smooth opponent movement
 * Single responsibility: Smooth rendering of networked positions
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { PositionInterpolator } from '@/game/systems/PositionInterpolator'
import type { Vector2 } from './types'

export function useInterpolation(lobbyCode: string | undefined) {
  const [opponentPosition, setOpponentPosition] = useState<Vector2 | null>(null)
  const interpolatorRef = useRef<PositionInterpolator>(new PositionInterpolator())
  const interpolationFrameRef = useRef<number | null>(null)
  const updateCallbackRef = useRef<((pos: Vector2) => void) | null>(null)

  // Add snapshot to interpolator (called when server position received)
  const addPositionSnapshot = useCallback((position: Vector2) => {
    interpolatorRef.current.addSnapshot(position)
  }, [])

  // Run interpolation loop
  useEffect(() => {
    if (!lobbyCode) return

    let isRunning = true

    const runInterpolation = () => {
      if (!isRunning) return

      if (interpolatorRef.current.hasData()) {
        const interpolated = interpolatorRef.current.getPosition()
        setOpponentPosition(interpolated)
        updateCallbackRef.current?.(interpolated)
      }
      interpolationFrameRef.current = requestAnimationFrame(runInterpolation)
    }

    interpolationFrameRef.current = requestAnimationFrame(runInterpolation)

    return () => {
      isRunning = false
      if (interpolationFrameRef.current) {
        cancelAnimationFrame(interpolationFrameRef.current)
        interpolationFrameRef.current = null
      }
    }
  }, [lobbyCode])

  // Set callback for direct game engine updates
  const setOpponentPositionCallback = useCallback((callback: (pos: Vector2) => void) => {
    updateCallbackRef.current = callback
  }, [])

  return {
    opponentPosition,
    addPositionSnapshot,
    setOpponentPositionCallback,
  }
}
