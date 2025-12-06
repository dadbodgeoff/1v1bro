/**
 * Arena Test Page - For testing the game arena rendering
 * Navigate to /arena-test to see the arena
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { GameArena } from '@/components/game'
import type { Vector2, PowerUpState, FireEvent, HitEvent, DeathEvent } from '@/game'

// Mock power-ups for testing - only ONE active at a time (matches game design)
const MOCK_POWERUPS: PowerUpState[] = [
  { id: 1, position: { x: 640, y: 360 }, type: 'shield', active: true, collected: false },
]

// Bot movement patterns
type BotBehavior = 'idle' | 'patrol' | 'chase' | 'random'

interface BotState {
  position: Vector2
  velocity: Vector2
  behavior: BotBehavior
  patrolIndex: number
  lastDirectionChange: number
}

// Patrol waypoints for the bot
const PATROL_POINTS: Vector2[] = [
  { x: 1120, y: 200 },
  { x: 1120, y: 520 },
  { x: 900, y: 360 },
  { x: 1120, y: 360 },
]

const BOT_SPEED = 120 // pixels per second

export function ArenaTest() {
  const [powerUps, setPowerUps] = useState<PowerUpState[]>(MOCK_POWERUPS)
  const [playerPos, setPlayerPos] = useState<Vector2>({ x: 160, y: 360 })
  const [collectedIds, setCollectedIds] = useState<number[]>([])
  const [combatEnabled, setCombatEnabled] = useState(true)
  const [botEnabled, setBotEnabled] = useState(true)
  const [shotsFired, setShotsFired] = useState(0)
  const [hits, setHits] = useState(0)
  const [botDeaths, setBotDeaths] = useState(0)

  // Bot state
  const [botPosition, setBotPosition] = useState<Vector2>({ x: 1120, y: 360 })
  const [botBehavior, setBotBehavior] = useState<BotBehavior>('patrol')
  const botStateRef = useRef<BotState>({
    position: { x: 1120, y: 360 },
    velocity: { x: 0, y: 0 },
    behavior: 'patrol',
    patrolIndex: 0,
    lastDirectionChange: Date.now(),
  })

  // Bot movement loop
  useEffect(() => {
    if (!botEnabled) return

    const updateBot = () => {
      const state = botStateRef.current
      const now = Date.now()
      const deltaTime = 1 / 60 // ~60fps

      switch (state.behavior) {
        case 'patrol': {
          const target = PATROL_POINTS[state.patrolIndex]
          const dx = target.x - state.position.x
          const dy = target.y - state.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 10) {
            // Reached waypoint, go to next
            state.patrolIndex = (state.patrolIndex + 1) % PATROL_POINTS.length
          } else {
            // Move toward waypoint
            state.velocity.x = (dx / dist) * BOT_SPEED
            state.velocity.y = (dy / dist) * BOT_SPEED
          }
          break
        }

        case 'chase': {
          const dx = playerPos.x - state.position.x
          const dy = playerPos.y - state.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > 50) {
            state.velocity.x = (dx / dist) * BOT_SPEED
            state.velocity.y = (dy / dist) * BOT_SPEED
          } else {
            state.velocity.x = 0
            state.velocity.y = 0
          }
          break
        }

        case 'random': {
          // Change direction every 1-2 seconds
          if (now - state.lastDirectionChange > 1000 + Math.random() * 1000) {
            const angle = Math.random() * Math.PI * 2
            state.velocity.x = Math.cos(angle) * BOT_SPEED
            state.velocity.y = Math.sin(angle) * BOT_SPEED
            state.lastDirectionChange = now
          }
          break
        }

        case 'idle':
        default:
          state.velocity.x = 0
          state.velocity.y = 0
          break
      }

      // Apply velocity
      state.position.x += state.velocity.x * deltaTime
      state.position.y += state.velocity.y * deltaTime

      // Keep in bounds (right side of arena)
      state.position.x = Math.max(700, Math.min(1200, state.position.x))
      state.position.y = Math.max(100, Math.min(620, state.position.y))

      setBotPosition({ ...state.position })
    }

    const interval = setInterval(updateBot, 1000 / 60)
    return () => clearInterval(interval)
  }, [botEnabled, playerPos, botBehavior])

  // Sync behavior changes
  useEffect(() => {
    botStateRef.current.behavior = botBehavior
  }, [botBehavior])

  const handlePositionUpdate = useCallback((position: Vector2) => {
    setPlayerPos(position)
  }, [])

  const handleCombatFire = useCallback((event: FireEvent) => {
    setShotsFired((prev) => prev + 1)
    console.log('Fire!', event)
  }, [])

  const handleCombatHit = useCallback((event: HitEvent) => {
    setHits((prev) => prev + 1)
    console.log('Hit!', event)
  }, [])

  const handleCombatDeath = useCallback((event: DeathEvent) => {
    if (event.playerId === 'bot-player') {
      setBotDeaths((prev) => prev + 1)
      console.log('Bot eliminated!', event)
    }
  }, [])

  const handlePowerUpCollect = useCallback(
    (powerUpId: number) => {
      if (collectedIds.includes(powerUpId)) return

      setCollectedIds((prev) => [...prev, powerUpId])
      setPowerUps((prev) => prev.map((pu) => (pu.id === powerUpId ? { ...pu, collected: true } : pu)))
      console.log(`Collected power-up ${powerUpId}!`)
    },
    [collectedIds]
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 bg-slate-800 text-white flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-xl font-bold">Arena Test</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setCombatEnabled(!combatEnabled)}
            className={`px-3 py-1 rounded text-sm ${combatEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            Combat: {combatEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setBotEnabled(!botEnabled)}
            className={`px-3 py-1 rounded text-sm ${botEnabled ? 'bg-pink-600' : 'bg-gray-600'}`}
          >
            Bot: {botEnabled ? 'ON' : 'OFF'}
          </button>
          <select
            value={botBehavior}
            onChange={(e) => setBotBehavior(e.target.value as BotBehavior)}
            className="px-2 py-1 rounded text-sm bg-slate-700 text-white"
          >
            <option value="patrol">Patrol</option>
            <option value="chase">Chase</option>
            <option value="random">Random</option>
            <option value="idle">Idle</option>
          </select>
          <div className="text-sm text-slate-400">
            Shots: {shotsFired} | Hits: {hits} | Bot Deaths: {botDeaths}
          </div>
        </div>
      </div>

      {/* Arena */}
      <div className="flex-1 p-4">
        <GameArena
          playerId="test-player"
          isPlayer1={true}
          opponentId={botEnabled ? 'bot-player' : undefined}
          opponentPosition={botEnabled ? botPosition : undefined}
          powerUps={powerUps}
          onPositionUpdate={handlePositionUpdate}
          onPowerUpCollect={handlePowerUpCollect}
          combatEnabled={combatEnabled}
          onCombatFire={handleCombatFire}
          onCombatHit={handleCombatHit}
          onCombatDeath={handleCombatDeath}
        />
      </div>

      {/* Controls hint */}
      <div className="p-4 bg-slate-800 text-slate-400 text-center text-sm">
        WASD/Arrows to move | Click to shoot | Bot is the pink sprite on the right
      </div>
    </div>
  )
}
