/**
 * GameArena - React component wrapping the game engine
 * Handles lifecycle and bridges React state with game engine
 */

import { useEffect, useRef, useCallback } from 'react'
import { GameEngine } from '@/game'
import type { Vector2, PowerUpState } from '@/game'

interface GameArenaProps {
  playerId: string
  isPlayer1: boolean
  opponentPosition?: Vector2 | null
  powerUps: PowerUpState[]
  onPositionUpdate: (position: Vector2) => void
  onPowerUpCollect: (powerUpId: number) => void
}

export function GameArena({
  playerId,
  isPlayer1,
  opponentPosition,
  powerUps,
  onPositionUpdate,
  onPowerUpCollect,
}: GameArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  // Initialize engine
  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new GameEngine(canvasRef.current)
    engine.initLocalPlayer(playerId, isPlayer1)
    engine.setCallbacks({
      onPositionUpdate,
      onPowerUpCollect,
    })
    engine.start()
    engineRef.current = engine

    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [playerId, isPlayer1])

  // Update callbacks when they change
  useEffect(() => {
    engineRef.current?.setCallbacks({
      onPositionUpdate,
      onPowerUpCollect,
    })
  }, [onPositionUpdate, onPowerUpCollect])

  // Update opponent position
  useEffect(() => {
    if (opponentPosition) {
      engineRef.current?.updateOpponentPosition(opponentPosition)
    }
  }, [opponentPosition])

  // Update power-ups
  useEffect(() => {
    engineRef.current?.setPowerUps(powerUps)
  }, [powerUps])

  // Handle resize
  useEffect(() => {
    const handleResize = () => engineRef.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
