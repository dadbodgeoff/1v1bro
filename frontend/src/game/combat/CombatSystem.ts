/**
 * Combat System
 * Main coordinator for all combat logic
 */

import { WeaponManager } from './WeaponManager'
import { ProjectileManager } from './ProjectileManager'
import { HealthManager } from './HealthManager'
import { RespawnManager } from './RespawnManager'
import { HIT_RADIUS } from '../config'
import type {
  Vector2,
  Projectile,
  HealthState,
  HitEvent,
  FireEvent,
  DeathEvent,
  RespawnEvent,
  CombatCallbacks,
} from '../types'

export class CombatSystem {
  private weaponManager: WeaponManager
  private projectileManager: ProjectileManager
  private healthManager: HealthManager
  private respawnManager: RespawnManager

  private localPlayerId: string | null = null
  private aimDirection: Vector2 = { x: 1, y: 0 }
  private fireSequence = 0

  private callbacks: CombatCallbacks = {}

  // Aim assist settings
  private aimAssistEnabled = true
  private aimAssistStrength = 0.4 // How much to pull toward target (0-1)
  private aimAssistAngle = 25 // Degrees - cone within which aim assist activates
  private aimAssistRange = 500 // Max distance for aim assist

  constructor() {
    this.weaponManager = new WeaponManager()
    this.projectileManager = new ProjectileManager()
    this.healthManager = new HealthManager()
    this.respawnManager = new RespawnManager()
  }

  /**
   * Set the local player ID
   */
  setLocalPlayer(playerId: string): void {
    this.localPlayerId = playerId
    this.healthManager.initPlayer(playerId)
  }

  /**
   * Add opponent to combat tracking
   */
  setOpponent(playerId: string): void {
    this.healthManager.initPlayer(playerId)
  }


  /**
   * Set combat event callbacks
   */
  setCallbacks(callbacks: CombatCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Update aim direction based on mouse position
   * Applies aim assist if enabled and target is within assist cone
   */
  updateAim(mousePosition: Vector2, playerPosition: Vector2, targetPositions?: Map<string, Vector2>): void {
    const dx = mousePosition.x - playerPosition.x
    const dy = mousePosition.y - playerPosition.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length > 0) {
      let aimDir = { x: dx / length, y: dy / length }

      // Apply aim assist if enabled and we have targets
      if (this.aimAssistEnabled && targetPositions && targetPositions.size > 0) {
        aimDir = this.applyAimAssist(aimDir, playerPosition, targetPositions)
      }

      this.aimDirection = aimDir
    }
  }

  /**
   * Apply aim assist - gently pull aim toward nearest valid target
   */
  private applyAimAssist(
    rawAim: Vector2,
    playerPosition: Vector2,
    targets: Map<string, Vector2>
  ): Vector2 {
    let bestTarget: Vector2 | null = null
    let bestScore = Infinity

    const aimAngleRad = (this.aimAssistAngle * Math.PI) / 180

    for (const [playerId, targetPos] of targets) {
      // Skip self
      if (playerId === this.localPlayerId) continue
      // Skip dead players
      if (!this.healthManager.isAlive(playerId)) continue
      // Skip respawning players
      if (this.respawnManager.isRespawning(playerId)) continue

      const toTarget = {
        x: targetPos.x - playerPosition.x,
        y: targetPos.y - playerPosition.y,
      }
      const distance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y)

      // Skip if too far
      if (distance > this.aimAssistRange || distance < 1) continue

      // Normalize direction to target
      const targetDir = { x: toTarget.x / distance, y: toTarget.y / distance }

      // Calculate angle between aim and target
      const dot = rawAim.x * targetDir.x + rawAim.y * targetDir.y
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)))

      // Skip if outside aim assist cone
      if (angle > aimAngleRad) continue

      // Score based on angle (smaller is better) and distance
      const score = angle + distance / this.aimAssistRange

      if (score < bestScore) {
        bestScore = score
        bestTarget = targetDir
      }
    }

    // If we found a valid target, blend toward it
    if (bestTarget) {
      return {
        x: rawAim.x + (bestTarget.x - rawAim.x) * this.aimAssistStrength,
        y: rawAim.y + (bestTarget.y - rawAim.y) * this.aimAssistStrength,
      }
    }

    return rawAim
  }

  /**
   * Enable or disable aim assist
   */
  setAimAssist(enabled: boolean, strength?: number): void {
    this.aimAssistEnabled = enabled
    if (strength !== undefined) {
      this.aimAssistStrength = Math.max(0, Math.min(1, strength))
    }
  }

  /**
   * Update aim direction from movement (keyboard-only fallback)
   */
  updateAimFromMovement(velocity: Vector2): void {
    const length = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    if (length > 0) {
      this.aimDirection = { x: velocity.x / length, y: velocity.y / length }
    }
  }

  /**
   * Attempt to fire a projectile
   */
  tryFire(playerPosition: Vector2): boolean {
    if (!this.localPlayerId) return false
    if (!this.healthManager.isAlive(this.localPlayerId)) return false
    if (this.respawnManager.isRespawning(this.localPlayerId)) return false
    if (!this.weaponManager.canFire()) return false

    this.weaponManager.recordFire()
    this.fireSequence++

    // Apply spread to aim direction
    const spreadDirection = this.weaponManager.applySpread(this.aimDirection)

    // Spawn predicted projectile locally
    this.projectileManager.spawnProjectile(
      this.localPlayerId,
      playerPosition,
      spreadDirection,
      true // isPredicted
    )

    // Notify via callback (for WebSocket)
    const event: FireEvent = {
      playerId: this.localPlayerId,
      position: { ...playerPosition },
      direction: { ...spreadDirection },
      timestamp: Date.now(),
      sequenceNum: this.fireSequence,
    }
    this.callbacks.onFire?.(event)

    return true
  }


  /**
   * Main update loop - call every frame
   */
  update(deltaTime: number, players: Map<string, Vector2>): void {
    // Update projectiles
    this.projectileManager.update(deltaTime)

    // Check for hits
    const hits = this.checkProjectileCollisions(players)
    for (const hit of hits) {
      this.handleHit(hit, players)
    }

    // Check for completed respawns
    this.checkRespawns(players)
  }

  /**
   * Check all projectiles against all players
   */
  private checkProjectileCollisions(players: Map<string, Vector2>): HitEvent[] {
    const hits: HitEvent[] = []
    const projectiles = this.projectileManager.getProjectiles()

    for (const projectile of projectiles) {
      for (const [playerId, position] of players) {
        // Skip self-hits
        if (playerId === projectile.ownerId) continue
        // Skip dead players
        if (!this.healthManager.isAlive(playerId)) continue
        // Skip invulnerable players
        if (this.healthManager.isInvulnerable(playerId)) continue
        // Skip respawning players
        if (this.respawnManager.isRespawning(playerId)) continue

        if (this.checkHit(projectile, position)) {
          hits.push({
            projectileId: projectile.id,
            shooterId: projectile.ownerId,
            targetId: playerId,
            damage: projectile.damage,
            position: { ...projectile.position },
            timestamp: Date.now(),
          })
          this.projectileManager.destroyProjectile(projectile.id)
          break // Projectile can only hit one player
        }
      }
    }

    return hits
  }

  /**
   * Circle-circle collision check
   */
  private checkHit(projectile: Projectile, playerPos: Vector2): boolean {
    const dx = projectile.position.x - playerPos.x
    const dy = projectile.position.y - playerPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance <= HIT_RADIUS
  }


  /**
   * Handle a confirmed hit
   */
  private handleHit(hit: HitEvent, players: Map<string, Vector2>): void {
    // Apply damage
    this.healthManager.applyDamage(hit.targetId, hit.damage)

    // Notify callback
    this.callbacks.onHit?.(hit)

    // Check for death
    if (!this.healthManager.isAlive(hit.targetId)) {
      this.handleDeath(hit.targetId, hit.shooterId, players)
    }
  }

  /**
   * Handle player death
   */
  private handleDeath(playerId: string, killerId: string, players: Map<string, Vector2>): void {
    // Get enemy position for spawn selection
    const enemyPosition = players.get(killerId) ?? null

    // Start respawn timer (position stored in respawn manager)
    this.respawnManager.startRespawn(playerId, enemyPosition)

    // Notify callback
    const event: DeathEvent = {
      playerId,
      killerId,
      timestamp: Date.now(),
    }
    this.callbacks.onDeath?.(event)
  }

  /**
   * Check for completed respawns
   */
  private checkRespawns(players: Map<string, Vector2>): void {
    for (const [playerId] of players) {
      if (this.respawnManager.isRespawnReady(playerId)) {
        const position = this.respawnManager.completeRespawn(playerId)
        if (position) {
          this.healthManager.respawn(playerId)

          const event: RespawnEvent = {
            playerId,
            position,
            timestamp: Date.now(),
          }
          this.callbacks.onRespawn?.(event)
        }
      }
    }
  }

  // ============================================================================
  // Getters for rendering
  // ============================================================================

  getProjectiles(): Projectile[] {
    return this.projectileManager.getProjectiles()
  }

  getHealthState(playerId: string): HealthState | null {
    return this.healthManager.getState(playerId)
  }

  getAimDirection(): Vector2 {
    return { ...this.aimDirection }
  }

  /**
   * Check if aim assist is enabled
   */
  isAimAssistEnabled(): boolean {
    return this.aimAssistEnabled
  }

  isPlayerAlive(playerId: string): boolean {
    return this.healthManager.isAlive(playerId)
  }

  isPlayerInvulnerable(playerId: string): boolean {
    return this.healthManager.isInvulnerable(playerId)
  }

  isPlayerRespawning(playerId: string): boolean {
    return this.respawnManager.isRespawning(playerId)
  }

  getRespawnTimeRemaining(playerId: string): number {
    return this.respawnManager.getRespawnTimeRemaining(playerId)
  }

  wasRecentlyDamaged(playerId: string): boolean {
    return this.healthManager.wasRecentlyDamaged(playerId)
  }

  /**
   * Add shield to player (from power-up)
   */
  addShield(playerId: string, amount: number): void {
    this.healthManager.addShield(playerId, amount)
  }

  /**
   * Apply damage from external source (traps, hazards)
   */
  applyDamage(playerId: string, damage: number, source: string): void {
    const dealt = this.healthManager.applyDamage(playerId, damage)
    
    if (dealt > 0 && !this.healthManager.isAlive(playerId)) {
      // Player died from environmental damage
      const event: DeathEvent = {
        playerId,
        killerId: source, // 'trap', 'hazard', etc.
        timestamp: Date.now(),
      }
      this.callbacks.onDeath?.(event)
      
      // Start respawn (no enemy position for environmental deaths)
      this.respawnManager.startRespawn(playerId, null)
    }
  }

  /**
   * Reset combat system
   */
  reset(): void {
    this.weaponManager.reset()
    this.projectileManager.clear()
    this.healthManager.reset()
    this.respawnManager.reset()
    this.fireSequence = 0
  }

  // ============================================================================
  // Telemetry Support
  // ============================================================================

  /**
   * Get all health states for telemetry
   */
  getAllHealthStates(): Map<string, HealthState | null> {
    return this.healthManager.getAllStates()
  }

  /**
   * Get all aim directions for telemetry
   */
  getAimDirections(): Map<string, Vector2> {
    const directions = new Map<string, Vector2>()
    if (this.localPlayerId) {
      directions.set(this.localPlayerId, { ...this.aimDirection })
    }
    return directions
  }

  /**
   * Get set of respawning player IDs
   */
  getRespawningPlayers(): Set<string> {
    return this.respawnManager.getRespawningPlayers()
  }

  // ============================================================================
  // Server-Authoritative Combat Support
  // ============================================================================

  /**
   * Set projectiles from server state (replaces local projectiles)
   */
  setServerProjectiles(projectiles: Projectile[]): void {
    this.projectileManager.setFromServer(projectiles)
  }

  /**
   * Set health from server state
   */
  setServerHealth(playerId: string, health: number, maxHealth: number): void {
    this.healthManager.setFromServer(playerId, health, maxHealth)
  }

  /**
   * Handle respawn from server
   */
  handleServerRespawn(playerId: string): void {
    this.healthManager.respawn(playerId)
    this.respawnManager.clearRespawn(playerId)
  }
}
