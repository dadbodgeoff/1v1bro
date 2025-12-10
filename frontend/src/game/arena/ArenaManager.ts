/**
 * ArenaManager - Main coordinator for all arena systems
 * Orchestrates barriers, hazards, traps, transport, zones, and rendering
 * Supports dynamic spawning of hazards and traps with timers
 * 
 * @module arena/ArenaManager
 */

import type { MapConfig, MapTheme } from '../config/maps/map-schema'
import type { 
  ArenaCallbacks, 
  EffectState, 
  HazardType,
  ZoneEffect
} from './types'
import type { Vector2 } from '../types'

import { TileMap } from './TileMap'
import { MapLoader } from './MapLoader'
import { BarrierManager } from '../barriers'
import { HazardManager } from '../hazards'
import { TrapManager } from '../traps'
import { TransportManager } from '../transport'
import { ZoneManager, hazardTypeToEffectType } from '../zones'
import { SpatialHash } from '../collision'
import { LayerManager } from '../rendering'
import { RenderLayer } from './types'
import { DynamicSpawnManager } from './DynamicSpawnManager'
import { LavaVortexRenderer } from '../renderers/LavaVortexRenderer'

// ============================================================================
// ArenaManager Class
// ============================================================================

/**
 * ArenaManager coordinates all arena subsystems
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.6, 10.1
 */
export class ArenaManager {
  // Subsystems
  private tileMap: TileMap
  private mapLoader: MapLoader
  private barrierManager: BarrierManager
  private hazardManager: HazardManager
  private trapManager: TrapManager
  private transportManager: TransportManager
  private zoneManager: ZoneManager
  private spatialHash: SpatialHash
  private layerManager: LayerManager
  private dynamicSpawnManager: DynamicSpawnManager
  private lavaVortexRenderer: LavaVortexRenderer | null = null

  // State
  private mapConfig: MapConfig | null = null
  private isInitialized: boolean = false
  private callbacks: ArenaCallbacks = {}
  private useDynamicSpawning: boolean = true
  private theme: MapTheme = 'space'

  constructor() {
    this.tileMap = new TileMap()
    this.mapLoader = new MapLoader()
    this.barrierManager = new BarrierManager()
    this.hazardManager = new HazardManager()
    this.trapManager = new TrapManager()
    this.transportManager = new TransportManager()
    this.zoneManager = new ZoneManager()
    this.spatialHash = new SpatialHash(80, 16, 9)  // 80px cells, 16x9 grid
    this.layerManager = new LayerManager()
    this.dynamicSpawnManager = new DynamicSpawnManager()
  }

  /**
   * Load and initialize a map configuration
   * Requirements: 9.6
   * 
   * @param config - Map configuration to load
   * @param useDynamicSpawning - If true, hazards/traps spawn randomly (default: true)
   */
  loadMap(config: MapConfig, useDynamicSpawning: boolean = true): void {
    // Validate and load tile map
    this.tileMap = this.mapLoader.load(config)
    this.mapConfig = config
    this.useDynamicSpawning = useDynamicSpawning

    // Set theme from map config
    this.theme = config.metadata?.theme ?? 'space'

    // Initialize barriers (always static) with theme
    this.barrierManager.initialize(config.barriers)
    this.barrierManager.setTheme(this.theme)
    this.barrierManager.setCallbacks({
      onDestroyed: (id, pos) => {
        this.spatialHash.remove(id)
        this.callbacks.onBarrierDestroyed?.(id, pos)
      }
    })

    // Initialize hazards - empty if dynamic spawning, otherwise use config
    if (useDynamicSpawning) {
      this.hazardManager.initialize([])
    } else {
      this.hazardManager.initialize(config.hazards)
    }
    this.hazardManager.setTheme(this.theme)
    this.hazardManager.setCallbacks({
      onDamage: (playerId, damage, sourceId) => {
        this.callbacks.onHazardDamage?.(playerId, damage, sourceId)
      }
    })

    // Initialize traps - empty if dynamic spawning, otherwise use config
    if (useDynamicSpawning) {
      this.trapManager.initialize([])
    } else {
      this.trapManager.initialize(config.traps)
    }
    this.trapManager.setTheme(this.theme)
    this.trapManager.setCallbacks({
      onTriggered: (id, players) => {
        this.callbacks.onTrapTriggered?.(id, players)
      }
    })

    // Initialize transport (always static - teleporters and jump pads)
    this.transportManager.initialize(config.teleporters, config.jumpPads)
    this.transportManager.setTheme(this.theme)
    this.transportManager.setCallbacks({
      onTeleport: (playerId, from, to) => {
        this.callbacks.onPlayerTeleported?.(playerId, from, to)
      },
      onLaunch: (playerId, velocity) => {
        this.callbacks.onPlayerLaunched?.(playerId, velocity)
      }
    })

    // Initialize dynamic spawn manager with exclusion zones
    if (useDynamicSpawning) {
      const exclusionZones: Array<{ position: Vector2; radius: number }> = []
      
      // Add teleporters as exclusion zones
      for (const tp of config.teleporters) {
        exclusionZones.push({ position: tp.position, radius: tp.radius + 60 })
      }
      
      // Add jump pads as exclusion zones
      for (const jp of config.jumpPads) {
        exclusionZones.push({ position: jp.position, radius: jp.radius + 60 })
      }
      
      // Add spawn points as exclusion zones
      for (const sp of config.spawnPoints) {
        exclusionZones.push({ position: sp.position, radius: 100 })
      }

      this.dynamicSpawnManager.initialize(exclusionZones)
    }

    // Build spatial hash
    this.rebuildSpatialHash()

    // Initialize lava vortex renderer for volcanic theme
    if (this.theme === 'volcanic') {
      this.lavaVortexRenderer = new LavaVortexRenderer()
    } else {
      this.lavaVortexRenderer = null
    }

    // Register renderers
    this.registerRenderers()

    this.isInitialized = true
  }

  /**
   * Set event callbacks
   * 
   * @param callbacks - Callback functions for arena events
   */
  setCallbacks(callbacks: ArenaCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Main update loop - call every frame
   * 
   * @param deltaTime - Time since last update in seconds
   * @param players - Map of player IDs to positions
   */
  update(deltaTime: number, players: Map<string, Vector2>): void {
    if (!this.isInitialized) return

    // Handle dynamic spawning
    if (this.useDynamicSpawning) {
      this.updateDynamicSpawns(deltaTime)
    }

    // Update hazard effects
    this.hazardManager.update(deltaTime, players)

    // Update trap states
    this.trapManager.update(deltaTime, players)

    // Update transport cooldowns
    this.transportManager.update(deltaTime)

    // Update lava vortex for volcanic theme
    if (this.lavaVortexRenderer) {
      this.lavaVortexRenderer.update(deltaTime)
    }

    // Update zone effects for each player
    for (const [playerId, position] of players) {
      this.updatePlayerZoneEffects(playerId, position)
    }
  }

  /**
   * Update dynamic spawns - add/remove hazards and traps
   */
  private updateDynamicSpawns(_deltaTime: number): void {
    const result = this.dynamicSpawnManager.update(_deltaTime)

    // Add new hazards
    for (const hazardConfig of result.newHazards) {
      this.hazardManager.addHazard(hazardConfig)
    }

    // Remove despawned hazards
    for (const hazardId of result.removedHazards) {
      this.hazardManager.removeHazard(hazardId)
    }

    // Add new traps
    for (const trapConfig of result.newTraps) {
      this.trapManager.addTrap(trapConfig)
    }

    // Remove despawned traps
    for (const trapId of result.removedTraps) {
      this.trapManager.removeTrap(trapId)
    }
  }

  /**
   * Update zone effects for a single player
   */
  private updatePlayerZoneEffects(playerId: string, position: Vector2): void {
    const hazards = this.hazardManager.getHazardsAtPosition(position)
    const activeSourceIds: string[] = []

    for (const hazard of hazards) {
      activeSourceIds.push(hazard.id)
      
      const effect: ZoneEffect = {
        sourceId: hazard.id,
        type: hazardTypeToEffectType(hazard.type as HazardType),
        value: hazard.intensity,
        startTime: Date.now()
      }
      this.zoneManager.addEffect(playerId, effect)
    }

    // Remove effects from zones player has left
    this.zoneManager.cleanupStaleEffects(playerId, activeSourceIds)
  }

  /**
   * Get aggregated effect state for a player
   * 
   * @param playerId - Player ID
   * @returns Aggregated EffectState
   */
  getPlayerEffects(playerId: string): EffectState {
    return this.zoneManager.getEffectState(playerId)
  }

  /**
   * Check if a position collides with any barrier
   * 
   * @param position - Position to check
   * @param radius - Collision radius
   * @returns true if collision detected
   */
  checkBarrierCollision(position: Vector2, radius: number): boolean {
    const nearby = this.spatialHash.query(position, radius + 80)
    return this.barrierManager.checkCollision(position, radius, nearby)
  }

  /**
   * Resolve collision by pushing position out of barriers
   * 
   * @param position - Current position
   * @param radius - Collision radius
   * @returns Resolved position
   */
  resolveCollision(position: Vector2, radius: number): Vector2 {
    const nearby = this.spatialHash.query(position, radius + 80)
    return this.barrierManager.resolveCollision(position, radius, nearby)
  }

  /**
   * Apply damage to a barrier
   * 
   * @param barrierId - ID of barrier to damage
   * @param damage - Damage amount
   */
  damageBarrier(barrierId: string, damage: number): void {
    this.barrierManager.applyDamage(barrierId, damage)
  }

  /**
   * Check if player should teleport
   * 
   * @param playerId - Player ID
   * @param position - Player position
   * @returns Destination position or null
   */
  checkTeleport(playerId: string, position: Vector2): Vector2 | null {
    return this.transportManager.checkTeleport(playerId, position)
  }

  /**
   * Check if player should be launched by jump pad
   * 
   * @param playerId - Player ID
   * @param position - Player position
   * @returns Velocity vector or null
   */
  checkJumpPad(playerId: string, position: Vector2): Vector2 | null {
    return this.transportManager.checkJumpPad(playerId, position)
  }

  /**
   * Handle projectile hit for trap triggering
   * 
   * @param position - Projectile position
   * @param players - Map of player positions
   */
  onProjectileHit(position: Vector2, players: Map<string, Vector2>): void {
    this.trapManager.onProjectileHit(position, players)
  }

  /**
   * Get trap effect results
   * 
   * @returns Array of trap effect results
   */
  getTrapEffectResults() {
    return this.trapManager.getTrapEffectResults()
  }

  /**
   * Clear effects when player dies
   * 
   * @param playerId - Player ID
   */
  onPlayerDeath(playerId: string): void {
    this.zoneManager.clearPlayerEffects(playerId)
  }

  /**
   * Get tile map
   * 
   * @returns TileMap instance
   */
  getTileMap(): TileMap {
    return this.tileMap
  }

  /**
   * Get map configuration
   * 
   * @returns MapConfig or null
   */
  getMapConfig(): MapConfig | null {
    return this.mapConfig
  }

  /**
   * Check if arena is initialized
   * 
   * @returns true if initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * Render all arena elements
   * 
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isInitialized) return
    this.layerManager.render(ctx)

    // Render lava vortex at map center for volcanic theme
    if (this.lavaVortexRenderer) {
      // Map center is at 640, 360 (1280x720 / 2)
      this.lavaVortexRenderer.render(ctx, 640, 360, 80)
    }
  }

  /**
   * Get all hazard zones for visual system integration
   * @returns Array of hazard zone data
   */
  getHazardZones(): Array<{
    id: string
    type: string
    bounds: { x: number; y: number; width: number; height: number }
    intensity: number
  }> {
    return this.hazardManager.getAllHazards().map(h => ({
      id: h.id,
      type: h.type,
      bounds: h.bounds,
      intensity: h.intensity,
    }))
  }

  /**
   * Rebuild spatial hash after barrier changes
   */
  private rebuildSpatialHash(): void {
    this.spatialHash.clear()

    for (const barrier of this.barrierManager.getActiveBarriers()) {
      this.spatialHash.insert(barrier.id, barrier.position, barrier.size)
    }
  }

  /**
   * Register all renderers with layer manager
   */
  private registerRenderers(): void {
    // Hazards on HAZARDS layer
    this.layerManager.register(RenderLayer.HAZARDS, 0, 
      (ctx) => this.hazardManager.render(ctx))

    // Barriers on BARRIERS layer
    this.layerManager.register(RenderLayer.BARRIERS, 0, 
      (ctx) => this.barrierManager.render(ctx))

    // Traps on ENTITIES layer (lower sub-layer)
    this.layerManager.register(RenderLayer.ENTITIES, 10, 
      (ctx) => this.trapManager.render(ctx))

    // Transport on ENTITIES layer (higher sub-layer)
    this.layerManager.register(RenderLayer.ENTITIES, 20, 
      (ctx) => this.transportManager.render(ctx))
  }

  // ============================================================================
  // Server-Authoritative Hazard/Trap Sync
  // ============================================================================

  /**
   * Add a hazard from server event
   * Called when server broadcasts arena_hazard_spawn
   */
  addServerHazard(hazard: {
    id: string
    type: string
    bounds: { x: number; y: number; width: number; height: number }
    intensity: number
  }): void {
    this.hazardManager.addHazard({
      id: hazard.id,
      type: hazard.type as 'damage' | 'slow' | 'emp',
      bounds: hazard.bounds,
      intensity: hazard.intensity,
    })
  }

  /**
   * Remove a hazard from server event
   * Called when server broadcasts arena_hazard_despawn
   */
  removeServerHazard(hazardId: string): void {
    this.hazardManager.removeHazard(hazardId)
  }

  /**
   * Add a trap from server event
   * Called when server broadcasts arena_trap_spawn
   */
  addServerTrap(trap: {
    id: string
    type: string
    position: { x: number; y: number }
    radius: number
    effect: string
    effectValue: number
    cooldown: number
  }): void {
    // Map server effect names to client TrapEffect type
    // Server sends 'damage', client expects 'damage_burst'
    const effectMap: Record<string, 'damage_burst' | 'knockback' | 'stun'> = {
      'damage': 'damage_burst',
      'damage_burst': 'damage_burst',
      'knockback': 'knockback',
      'stun': 'stun',
    }
    const mappedEffect = effectMap[trap.effect] ?? 'damage_burst'
    
    this.trapManager.addTrap({
      id: trap.id,
      type: trap.type as 'pressure' | 'timed' | 'projectile',
      position: trap.position,
      radius: trap.radius,
      effect: mappedEffect,
      effectValue: trap.effectValue,
      cooldown: trap.cooldown,
    })
  }

  /**
   * Remove a trap from server event
   * Called when server broadcasts arena_trap_despawn
   */
  removeServerTrap(trapId: string): void {
    this.trapManager.removeTrap(trapId)
  }
}
