/**
 * Telemetry Recorder
 * Captures game state every tick into a ring buffer for instant replay
 */

import type { Vector2, Projectile, HealthState, PlayerState } from '../types'
import type {
  TelemetryFrame,
  PlayerSnapshot,
  ProjectileSnapshot,
  NetworkStats,
  TelemetryCombatEvent,
  DeathReplay,
  TelemetryConfig,
} from './types'
import { DEFAULT_TELEMETRY_CONFIG } from './types'

export class TelemetryRecorder {
  private buffer: TelemetryFrame[] = []
  private config: TelemetryConfig
  private currentTick = 0
  private lobbyId: string = ''

  private networkStats: NetworkStats = {
    clientTick: 0,
    serverTick: 0,
    rttMs: 0,
    jitterMs: 0,
    packetLoss: 0,
  }

  // Track previous positions for velocity calculation
  private previousPositions: Map<string, Vector2> = new Map()

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = { ...DEFAULT_TELEMETRY_CONFIG, ...config }
  }

  /**
   * Set the lobby ID for replay metadata
   */
  setLobbyId(lobbyId: string): void {
    this.lobbyId = lobbyId
  }

  /**
   * Capture a frame of game state
   * Called every game tick
   */
  captureFrame(
    players: Map<string, PlayerState>,
    healthStates: Map<string, HealthState | null>,
    projectiles: Projectile[],
    events: TelemetryCombatEvent[],
    aimDirections: Map<string, Vector2>,
    respawningPlayers: Set<string>
  ): void {
    const now = Date.now()
    
    const frame: TelemetryFrame = {
      tick: this.currentTick++,
      timestamp: now,
      players: this.snapshotPlayers(players, healthStates, aimDirections, respawningPlayers),
      projectiles: this.snapshotProjectiles(projectiles),
      events: [...events],
      networkStats: { ...this.networkStats },
    }

    // Ring buffer: remove oldest when full
    if (this.buffer.length >= this.config.maxFrames) {
      this.buffer.shift()
    }
    this.buffer.push(frame)
  }

  /**
   * Create player snapshots with velocity calculation
   */
  private snapshotPlayers(
    players: Map<string, PlayerState>,
    healthStates: Map<string, HealthState | null>,
    aimDirections: Map<string, Vector2>,
    respawningPlayers: Set<string>
  ): PlayerSnapshot[] {
    const snapshots: PlayerSnapshot[] = []

    for (const [playerId, player] of players) {
      const health = healthStates.get(playerId)
      const prevPos = this.previousPositions.get(playerId)
      const aimDir = aimDirections.get(playerId) ?? { x: 1, y: 0 }

      // Calculate velocity from position delta
      let velocity: Vector2 = { x: 0, y: 0 }
      if (prevPos) {
        const dt = 1 / this.config.captureRate
        velocity = {
          x: (player.position.x - prevPos.x) / dt,
          y: (player.position.y - prevPos.y) / dt,
        }
      }

      // Determine player state
      let state: 'alive' | 'dead' | 'respawning' = 'alive'
      if (respawningPlayers.has(playerId)) {
        state = 'respawning'
      } else if (health && health.current <= 0) {
        state = 'dead'
      }

      snapshots.push({
        playerId,
        position: { ...player.position },
        velocity,
        health: health?.current ?? 100,
        shield: health?.shield ?? 0,
        isInvulnerable: health?.isInvulnerable ?? false,
        aimDirection: { ...aimDir },
        state,
      })

      // Store position for next velocity calculation
      this.previousPositions.set(playerId, { ...player.position })
    }

    return snapshots
  }

  /**
   * Create projectile snapshots
   */
  private snapshotProjectiles(projectiles: Projectile[]): ProjectileSnapshot[] {
    return projectiles.map(proj => ({
      id: proj.id,
      ownerId: proj.ownerId,
      position: { ...proj.position },
      velocity: { ...proj.velocity },
      spawnTick: this.currentTick - Math.floor((Date.now() - proj.spawnTime) / (1000 / this.config.captureRate)),
    }))
  }

  /**
   * Update network stats from WebSocket
   */
  updateNetworkStats(stats: Partial<NetworkStats>): void {
    Object.assign(this.networkStats, stats)
    this.networkStats.clientTick = this.currentTick
  }

  /**
   * Extract a death replay from the buffer
   * Returns the last N frames before the death
   */
  extractDeathReplay(
    victimId: string,
    killerId: string,
    deathTick?: number
  ): DeathReplay {
    const now = Date.now()
    const tick = deathTick ?? this.currentTick

    // Get the last replayFrames frames
    const startIndex = Math.max(0, this.buffer.length - this.config.replayFrames)
    const frames = this.buffer.slice(startIndex).map(f => ({ ...f }))

    return {
      id: crypto.randomUUID(),
      lobbyId: this.lobbyId,
      victimId,
      killerId,
      deathTick: tick,
      deathTimestamp: now,
      frames,
      flagged: false,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    }
  }

  /**
   * Get current tick number
   */
  getCurrentTick(): number {
    return this.currentTick
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.buffer.length
  }

  /**
   * Get current network stats
   */
  getNetworkStats(): NetworkStats {
    return { ...this.networkStats }
  }

  /**
   * Reset the recorder
   */
  reset(): void {
    this.buffer = []
    this.currentTick = 0
    this.previousPositions.clear()
    this.networkStats = {
      clientTick: 0,
      serverTick: 0,
      rttMs: 0,
      jitterMs: 0,
      packetLoss: 0,
    }
  }
}
