/**
 * DynamicSpawnManager - Handles random spawning of hazards and traps
 * Spawns elements at random positions with configurable timers
 * 
 * @module arena/DynamicSpawnManager
 */

import type { HazardConfig, TrapConfig, TrapEffect } from './types'
import type { Vector2 } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface SpawnConfig {
  /** Min time before first spawn (seconds) */
  initialDelayMin: number
  /** Max time before first spawn (seconds) */
  initialDelayMax: number
  /** Min lifetime of spawned element (seconds) */
  lifetimeMin: number
  /** Max lifetime of spawned element (seconds) */
  lifetimeMax: number
  /** Min time between spawns (seconds) */
  respawnDelayMin: number
  /** Max time between spawns (seconds) */
  respawnDelayMax: number
  /** Max concurrent spawns of this type */
  maxConcurrent: number
}

export interface SpawnableHazard {
  id: string
  config: HazardConfig
  spawnTime: number
  despawnTime: number
  isActive: boolean
}

export interface SpawnableTrap {
  id: string
  config: TrapConfig
  spawnTime: number
  despawnTime: number
  isActive: boolean
}

export interface DynamicSpawnCallbacks {
  onHazardSpawned?: (config: HazardConfig) => void
  onHazardDespawned?: (id: string) => void
  onTrapSpawned?: (config: TrapConfig) => void
  onTrapDespawned?: (id: string) => void
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_HAZARD_SPAWN: SpawnConfig = {
  initialDelayMin: 3,
  initialDelayMax: 8,
  lifetimeMin: 8,
  lifetimeMax: 15,
  respawnDelayMin: 5,
  respawnDelayMax: 12,
  maxConcurrent: 6
}

const DEFAULT_TRAP_SPAWN: SpawnConfig = {
  initialDelayMin: 5,
  initialDelayMax: 10,
  lifetimeMin: 10,
  lifetimeMax: 20,
  respawnDelayMin: 8,
  respawnDelayMax: 15,
  maxConcurrent: 4
}

// ============================================================================
// Spawn Zone Definitions (avoid corners where teleporters are)
// ============================================================================

const SPAWN_ZONES: Array<{ x: number; y: number; width: number; height: number }> = [
  // Top middle area
  { x: 200, y: 80, width: 880, height: 120 },
  // Middle left
  { x: 160, y: 200, width: 200, height: 320 },
  // Middle center
  { x: 400, y: 200, width: 480, height: 320 },
  // Middle right
  { x: 920, y: 200, width: 200, height: 320 },
  // Bottom middle area
  { x: 200, y: 520, width: 880, height: 120 }
]

// ============================================================================
// DynamicSpawnManager Class
// ============================================================================

export class DynamicSpawnManager {
  private hazards: Map<string, SpawnableHazard> = new Map()
  private traps: Map<string, SpawnableTrap> = new Map()
  private hazardSpawnConfig: SpawnConfig
  private trapSpawnConfig: SpawnConfig
  private callbacks: DynamicSpawnCallbacks = {}
  
  private nextHazardId = 0
  private nextTrapId = 0
  private nextHazardSpawnTime = 0
  private nextTrapSpawnTime = 0
  private isInitialized = false
  private startTime = 0

  // Exclusion zones (teleporters, jump pads, spawn points)
  private exclusionZones: Array<{ position: Vector2; radius: number }> = []

  constructor(
    hazardConfig: Partial<SpawnConfig> = {},
    trapConfig: Partial<SpawnConfig> = {}
  ) {
    this.hazardSpawnConfig = { ...DEFAULT_HAZARD_SPAWN, ...hazardConfig }
    this.trapSpawnConfig = { ...DEFAULT_TRAP_SPAWN, ...trapConfig }
  }

  /**
   * Initialize the spawn manager
   */
  initialize(exclusionZones: Array<{ position: Vector2; radius: number }> = []): void {
    this.hazards.clear()
    this.traps.clear()
    this.exclusionZones = exclusionZones
    this.startTime = Date.now() / 1000
    
    // Schedule first spawns
    this.nextHazardSpawnTime = this.startTime + this.randomRange(
      this.hazardSpawnConfig.initialDelayMin,
      this.hazardSpawnConfig.initialDelayMax
    )
    this.nextTrapSpawnTime = this.startTime + this.randomRange(
      this.trapSpawnConfig.initialDelayMin,
      this.trapSpawnConfig.initialDelayMax
    )
    
    this.isInitialized = true
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: DynamicSpawnCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Update spawns - call every frame
   */
  update(_deltaTime: number): { 
    newHazards: HazardConfig[]
    removedHazards: string[]
    newTraps: TrapConfig[]
    removedTraps: string[]
  } {
    if (!this.isInitialized) {
      return { newHazards: [], removedHazards: [], newTraps: [], removedTraps: [] }
    }

    const currentTime = Date.now() / 1000
    const newHazards: HazardConfig[] = []
    const removedHazards: string[] = []
    const newTraps: TrapConfig[] = []
    const removedTraps: string[] = []

    // Check for hazard despawns
    for (const [id, hazard] of this.hazards) {
      if (hazard.isActive && currentTime >= hazard.despawnTime) {
        hazard.isActive = false
        removedHazards.push(id)
        this.callbacks.onHazardDespawned?.(id)
      }
    }

    // Check for trap despawns
    for (const [id, trap] of this.traps) {
      if (trap.isActive && currentTime >= trap.despawnTime) {
        trap.isActive = false
        removedTraps.push(id)
        this.callbacks.onTrapDespawned?.(id)
      }
    }

    // Clean up inactive spawns
    for (const [id, hazard] of this.hazards) {
      if (!hazard.isActive) this.hazards.delete(id)
    }
    for (const [id, trap] of this.traps) {
      if (!trap.isActive) this.traps.delete(id)
    }

    // Spawn new hazards
    if (currentTime >= this.nextHazardSpawnTime) {
      const activeCount = this.getActiveHazardCount()
      if (activeCount < this.hazardSpawnConfig.maxConcurrent) {
        const config = this.spawnRandomHazard(currentTime)
        if (config) {
          newHazards.push(config)
          this.callbacks.onHazardSpawned?.(config)
        }
      }
      // Schedule next spawn
      this.nextHazardSpawnTime = currentTime + this.randomRange(
        this.hazardSpawnConfig.respawnDelayMin,
        this.hazardSpawnConfig.respawnDelayMax
      )
    }

    // Spawn new traps
    if (currentTime >= this.nextTrapSpawnTime) {
      const activeCount = this.getActiveTrapCount()
      if (activeCount < this.trapSpawnConfig.maxConcurrent) {
        const config = this.spawnRandomTrap(currentTime)
        if (config) {
          newTraps.push(config)
          this.callbacks.onTrapSpawned?.(config)
        }
      }
      // Schedule next spawn
      this.nextTrapSpawnTime = currentTime + this.randomRange(
        this.trapSpawnConfig.respawnDelayMin,
        this.trapSpawnConfig.respawnDelayMax
      )
    }

    return { newHazards, removedHazards, newTraps, removedTraps }
  }

  /**
   * Get all active hazard configs
   */
  getActiveHazards(): HazardConfig[] {
    return Array.from(this.hazards.values())
      .filter(h => h.isActive)
      .map(h => h.config)
  }

  /**
   * Get all active trap configs
   */
  getActiveTraps(): TrapConfig[] {
    return Array.from(this.traps.values())
      .filter(t => t.isActive)
      .map(t => t.config)
  }

  private getActiveHazardCount(): number {
    return Array.from(this.hazards.values()).filter(h => h.isActive).length
  }

  private getActiveTrapCount(): number {
    return Array.from(this.traps.values()).filter(t => t.isActive).length
  }

  private spawnRandomHazard(currentTime: number): HazardConfig | null {
    const position = this.findValidSpawnPosition(80) // 80px hazard size
    if (!position) return null

    const id = `dyn_hazard_${this.nextHazardId++}`
    const hazardTypes: Array<'slow' | 'damage' | 'emp'> = ['slow', 'slow', 'damage', 'emp']
    const type = hazardTypes[Math.floor(Math.random() * hazardTypes.length)]
    
    let intensity: number
    switch (type) {
      case 'slow': intensity = 0.4 + Math.random() * 0.2; break // 0.4-0.6
      case 'damage': intensity = 8 + Math.random() * 7; break   // 8-15 dps
      case 'emp': intensity = 1; break
    }

    const config: HazardConfig = {
      id,
      type,
      bounds: { x: position.x, y: position.y, width: 80, height: 80 },
      intensity
    }

    const lifetime = this.randomRange(
      this.hazardSpawnConfig.lifetimeMin,
      this.hazardSpawnConfig.lifetimeMax
    )

    this.hazards.set(id, {
      id,
      config,
      spawnTime: currentTime,
      despawnTime: currentTime + lifetime,
      isActive: true
    })

    return config
  }

  private spawnRandomTrap(currentTime: number): TrapConfig | null {
    const position = this.findValidSpawnPosition(40) // 40px trap radius
    if (!position) return null

    const id = `dyn_trap_${this.nextTrapId++}`
    const effects: TrapEffect[] = ['damage_burst', 'knockback', 'stun']
    const effect = effects[Math.floor(Math.random() * effects.length)]
    
    let effectValue: number
    switch (effect) {
      case 'damage_burst': effectValue = 30 + Math.random() * 30; break // 30-60
      case 'knockback': effectValue = 150 + Math.random() * 100; break  // 150-250
      case 'stun': effectValue = 0.3 + Math.random() * 0.4; break       // 0.3-0.7s
    }

    const config: TrapConfig = {
      id,
      type: 'pressure',
      position: { x: position.x + 40, y: position.y + 40 }, // Center position
      radius: 35 + Math.random() * 15, // 35-50px
      effect,
      effectValue,
      cooldown: 8 + Math.random() * 7 // 8-15s
    }

    const lifetime = this.randomRange(
      this.trapSpawnConfig.lifetimeMin,
      this.trapSpawnConfig.lifetimeMax
    )

    this.traps.set(id, {
      id,
      config,
      spawnTime: currentTime,
      despawnTime: currentTime + lifetime,
      isActive: true
    })

    return config
  }

  private findValidSpawnPosition(size: number, maxAttempts = 20): Vector2 | null {
    for (let i = 0; i < maxAttempts; i++) {
      // Pick a random spawn zone
      const zone = SPAWN_ZONES[Math.floor(Math.random() * SPAWN_ZONES.length)]
      
      // Random position within zone
      const x = zone.x + Math.random() * (zone.width - size)
      const y = zone.y + Math.random() * (zone.height - size)
      const position = { x, y }

      // Check exclusion zones
      if (this.isValidPosition(position, size)) {
        return position
      }
    }
    return null
  }

  private isValidPosition(position: Vector2, size: number): boolean {
    const center = { x: position.x + size / 2, y: position.y + size / 2 }

    // Check exclusion zones (teleporters, jump pads)
    for (const zone of this.exclusionZones) {
      const dx = center.x - zone.position.x
      const dy = center.y - zone.position.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < zone.radius + size) return false
    }

    // Check existing hazards
    for (const hazard of this.hazards.values()) {
      if (!hazard.isActive) continue
      const hCenter = {
        x: hazard.config.bounds.x + hazard.config.bounds.width / 2,
        y: hazard.config.bounds.y + hazard.config.bounds.height / 2
      }
      const dx = center.x - hCenter.x
      const dy = center.y - hCenter.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < size + 60) return false // Min 60px apart
    }

    // Check existing traps
    for (const trap of this.traps.values()) {
      if (!trap.isActive) continue
      const dx = center.x - trap.config.position.x
      const dy = center.y - trap.config.position.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < size + 60) return false
    }

    return true
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }
}
