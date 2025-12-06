# PvP Combat System - Design Document

## Overview

This document outlines the technical design for the PvP combat system. The implementation adds projectile-based shooting to the existing arena game, with server-authoritative hit detection and client-side prediction for responsive gameplay.

The system integrates with the existing game architecture:
- **GameEngine** orchestrates combat alongside movement
- **CollisionSystem** extended for projectile-player collisions
- **WebSocket** handles combat events (fire, hit, damage, death)
- **Renderers** display projectiles, health bars, and effects

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Combat System                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Weapon    │  │ Projectile  │  │   Health    │  │   Respawn   │        │
│  │  Manager    │  │   Manager   │  │  Manager    │  │   Manager   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                │                │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐        │
│  │                      CombatSystem                               │        │
│  │  (Coordinates all combat logic, interfaces with GameEngine)     │        │
│  └────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────────┐
│         Client Systems           │   │           Server Systems            │
│  ┌───────────┐  ┌───────────┐   │   │  ┌───────────┐  ┌───────────┐      │
│  │  Input    │  │ Prediction│   │   │  │    Hit    │  │  State    │      │
│  │ (Aim/Fire)│  │ (Local)   │   │   │  │Validation │  │Authority  │      │
│  └───────────┘  └───────────┘   │   │  └───────────┘  └───────────┘      │
│  ┌───────────┐  ┌───────────┐   │   │  ┌───────────┐  ┌───────────┐      │
│  │ Rendering │  │   Audio   │   │   │  │  Damage   │  │  Respawn  │      │
│  │(Projectile│  │   (SFX)   │   │   │  │   Calc    │  │   Logic   │      │
│  └───────────┘  └───────────┘   │   │  └───────────┘  └───────────┘      │
└─────────────────────────────────┘   └─────────────────────────────────────┘
```


## Project Structure (New Files)

```
frontend/src/game/
├── combat/
│   ├── index.ts                   # Combat module exports
│   ├── CombatSystem.ts            # Main combat coordinator
│   ├── WeaponManager.ts           # Fire rate, cooldowns, ammo
│   ├── ProjectileManager.ts       # Projectile lifecycle
│   ├── HealthManager.ts           # Health, damage, shields
│   └── RespawnManager.ts          # Death and respawn logic
├── config/
│   └── combat.ts                  # Combat configuration values
├── renderers/
│   ├── ProjectileRenderer.ts      # Projectile and trail rendering
│   └── HealthBarRenderer.ts       # Health bar above players
├── systems/
│   └── CollisionSystem.ts         # Extended for projectiles
└── types/
    └── combat.ts                  # Combat-related types

backend/app/
├── combat/
│   ├── __init__.py
│   ├── hit_validator.py           # Server-side hit validation
│   ├── damage_calculator.py       # Damage application logic
│   └── respawn_handler.py         # Respawn point selection
└── websocket/
    └── combat_events.py           # Combat WebSocket messages
```

## Data Structures

### Combat Types (types/combat.ts)

```typescript
export interface Projectile {
  id: string
  ownerId: string              // Player who fired
  position: Vector2
  velocity: Vector2
  spawnTime: number
  maxRange: number
  damage: number
  isPredicted: boolean         // Client-side prediction flag
}

export interface WeaponConfig {
  fireRate: number             // Shots per second
  projectileSpeed: number      // Units per second
  maxRange: number             // Units before despawn
  damage: number               // Health points per hit
  spread: number               // Degrees of random deviation
  knockback: number            // Units of pushback on hit
}

export interface HealthState {
  current: number
  max: number
  shield: number
  shieldMax: number
  lastDamageTime: number
  isInvulnerable: boolean
  invulnerabilityEnd: number
}

export interface CombatState {
  health: HealthState
  isAlive: boolean
  respawnTime: number | null   // Timestamp when respawn occurs
  kills: number
  deaths: number
}

export interface HitEvent {
  projectileId: string
  shooterId: string
  targetId: string
  damage: number
  position: Vector2
  timestamp: number
}

export interface FireEvent {
  playerId: string
  position: Vector2
  direction: Vector2
  timestamp: number
  sequenceNum: number          // For reconciliation
}
```

### Combat Configuration (config/combat.ts)

```typescript
export const WEAPON_CONFIG: WeaponConfig = {
  fireRate: 3,                 // 3 shots per second
  projectileSpeed: 600,        // 600 units/sec
  maxRange: 400,               // ~1/3 arena width
  damage: 25,                  // 4 shots to kill
  spread: 2,                   // ±2 degrees
  knockback: 50,               // Slight pushback
}

export const HEALTH_CONFIG = {
  maxHealth: 100,
  maxShield: 50,               // From shield power-up
  shieldDecayRate: 0,          // Shield doesn't decay
  invulnerabilityDuration: 2000, // 2 seconds after respawn
}

export const RESPAWN_CONFIG = {
  respawnDelay: 3000,          // 3 seconds
  minSpawnDistance: 300,       // Min distance from enemy
  spawnPoints: [
    { x: 160, y: 360 },        // Player 1 spawn
    { x: 1120, y: 360 },       // Player 2 spawn
    { x: 640, y: 100 },        // Top center
    { x: 640, y: 620 },        // Bottom center
  ],
}

export const PROJECTILE_CONFIG = {
  hitboxRadius: 4,
  trailLength: 8,
  trailFadeSpeed: 0.15,
}

export const PLAYER_HURTBOX = {
  radius: 12,                  // Slightly smaller than sprite
}
```


## Core Components

### CombatSystem (combat/CombatSystem.ts)

```typescript
import { WeaponManager } from './WeaponManager'
import { ProjectileManager } from './ProjectileManager'
import { HealthManager } from './HealthManager'
import { RespawnManager } from './RespawnManager'
import type { Vector2, Projectile, HitEvent, FireEvent } from '../types'

export class CombatSystem {
  private weaponManager: WeaponManager
  private projectileManager: ProjectileManager
  private healthManager: HealthManager
  private respawnManager: RespawnManager
  
  private localPlayerId: string | null = null
  private aimDirection: Vector2 = { x: 1, y: 0 }
  private fireSequence = 0
  
  // Callbacks for external systems
  private onFire?: (event: FireEvent) => void
  private onHit?: (event: HitEvent) => void
  private onDeath?: (playerId: string) => void
  private onRespawn?: (playerId: string, position: Vector2) => void

  constructor() {
    this.weaponManager = new WeaponManager()
    this.projectileManager = new ProjectileManager()
    this.healthManager = new HealthManager()
    this.respawnManager = new RespawnManager()
  }

  setLocalPlayer(playerId: string): void {
    this.localPlayerId = playerId
    this.healthManager.initPlayer(playerId)
  }

  setOpponent(playerId: string): void {
    this.healthManager.initPlayer(playerId)
  }

  setCallbacks(callbacks: {
    onFire?: (event: FireEvent) => void
    onHit?: (event: HitEvent) => void
    onDeath?: (playerId: string) => void
    onRespawn?: (playerId: string, position: Vector2) => void
  }): void {
    this.onFire = callbacks.onFire
    this.onHit = callbacks.onHit
    this.onDeath = callbacks.onDeath
    this.onRespawn = callbacks.onRespawn
  }

  // Called from InputSystem
  updateAim(mousePosition: Vector2, playerPosition: Vector2): void {
    const dx = mousePosition.x - playerPosition.x
    const dy = mousePosition.y - playerPosition.y
    const length = Math.sqrt(dx * dx + dy * dy)
    if (length > 0) {
      this.aimDirection = { x: dx / length, y: dy / length }
    }
  }

  // Called when fire button pressed
  tryFire(playerPosition: Vector2): boolean {
    if (!this.localPlayerId) return false
    if (!this.healthManager.isAlive(this.localPlayerId)) return false
    if (!this.weaponManager.canFire()) return false

    this.weaponManager.recordFire()
    this.fireSequence++

    // Spawn predicted projectile locally
    const projectile = this.projectileManager.spawnProjectile(
      this.localPlayerId,
      playerPosition,
      this.aimDirection,
      true // isPredicted
    )

    // Notify server
    const event: FireEvent = {
      playerId: this.localPlayerId,
      position: playerPosition,
      direction: this.aimDirection,
      timestamp: Date.now(),
      sequenceNum: this.fireSequence,
    }
    this.onFire?.(event)

    return true
  }

  // Called every frame
  update(deltaTime: number, players: Map<string, Vector2>): void {
    // Update projectiles
    this.projectileManager.update(deltaTime)

    // Check collisions (client-side prediction)
    const hits = this.checkProjectileCollisions(players)
    hits.forEach(hit => {
      // Apply predicted damage locally
      this.healthManager.applyDamage(hit.targetId, hit.damage)
      this.onHit?.(hit)

      // Check for death
      if (!this.healthManager.isAlive(hit.targetId)) {
        this.handleDeath(hit.targetId)
      }
    })

    // Update respawn timers
    this.respawnManager.update(deltaTime)
  }

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
    const hitRadius = PROJECTILE_CONFIG.hitboxRadius + PLAYER_HURTBOX.radius
    return distance <= hitRadius
  }

  private handleDeath(playerId: string): void {
    this.onDeath?.(playerId)
    
    // Start respawn timer
    const respawnPos = this.respawnManager.startRespawn(
      playerId,
      this.getEnemyPosition(playerId)
    )
    
    setTimeout(() => {
      this.healthManager.respawn(playerId)
      this.onRespawn?.(playerId, respawnPos)
    }, RESPAWN_CONFIG.respawnDelay)
  }

  // Server reconciliation
  onServerHitConfirmed(event: HitEvent): void {
    // Server confirmed hit - ensure local state matches
    this.healthManager.setHealth(event.targetId, /* server value */)
  }

  onServerHitRejected(projectileId: string): void {
    // Server rejected hit - rollback local prediction
    // This is rare with good prediction
  }

  // Getters for rendering
  getProjectiles(): Projectile[] {
    return this.projectileManager.getProjectiles()
  }

  getHealthState(playerId: string): HealthState | null {
    return this.healthManager.getState(playerId)
  }

  getAimDirection(): Vector2 {
    return this.aimDirection
  }
}
```


### WeaponManager (combat/WeaponManager.ts)

```typescript
import { WEAPON_CONFIG } from '../config/combat'

export class WeaponManager {
  private lastFireTime = 0
  private fireInterval: number

  constructor() {
    this.fireInterval = 1000 / WEAPON_CONFIG.fireRate // ms between shots
  }

  canFire(): boolean {
    const now = Date.now()
    return now - this.lastFireTime >= this.fireInterval
  }

  recordFire(): void {
    this.lastFireTime = Date.now()
  }

  getCooldownProgress(): number {
    const now = Date.now()
    const elapsed = now - this.lastFireTime
    return Math.min(1, elapsed / this.fireInterval)
  }

  // Apply spread to aim direction
  applySpread(direction: Vector2): Vector2 {
    const spreadRad = (WEAPON_CONFIG.spread * Math.PI) / 180
    const randomAngle = (Math.random() - 0.5) * 2 * spreadRad
    const cos = Math.cos(randomAngle)
    const sin = Math.sin(randomAngle)
    return {
      x: direction.x * cos - direction.y * sin,
      y: direction.x * sin + direction.y * cos,
    }
  }
}
```

### ProjectileManager (combat/ProjectileManager.ts)

```typescript
import { WEAPON_CONFIG, PROJECTILE_CONFIG } from '../config/combat'
import { BARRIERS } from '../config/arena'
import type { Projectile, Vector2 } from '../types'

export class ProjectileManager {
  private projectiles: Map<string, Projectile> = new Map()
  private nextId = 0

  spawnProjectile(
    ownerId: string,
    position: Vector2,
    direction: Vector2,
    isPredicted: boolean
  ): Projectile {
    const id = `proj_${ownerId}_${this.nextId++}`
    
    const projectile: Projectile = {
      id,
      ownerId,
      position: { ...position },
      velocity: {
        x: direction.x * WEAPON_CONFIG.projectileSpeed,
        y: direction.y * WEAPON_CONFIG.projectileSpeed,
      },
      spawnTime: Date.now(),
      maxRange: WEAPON_CONFIG.maxRange,
      damage: WEAPON_CONFIG.damage,
      isPredicted,
    }

    this.projectiles.set(id, projectile)
    return projectile
  }

  update(deltaTime: number): void {
    const now = Date.now()

    for (const [id, projectile] of this.projectiles) {
      // Move projectile
      projectile.position.x += projectile.velocity.x * deltaTime
      projectile.position.y += projectile.velocity.y * deltaTime

      // Check range
      const elapsed = now - projectile.spawnTime
      const distance = (elapsed / 1000) * WEAPON_CONFIG.projectileSpeed
      if (distance >= projectile.maxRange) {
        this.projectiles.delete(id)
        continue
      }

      // Check barrier collision
      if (this.checkBarrierCollision(projectile.position)) {
        this.projectiles.delete(id)
        continue
      }
    }
  }

  private checkBarrierCollision(position: Vector2): boolean {
    for (const barrier of BARRIERS) {
      if (
        position.x >= barrier.x &&
        position.x <= barrier.x + barrier.width &&
        position.y >= barrier.y &&
        position.y <= barrier.y + barrier.height
      ) {
        return true
      }
    }
    return false
  }

  destroyProjectile(id: string): void {
    this.projectiles.delete(id)
  }

  getProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values())
  }

  // For server reconciliation
  reconcileProjectile(serverId: string, serverState: Partial<Projectile>): void {
    const projectile = this.projectiles.get(serverId)
    if (projectile) {
      Object.assign(projectile, serverState)
      projectile.isPredicted = false
    }
  }
}
```

### HealthManager (combat/HealthManager.ts)

```typescript
import { HEALTH_CONFIG } from '../config/combat'
import type { HealthState } from '../types'

export class HealthManager {
  private states: Map<string, HealthState> = new Map()

  initPlayer(playerId: string): void {
    this.states.set(playerId, {
      current: HEALTH_CONFIG.maxHealth,
      max: HEALTH_CONFIG.maxHealth,
      shield: 0,
      shieldMax: HEALTH_CONFIG.maxShield,
      lastDamageTime: 0,
      isInvulnerable: false,
      invulnerabilityEnd: 0,
    })
  }

  applyDamage(playerId: string, damage: number): number {
    const state = this.states.get(playerId)
    if (!state) return 0
    if (state.isInvulnerable && Date.now() < state.invulnerabilityEnd) return 0

    let remainingDamage = damage

    // Shield absorbs first
    if (state.shield > 0) {
      const shieldDamage = Math.min(state.shield, remainingDamage)
      state.shield -= shieldDamage
      remainingDamage -= shieldDamage
    }

    // Then health
    state.current = Math.max(0, state.current - remainingDamage)
    state.lastDamageTime = Date.now()

    return damage - remainingDamage // Actual damage dealt to health
  }

  isAlive(playerId: string): boolean {
    const state = this.states.get(playerId)
    return state ? state.current > 0 : false
  }

  isInvulnerable(playerId: string): boolean {
    const state = this.states.get(playerId)
    if (!state) return false
    return state.isInvulnerable && Date.now() < state.invulnerabilityEnd
  }

  respawn(playerId: string): void {
    const state = this.states.get(playerId)
    if (!state) return

    state.current = state.max
    state.shield = 0
    state.isInvulnerable = true
    state.invulnerabilityEnd = Date.now() + HEALTH_CONFIG.invulnerabilityDuration
  }

  addShield(playerId: string, amount: number): void {
    const state = this.states.get(playerId)
    if (!state) return
    state.shield = Math.min(state.shieldMax, state.shield + amount)
  }

  setHealth(playerId: string, health: number): void {
    const state = this.states.get(playerId)
    if (state) {
      state.current = Math.max(0, Math.min(state.max, health))
    }
  }

  getState(playerId: string): HealthState | null {
    return this.states.get(playerId) ?? null
  }
}
```


### RespawnManager (combat/RespawnManager.ts)

```typescript
import { RESPAWN_CONFIG } from '../config/combat'
import type { Vector2 } from '../types'

interface RespawnTimer {
  playerId: string
  respawnTime: number
  spawnPosition: Vector2
}

export class RespawnManager {
  private timers: Map<string, RespawnTimer> = new Map()

  startRespawn(playerId: string, enemyPosition: Vector2 | null): Vector2 {
    const spawnPosition = this.selectSpawnPoint(enemyPosition)
    
    this.timers.set(playerId, {
      playerId,
      respawnTime: Date.now() + RESPAWN_CONFIG.respawnDelay,
      spawnPosition,
    })

    return spawnPosition
  }

  private selectSpawnPoint(enemyPosition: Vector2 | null): Vector2 {
    if (!enemyPosition) {
      // Random spawn if no enemy
      const index = Math.floor(Math.random() * RESPAWN_CONFIG.spawnPoints.length)
      return { ...RESPAWN_CONFIG.spawnPoints[index] }
    }

    // Find spawn point furthest from enemy
    let bestSpawn = RESPAWN_CONFIG.spawnPoints[0]
    let bestDistance = 0

    for (const spawn of RESPAWN_CONFIG.spawnPoints) {
      const dx = spawn.x - enemyPosition.x
      const dy = spawn.y - enemyPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > bestDistance && distance >= RESPAWN_CONFIG.minSpawnDistance) {
        bestDistance = distance
        bestSpawn = spawn
      }
    }

    return { ...bestSpawn }
  }

  update(deltaTime: number): void {
    const now = Date.now()
    for (const [playerId, timer] of this.timers) {
      if (now >= timer.respawnTime) {
        this.timers.delete(playerId)
      }
    }
  }

  isRespawning(playerId: string): boolean {
    return this.timers.has(playerId)
  }

  getRespawnTimeRemaining(playerId: string): number {
    const timer = this.timers.get(playerId)
    if (!timer) return 0
    return Math.max(0, timer.respawnTime - Date.now())
  }

  getSpawnPosition(playerId: string): Vector2 | null {
    return this.timers.get(playerId)?.spawnPosition ?? null
  }
}
```

## Renderers

### ProjectileRenderer (renderers/ProjectileRenderer.ts)

```typescript
import { BaseRenderer } from './BaseRenderer'
import { PROJECTILE_CONFIG } from '../config/combat'
import { COLORS } from '../config/colors'
import type { Projectile } from '../types'

interface TrailPoint {
  x: number
  y: number
  alpha: number
}

export class ProjectileRenderer extends BaseRenderer {
  private projectiles: Projectile[] = []
  private trails: Map<string, TrailPoint[]> = new Map()

  setProjectiles(projectiles: Projectile[]): void {
    this.projectiles = projectiles
  }

  update(deltaTime: number): void {
    // Update trails
    for (const projectile of this.projectiles) {
      let trail = this.trails.get(projectile.id)
      if (!trail) {
        trail = []
        this.trails.set(projectile.id, trail)
      }

      // Add current position to trail
      trail.unshift({
        x: projectile.position.x,
        y: projectile.position.y,
        alpha: 1,
      })

      // Fade and trim trail
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].alpha -= PROJECTILE_CONFIG.trailFadeSpeed
        if (trail[i].alpha <= 0) {
          trail.splice(i, 1)
        }
      }

      // Limit trail length
      if (trail.length > PROJECTILE_CONFIG.trailLength) {
        trail.length = PROJECTILE_CONFIG.trailLength
      }
    }

    // Clean up trails for destroyed projectiles
    const activeIds = new Set(this.projectiles.map(p => p.id))
    for (const id of this.trails.keys()) {
      if (!activeIds.has(id)) {
        this.trails.delete(id)
      }
    }
  }

  render(): void {
    if (!this.ctx) return

    // Render trails
    for (const [id, trail] of this.trails) {
      this.renderTrail(trail)
    }

    // Render projectiles
    for (const projectile of this.projectiles) {
      this.renderProjectile(projectile)
    }
  }

  private renderTrail(trail: TrailPoint[]): void {
    if (!this.ctx || trail.length < 2) return

    for (let i = 1; i < trail.length; i++) {
      const point = trail[i]
      this.drawCircle(point.x, point.y, 2, COLORS.projectile, {
        alpha: point.alpha * 0.5,
        glowColor: COLORS.projectile,
        glowBlur: 4,
      })
    }
  }

  private renderProjectile(projectile: Projectile): void {
    if (!this.ctx) return

    const { position } = projectile

    // Glow effect
    this.drawCircle(position.x, position.y, PROJECTILE_CONFIG.hitboxRadius + 4, COLORS.projectile, {
      alpha: 0.3,
      glowColor: COLORS.projectile,
      glowBlur: 12,
    })

    // Core
    this.drawCircle(position.x, position.y, PROJECTILE_CONFIG.hitboxRadius, COLORS.white, {
      glowColor: COLORS.projectile,
      glowBlur: 8,
    })
  }
}
```

### HealthBarRenderer (renderers/HealthBarRenderer.ts)

```typescript
import { BaseRenderer } from './BaseRenderer'
import { COLORS } from '../config/colors'
import type { HealthState, Vector2 } from '../types'

interface PlayerHealth {
  position: Vector2
  state: HealthState
  isLocal: boolean
}

export class HealthBarRenderer extends BaseRenderer {
  private players: PlayerHealth[] = []

  setPlayers(players: PlayerHealth[]): void {
    this.players = players
  }

  render(): void {
    for (const player of this.players) {
      this.renderHealthBar(player)
    }
  }

  private renderHealthBar(player: PlayerHealth): void {
    if (!this.ctx) return

    const { position, state, isLocal } = player
    const barWidth = 40
    const barHeight = 6
    const yOffset = -35 // Above sprite

    const x = position.x - barWidth / 2
    const y = position.y + yOffset

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2)

    // Health bar
    const healthPercent = state.current / state.max
    const healthWidth = barWidth * healthPercent
    const healthColor = this.getHealthColor(healthPercent)
    
    this.ctx.fillStyle = healthColor
    this.ctx.fillRect(x, y, healthWidth, barHeight)

    // Shield bar (if any)
    if (state.shield > 0) {
      const shieldPercent = state.shield / state.shieldMax
      const shieldWidth = barWidth * shieldPercent
      
      this.ctx.fillStyle = COLORS.shield
      this.ctx.fillRect(x, y - 3, shieldWidth, 2)
    }

    // Invulnerability indicator
    if (state.isInvulnerable && Date.now() < state.invulnerabilityEnd) {
      this.ctx.strokeStyle = COLORS.invulnerable
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4)
    }
  }

  private getHealthColor(percent: number): string {
    if (percent > 0.6) return COLORS.healthHigh
    if (percent > 0.3) return COLORS.healthMed
    return COLORS.healthLow
  }
}
```


## WebSocket Events

### Client → Server

```typescript
// Fire a projectile
interface FireMessage {
  type: 'combat_fire'
  payload: {
    position: Vector2
    direction: Vector2
    timestamp: number
    sequenceNum: number
  }
}

// Claim a hit (for validation)
interface HitClaimMessage {
  type: 'combat_hit_claim'
  payload: {
    projectileId: string
    targetId: string
    position: Vector2
    timestamp: number
  }
}
```

### Server → Client

```typescript
// Confirm projectile spawn
interface FireConfirmMessage {
  type: 'combat_fire_confirm'
  payload: {
    sequenceNum: number
    projectileId: string
    accepted: boolean
  }
}

// Broadcast opponent's shot
interface OpponentFireMessage {
  type: 'combat_opponent_fire'
  payload: {
    playerId: string
    projectileId: string
    position: Vector2
    direction: Vector2
    timestamp: number
  }
}

// Confirm hit and apply damage
interface HitConfirmMessage {
  type: 'combat_hit_confirm'
  payload: {
    projectileId: string
    shooterId: string
    targetId: string
    damage: number
    targetHealth: number
    position: Vector2
  }
}

// Player eliminated
interface DeathMessage {
  type: 'combat_death'
  payload: {
    playerId: string
    killerId: string
    respawnTime: number
  }
}

// Player respawned
interface RespawnMessage {
  type: 'combat_respawn'
  payload: {
    playerId: string
    position: Vector2
    health: number
  }
}
```

## Server-Side Hit Validation

### Hit Validator (backend/app/combat/hit_validator.py)

```python
from dataclasses import dataclass
from typing import Optional
import math

@dataclass
class Vector2:
    x: float
    y: float

@dataclass
class HitClaim:
    projectile_id: str
    shooter_id: str
    target_id: str
    position: Vector2
    timestamp: float

class HitValidator:
    """Server-side hit validation to prevent cheating."""
    
    PROJECTILE_SPEED = 600  # units/sec
    MAX_RANGE = 400
    HIT_RADIUS = 16  # projectile + player hurtbox
    LATENCY_TOLERANCE_MS = 150  # Allow for network delay
    
    def __init__(self, game_state):
        self.game_state = game_state
        self.projectile_history = {}  # projectile_id -> spawn data
    
    def register_projectile(
        self,
        projectile_id: str,
        shooter_id: str,
        position: Vector2,
        direction: Vector2,
        timestamp: float
    ):
        """Record projectile spawn for later validation."""
        self.projectile_history[projectile_id] = {
            'shooter_id': shooter_id,
            'spawn_position': position,
            'direction': direction,
            'spawn_time': timestamp,
        }
    
    def validate_hit(self, claim: HitClaim) -> tuple[bool, str]:
        """
        Validate a hit claim.
        Returns (is_valid, reason).
        """
        # Check projectile exists
        proj_data = self.projectile_history.get(claim.projectile_id)
        if not proj_data:
            return False, "Unknown projectile"
        
        # Check shooter matches
        if proj_data['shooter_id'] != claim.shooter_id:
            return False, "Shooter mismatch"
        
        # Check not self-hit
        if claim.shooter_id == claim.target_id:
            return False, "Self-hit not allowed"
        
        # Check target exists and is alive
        target = self.game_state.get_player(claim.target_id)
        if not target or not target.is_alive:
            return False, "Invalid target"
        
        # Check target not invulnerable
        if target.is_invulnerable:
            return False, "Target invulnerable"
        
        # Validate timing
        elapsed_ms = (claim.timestamp - proj_data['spawn_time']) * 1000
        max_travel_time = (self.MAX_RANGE / self.PROJECTILE_SPEED) * 1000
        if elapsed_ms > max_travel_time + self.LATENCY_TOLERANCE_MS:
            return False, "Projectile expired"
        
        # Validate position (projectile should be near claimed hit point)
        expected_pos = self._calculate_projectile_position(
            proj_data['spawn_position'],
            proj_data['direction'],
            elapsed_ms / 1000
        )
        
        distance_to_claim = self._distance(expected_pos, claim.position)
        if distance_to_claim > self.HIT_RADIUS * 2:  # Allow some tolerance
            return False, "Position mismatch"
        
        # Validate target was near hit position
        target_pos = target.position
        distance_to_target = self._distance(claim.position, target_pos)
        if distance_to_target > self.HIT_RADIUS + self.LATENCY_TOLERANCE_MS * 0.3:
            return False, "Target not at hit position"
        
        return True, "Valid hit"
    
    def _calculate_projectile_position(
        self,
        spawn: Vector2,
        direction: Vector2,
        elapsed_sec: float
    ) -> Vector2:
        distance = self.PROJECTILE_SPEED * elapsed_sec
        return Vector2(
            x=spawn.x + direction.x * distance,
            y=spawn.y + direction.y * distance
        )
    
    def _distance(self, a: Vector2, b: Vector2) -> float:
        dx = a.x - b.x
        dy = a.y - b.y
        return math.sqrt(dx * dx + dy * dy)
    
    def cleanup_old_projectiles(self, current_time: float):
        """Remove projectiles that have exceeded max lifetime."""
        max_lifetime = (self.MAX_RANGE / self.PROJECTILE_SPEED) + 1  # +1 sec buffer
        expired = [
            pid for pid, data in self.projectile_history.items()
            if current_time - data['spawn_time'] > max_lifetime
        ]
        for pid in expired:
            del self.projectile_history[pid]
```

## Integration with GameEngine

```typescript
// In GameEngine.ts - add combat system

import { CombatSystem } from './combat'
import { ProjectileRenderer, HealthBarRenderer } from './renderers'

export class GameEngine {
  // ... existing code ...
  
  // Add combat
  private combatSystem: CombatSystem
  private projectileRenderer: ProjectileRenderer
  private healthBarRenderer: HealthBarRenderer
  
  constructor(canvas: HTMLCanvasElement) {
    // ... existing init ...
    
    this.combatSystem = new CombatSystem()
    this.projectileRenderer = new ProjectileRenderer()
    this.healthBarRenderer = new HealthBarRenderer()
  }
  
  initCombat(localPlayerId: string, opponentId: string | null): void {
    this.combatSystem.setLocalPlayer(localPlayerId)
    if (opponentId) {
      this.combatSystem.setOpponent(opponentId)
    }
    
    this.combatSystem.setCallbacks({
      onFire: (event) => this.callbacks.onCombatFire?.(event),
      onHit: (event) => this.callbacks.onCombatHit?.(event),
      onDeath: (playerId) => this.callbacks.onCombatDeath?.(playerId),
      onRespawn: (playerId, pos) => this.callbacks.onCombatRespawn?.(playerId, pos),
    })
  }
  
  // Handle mouse input for aiming
  handleMouseMove(clientX: number, clientY: number): void {
    if (!this.localPlayer) return
    
    const rect = this.canvas.getBoundingClientRect()
    const mousePos = {
      x: (clientX - rect.left) / this.scale,
      y: (clientY - rect.top) / this.scale,
    }
    
    this.combatSystem.updateAim(mousePos, this.localPlayer.position)
  }
  
  // Handle fire input
  handleFire(): void {
    if (!this.localPlayer) return
    this.combatSystem.tryFire(this.localPlayer.position)
  }
  
  private update(deltaTime: number): void {
    // ... existing update code ...
    
    // Update combat
    const playerPositions = new Map<string, Vector2>()
    if (this.localPlayer) {
      playerPositions.set(this.localPlayer.id, this.localPlayer.position)
    }
    if (this.opponent) {
      playerPositions.set(this.opponent.id, this.opponent.position)
    }
    
    this.combatSystem.update(deltaTime, playerPositions)
    this.projectileRenderer.update(deltaTime)
  }
  
  private render(): void {
    // ... existing render code ...
    
    // Render combat elements
    this.projectileRenderer.setContext(context)
    this.projectileRenderer.setProjectiles(this.combatSystem.getProjectiles())
    this.projectileRenderer.render()
    
    // Render health bars
    this.healthBarRenderer.setContext(context)
    this.healthBarRenderer.setPlayers([
      // ... build player health array ...
    ])
    this.healthBarRenderer.render()
  }
}
```

## Testing Strategy

### Unit Tests
- WeaponManager fire rate limiting
- ProjectileManager spawn/update/destroy
- HealthManager damage calculation
- RespawnManager spawn point selection
- Hit detection circle-circle collision

### Integration Tests
- Full fire → hit → damage → death → respawn flow
- Client-server reconciliation
- Multiple simultaneous projectiles

### Manual Testing
- Aim responsiveness
- Hit registration feel
- Visual feedback clarity
- Network latency simulation
