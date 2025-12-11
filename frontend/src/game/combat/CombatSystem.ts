/**
 * Combat System
 * Main coordinator for all combat logic
 */

import { WeaponManager } from './WeaponManager'
import { ProjectileManager } from './ProjectileManager'
import { HealthManager } from './HealthManager'
import { RespawnManager } from './RespawnManager'
import { AimAssist } from './AimAssist'
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
  private aimAssist: AimAssist

  private localPlayerId: string | null = null
  private aimDirection: Vector2 = { x: 1, y: 0 }
  private fireSequence = 0
  private lastKnownTargets: Map<string, Vector2> = new Map()

  private callbacks: CombatCallbacks = {}

  constructor() {
    this.weaponManager = new WeaponManager()
    this.projectileManager = new ProjectileManager()
    this.healthManager = new HealthManager()
    this.respawnManager = new RespawnManager()
    this.aimAssist = new AimAssist()
  }

  setLocalPlayer(playerId: string): void {
    this.localPlayerId = playerId
    this.healthManager.initPlayer(playerId)
    this.aimAssist.setLocalPlayer(playerId)
  }

  setOpponent(playerId: string): void {
    this.healthManager.initPlayer(playerId)
  }

  setCallbacks(callbacks: CombatCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Update aim direction based on mouse position
   */
  updateAim(mousePosition: Vector2, playerPosition: Vector2, targetPositions?: Map<string, Vector2>): void {
    const dx = mousePosition.x - playerPosition.x
    const dy = mousePosition.y - playerPosition.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length > 0) {
      let aimDir = { x: dx / length, y: dy / length }

      // Apply aim assist if enabled and we have targets
      if (targetPositions && targetPositions.size > 0) {
        const targets = this.buildAimAssistTargets(targetPositions)
        aimDir = this.aimAssist.applyAimAssist(aimDir, playerPosition, targets)
      }

      this.aimDirection = aimDir
    }
  }

  private buildAimAssistTargets(targetPositions: Map<string, Vector2>) {
    return Array.from(targetPositions.entries()).map(([playerId, position]) => ({
      playerId,
      position,
      isAlive: this.healthManager.isAlive(playerId),
      isRespawning: this.respawnManager.isRespawning(playerId),
    }))
  }

  setAimAssist(enabled: boolean, strength?: number): void {
    this.aimAssist.setEnabled(enabled, strength)
  }

  setMobileMode(isMobile: boolean): void {
    this.aimAssist.setMobileMode(isMobile)
  }

  isMobile(): boolean {
    return this.aimAssist.isMobile()
  }

  updateAimFromMovement(velocity: Vector2): void {
    const length = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    if (length > 0) {
      this.aimDirection = { x: velocity.x / length, y: velocity.y / length }
    }
  }

  setTargetPositions(targets: Map<string, Vector2>): void {
    this.lastKnownTargets = targets
  }

  tryFire(playerPosition: Vector2): boolean {
    if (!this.localPlayerId) return false
    if (!this.healthManager.isAlive(this.localPlayerId)) return false
    if (this.respawnManager.isRespawning(this.localPlayerId)) return false
    if (!this.weaponManager.canFire()) return false

    this.weaponManager.recordFire()
    this.fireSequence++

    // Mobile auto-aim
    let fireDirection = this.aimDirection
    if (this.aimAssist.isMobile()) {
      const targets = this.buildAimAssistTargets(this.lastKnownTargets)
      const autoAimDir = this.aimAssist.getMobileAutoAimDirection(playerPosition, targets)
      if (autoAimDir) {
        fireDirection = this.aimAssist.applyMobileAutoAim(this.aimDirection, autoAimDir)
      }
    }

    // Apply spread to aim direction
    const spreadDirection = this.weaponManager.applySpread(fireDirection)

    // Spawn predicted projectile locally
    this.projectileManager.spawnProjectile(
      this.localPlayerId,
      playerPosition,
      spreadDirection,
      true
    )

    // Notify via callback
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

  update(deltaTime: number, players: Map<string, Vector2>): void {
    this.projectileManager.update(deltaTime)
    const hits = this.checkProjectileCollisions(players)
    for (const hit of hits) {
      this.handleHit(hit, players)
    }
    this.checkRespawns(players)
  }

  private checkProjectileCollisions(players: Map<string, Vector2>): HitEvent[] {
    const hits: HitEvent[] = []
    const projectiles = this.projectileManager.getProjectiles()

    for (const projectile of projectiles) {
      for (const [playerId, position] of players) {
        if (playerId === projectile.ownerId) continue
        if (!this.healthManager.isAlive(playerId)) continue
        if (this.healthManager.isInvulnerable(playerId)) continue
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
          break
        }
      }
    }

    return hits
  }

  private checkHit(projectile: Projectile, playerPos: Vector2): boolean {
    const dx = projectile.position.x - playerPos.x
    const dy = projectile.position.y - playerPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance <= HIT_RADIUS
  }

  private handleHit(hit: HitEvent, players: Map<string, Vector2>): void {
    this.healthManager.applyDamage(hit.targetId, hit.damage)
    this.callbacks.onHit?.(hit)
    if (!this.healthManager.isAlive(hit.targetId)) {
      this.handleDeath(hit.targetId, hit.shooterId, players)
    }
  }

  private handleDeath(playerId: string, killerId: string, players: Map<string, Vector2>): void {
    const enemyPosition = players.get(killerId) ?? null
    this.respawnManager.startRespawn(playerId, enemyPosition)
    const event: DeathEvent = { playerId, killerId, timestamp: Date.now() }
    this.callbacks.onDeath?.(event)
  }

  private checkRespawns(players: Map<string, Vector2>): void {
    for (const [playerId] of players) {
      if (this.respawnManager.isRespawnReady(playerId)) {
        const position = this.respawnManager.completeRespawn(playerId)
        if (position) {
          this.healthManager.respawn(playerId)
          const event: RespawnEvent = { playerId, position, timestamp: Date.now() }
          this.callbacks.onRespawn?.(event)
        }
      }
    }
  }

  // Getters
  getProjectiles(): Projectile[] {
    return this.projectileManager.getProjectiles()
  }

  getHealthState(playerId: string): HealthState | null {
    return this.healthManager.getState(playerId)
  }

  getAimDirection(): Vector2 {
    return { ...this.aimDirection }
  }

  isAimAssistEnabled(): boolean {
    return this.aimAssist.isEnabled()
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

  addShield(playerId: string, amount: number): void {
    this.healthManager.addShield(playerId, amount)
  }

  applyDamage(playerId: string, damage: number, source: string): void {
    const dealt = this.healthManager.applyDamage(playerId, damage)
    
    if (dealt > 0 && !this.healthManager.isAlive(playerId)) {
      const event: DeathEvent = { playerId, killerId: source, timestamp: Date.now() }
      this.callbacks.onDeath?.(event)
      this.respawnManager.startRespawn(playerId, null)
    }
  }

  reset(): void {
    this.weaponManager.reset()
    this.projectileManager.clear()
    this.healthManager.reset()
    this.respawnManager.reset()
    this.fireSequence = 0
  }

  // Telemetry Support
  getAllHealthStates(): Map<string, HealthState | null> {
    return this.healthManager.getAllStates()
  }

  getAimDirections(): Map<string, Vector2> {
    const directions = new Map<string, Vector2>()
    if (this.localPlayerId) {
      directions.set(this.localPlayerId, { ...this.aimDirection })
    }
    return directions
  }

  getRespawningPlayers(): Set<string> {
    return this.respawnManager.getRespawningPlayers()
  }

  // Server-Authoritative Combat Support
  setServerProjectiles(projectiles: Projectile[]): void {
    this.projectileManager.setFromServer(projectiles)
  }

  setServerHealth(playerId: string, health: number, maxHealth: number): void {
    this.healthManager.setFromServer(playerId, health, maxHealth)
  }

  handleServerRespawn(playerId: string): void {
    this.healthManager.respawn(playerId)
    this.respawnManager.clearRespawn(playerId)
  }
}
