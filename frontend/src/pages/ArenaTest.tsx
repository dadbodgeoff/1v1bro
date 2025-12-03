/**
 * Arena Test Page - For testing the game arena rendering
 * Navigate to /arena-test to see the arena
 */

import { useState, useCallback } from 'react'
import { GameArena } from '@/components/game'
import type { Vector2, PowerUpState } from '@/game'

// Mock power-ups for testing
const MOCK_POWERUPS: PowerUpState[] = [
  { id: 1, position: { x: 280, y: 180 }, type: 'time_steal', active: true, collected: false },
  { id: 2, position: { x: 1000, y: 180 }, type: 'double_points', active: true, collected: false },
  { id: 3, position: { x: 120, y: 360 }, type: 'sos', active: false, collected: false },
  { id: 4, position: { x: 1160, y: 360 }, type: 'shield', active: true, collected: false },
  { id: 5, position: { x: 280, y: 540 }, type: 'time_steal', active: false, collected: false },
  { id: 6, position: { x: 1000, y: 540 }, type: 'sos', active: true, collected: false },
]

export function ArenaTest() {
  const [powerUps, setPowerUps] = useState<PowerUpState[]>(MOCK_POWERUPS)
  const [playerPos, setPlayerPos] = useState<Vector2>({ x: 160, y: 360 })
  const [collectedIds, setCollectedIds] = useState<number[]>([])

  const handlePositionUpdate = useCallback((position: Vector2) => {
    setPlayerPos(position)
  }, [])

  const handlePowerUpCollect = useCallback((powerUpId: number) => {
    if (collectedIds.includes(powerUpId)) return
    
    setCollectedIds(prev => [...prev, powerUpId])
    setPowerUps(prev =>
      prev.map(pu =>
        pu.id === powerUpId ? { ...pu, collected: true } : pu
      )
    )
    console.log(`Collected power-up ${powerUpId}!`)
  }, [collectedIds])

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Arena Test</h1>
        <div className="text-sm text-slate-400">
          Position: ({Math.round(playerPos.x)}, {Math.round(playerPos.y)})
          {' | '}
          Collected: {collectedIds.length}/6
        </div>
      </div>

      {/* Arena */}
      <div className="flex-1 p-4">
        <GameArena
          playerId="test-player"
          isPlayer1={true}
          powerUps={powerUps}
          onPositionUpdate={handlePositionUpdate}
          onPowerUpCollect={handlePowerUpCollect}
        />
      </div>

      {/* Controls hint */}
      <div className="p-4 bg-slate-800 text-slate-400 text-center text-sm">
        Use WASD or Arrow Keys to move
      </div>
    </div>
  )
}
