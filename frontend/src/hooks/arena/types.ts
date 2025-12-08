/**
 * Shared types for arena hooks
 */

import type { Vector2, PowerUpState, Projectile } from '@/game'
import type {
  HazardSpawnPayload,
  TrapSpawnPayload,
  TrapTriggeredPayload,
  ArenaStatePayload,
  BarrierDamagedPayload,
  BarrierDestroyedPayload,
  BuffAppliedPayload,
  BuffExpiredPayload,
} from '@/types/websocket'

export interface QuizState {
  status: string
  currentQuestion: {
    qNum: number
    text: string
    options: string[]
    startTime: number
  } | null
  localScore: number
  opponentScore: number
  roundResult: {
    correctAnswer: string
    localScore: number
    opponentScore: number
    localAnswer: string | null
    opponentAnswer: string | null
  } | null
  finalResult: {
    winnerId: string | null
    isTie: boolean
    localScore: number
    opponentScore: number
  } | null
}

export interface CombatCallbacks {
  onServerProjectiles: ((projectiles: Projectile[]) => void) | null
  onServerHealth: ((playerId: string, health: number, maxHealth: number) => void) | null
  onServerDeath: ((playerId: string, killerId: string) => void) | null
  onServerRespawn: ((playerId: string, x: number, y: number) => void) | null
}

export interface ArenaCallbacks {
  onHazardSpawn: ((hazard: HazardSpawnPayload) => void) | null
  onHazardDespawn: ((id: string) => void) | null
  onHazardEnter: ((hazardId: string, playerId: string, type: string) => void) | null
  onHazardExit: ((hazardId: string, playerId: string) => void) | null
  onHazardDamage: ((playerId: string, damage: number) => void) | null
  onTrapSpawn: ((trap: TrapSpawnPayload) => void) | null
  onTrapDespawn: ((id: string) => void) | null
  onTrapWarning: ((id: string) => void) | null
  onTrapTriggered: ((data: TrapTriggeredPayload) => void) | null
  onTrapArmed: ((id: string) => void) | null
  onTeleport: ((playerId: string, toX: number, toY: number) => void) | null
  onJumpPad: ((playerId: string, vx: number, vy: number) => void) | null
  // Server authority events
  onArenaState: ((state: ArenaStatePayload) => void) | null
  onBarrierDamaged: ((data: BarrierDamagedPayload) => void) | null
  onBarrierDestroyed: ((data: BarrierDestroyedPayload) => void) | null
  onBuffApplied: ((data: BuffAppliedPayload) => void) | null
  onBuffExpired: ((data: BuffExpiredPayload) => void) | null
}

export type { Vector2, PowerUpState, Projectile }
