/**
 * TelemetryManager - Handles game telemetry recording and death replays
 * Single responsibility: Capture and manage telemetry data
 */

import { TelemetryRecorder } from '../telemetry'
import type { TelemetryCombatEvent, DeathReplay } from '../telemetry'
import type { PlayerState, HealthState, Projectile, Vector2 } from './types'

export class TelemetryManager {
  private telemetryRecorder: TelemetryRecorder
  private telemetryEvents: TelemetryCombatEvent[] = []
  private lastDeathReplay: DeathReplay | null = null

  constructor() {
    this.telemetryRecorder = new TelemetryRecorder()
  }

  recordEvent(type: TelemetryCombatEvent['type'], data: TelemetryCombatEvent['data']): void {
    this.telemetryEvents.push({
      type,
      tick: this.telemetryRecorder.getCurrentTick(),
      timestamp: Date.now(),
      data,
    })
  }

  captureFrame(
    players: Map<string, PlayerState>,
    healthStates: Map<string, HealthState | null>,
    projectiles: Projectile[],
    aimDirections: Map<string, Vector2>,
    respawningPlayers: Set<string>
  ): void {
    this.telemetryRecorder.captureFrame(
      players,
      healthStates,
      projectiles,
      this.telemetryEvents,
      aimDirections,
      respawningPlayers
    )
    this.telemetryEvents = []
  }

  extractDeathReplay(playerId: string, killerId: string): DeathReplay {
    this.lastDeathReplay = this.telemetryRecorder.extractDeathReplay(playerId, killerId)
    return this.lastDeathReplay
  }

  getNetworkStats(): { rttMs: number } {
    return this.telemetryRecorder.getNetworkStats()
  }

  setLobbyId(lobbyId: string): void {
    this.telemetryRecorder.setLobbyId(lobbyId)
  }

  updateNetworkStats(stats: { rttMs?: number; serverTick?: number; jitterMs?: number }): void {
    this.telemetryRecorder.updateNetworkStats(stats)
  }

  getLastDeathReplay(): DeathReplay | null {
    return this.lastDeathReplay
  }

  clearLastDeathReplay(): void {
    this.lastDeathReplay = null
  }
}
