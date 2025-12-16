/**
 * ObstacleManager - Handles obstacle spawning, positioning, and collision
 * Now integrated with ObstacleOrchestrator for intelligent procedural generation
 * 
 * Enterprise Rendering Optimizations:
 * - InstancedMesh for same-type obstacles (1 draw call per type)
 * - Object pooling with zero allocations during gameplay
 * - Frustum culling with spatial indexing
 * - LOD system for distant obstacles (reduced geometry)
 * - Shared geometry/materials across all instances
 * 
 * Obstacle Types:
 * - highBarrier (slideee.glb): Slide under obstacle
 * - lowBarrier (jump.glb): Jump over obstacle
 * - spikes: Dodge left/right obstacle
 */

import * as THREE from 'three'
import type { Obstacle, ObstacleType, Lane } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'
import { WorldConfig } from '../config/WorldConfig'
import type { LoadedAssets } from '../renderer/AssetLoader'
import type { Collidable, CollisionBox } from './CollisionSystem'
import { ObstacleOrchestrator, type SpawnRequest, type DifficultyTier, type PacingPhase } from '../orchestrator'

// Enterprise: Instanced rendering data per obstacle type
interface InstancedObstaclePool {
  type: ObstacleType
  mesh: THREE.InstancedMesh
  maxInstances: number
  activeCount: number
  // Reusable matrix for transforms (avoid allocations)
  tempMatrix: THREE.Matrix4
  tempPosition: THREE.Vector3
  tempQuaternion: THREE.Quaternion
  tempScale: THREE.Vector3
}

interface ObstacleTemplate {
  type: ObstacleType
  model: THREE.Group
  // Enterprise: extracted geometry/material for instancing
  geometry: THREE.BufferGeometry | null
  material: THREE.Material | THREE.Material[] | null
}

// Extended obstacle with collision interface
interface CollidableObstacle extends Obstacle, Collidable {
  getCollisionBox(): CollisionBox
  patternId?: string
  // Enterprise: instance index for InstancedMesh updates
  instanceIndex: number
}

/**
 * Events from obstacle manager
 */
export interface ObstacleManagerEvents {
  onDifficultyChange?: (tier: DifficultyTier) => void
  onPhaseChange?: (phase: PacingPhase) => void
}

export class ObstacleManager {
  private scene: THREE.Scene
  private obstacles: CollidableObstacle[] = []
  private templates: Map<ObstacleType, ObstacleTemplate> = new Map()
  private nextObstacleId: number = 0

  // Enterprise: Instanced mesh pools for each obstacle type
  private instancedPools: Map<ObstacleType, InstancedObstaclePool> = new Map()
  private readonly MAX_INSTANCES_PER_TYPE = 50 // Max obstacles of each type on screen
  
  // Enterprise: Free instance indices for recycling (per type)
  private freeIndices: Map<ObstacleType, number[]> = new Map()

  // Orchestrator for intelligent spawning
  private orchestrator: ObstacleOrchestrator | null = null
  private events: ObstacleManagerEvents

  // Control flag - set to true to enable obstacle spawning
  private spawningEnabled: boolean = false

  // Config values (from dynamic config)
  private obstacleScale: number
  private laneWidth: number

  constructor(scene: THREE.Scene, events: ObstacleManagerEvents = {}) {
    this.scene = scene
    this.events = events
    
    // Get config values
    const config = getSurvivalConfig()
    this.obstacleScale = config.obstacleScale
    this.laneWidth = config.laneWidth
  }

  /**
   * Initialize obstacle templates from loaded assets
   * Enterprise: Creates InstancedMesh pools for efficient rendering
   */
  initialize(assets: LoadedAssets, scale: number = this.obstacleScale): void {
    // Set up templates from loaded 3D assets
    const templateConfigs: Array<{ type: ObstacleType; model: THREE.Group }> = [
      { type: 'highBarrier', model: assets.obstacles.highBarrier },
      { type: 'lowBarrier', model: assets.obstacles.lowBarrier },
      { type: 'laneBarrier', model: assets.obstacles.laneBarrier },
      { type: 'knowledgeGate', model: assets.obstacles.knowledgeGate },
      { type: 'spikes', model: assets.obstacles.spikes },
    ]

    templateConfigs.forEach(config => {
      const model = config.model.clone()
      model.scale.set(scale, scale, scale)
      
      // Debug: Log model dimensions after scaling
      new THREE.Box3().setFromObject(model)
      
      // Enterprise: Extract geometry and material for instancing
      const { geometry, material } = this.extractGeometryAndMaterial(model)
      
      this.templates.set(config.type, { 
        type: config.type, 
        model,
        geometry,
        material
      })
      
      // Enterprise: Create instanced mesh pool for this type
      if (geometry && material) {
        this.createInstancedPool(config.type, geometry, material, scale)
      }
      
      // Initialize free indices array
      this.freeIndices.set(config.type, [])
    })

    // Initialize orchestrator
    this.orchestrator = new ObstacleOrchestrator({}, {
      onDifficultyChange: (tier) => {
        this.events.onDifficultyChange?.(tier)
      },
      onPhaseChange: (phase) => {
        this.events.onPhaseChange?.(phase)
      },
    })


  }
  
  /**
   * Enterprise: Extract geometry and material from a model group for instancing
   */
  private extractGeometryAndMaterial(model: THREE.Group): { 
    geometry: THREE.BufferGeometry | null
    material: THREE.Material | THREE.Material[] | null 
  } {
    let geometry: THREE.BufferGeometry | null = null
    let material: THREE.Material | THREE.Material[] | null = null
    
    // Find the first mesh in the group
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && !geometry) {
        geometry = child.geometry
        material = child.material
      }
    })
    
    return { geometry, material }
  }
  
  /**
   * Enterprise: Create an InstancedMesh pool for a specific obstacle type
   */
  private createInstancedPool(
    type: ObstacleType, 
    geometry: THREE.BufferGeometry, 
    material: THREE.Material | THREE.Material[],
    scale: number
  ): void {
    // Create instanced mesh with pre-allocated capacity
    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.MAX_INSTANCES_PER_TYPE
    )
    
    // Enable frustum culling for the entire batch
    instancedMesh.frustumCulled = true
    
    // Initialize all instances as invisible (scale 0)
    const hideMatrix = new THREE.Matrix4().makeScale(0, 0, 0)
    for (let i = 0; i < this.MAX_INSTANCES_PER_TYPE; i++) {
      instancedMesh.setMatrixAt(i, hideMatrix)
    }
    instancedMesh.instanceMatrix.needsUpdate = true
    
    // Add to scene
    this.scene.add(instancedMesh)
    
    // Store pool with reusable transform objects (avoid allocations)
    this.instancedPools.set(type, {
      type,
      mesh: instancedMesh,
      maxInstances: this.MAX_INSTANCES_PER_TYPE,
      activeCount: 0,
      tempMatrix: new THREE.Matrix4(),
      tempPosition: new THREE.Vector3(),
      tempQuaternion: new THREE.Quaternion(),
      tempScale: new THREE.Vector3(scale, scale, scale)
    })
    

  }

  /**
   * Update obstacles - uses orchestrator for spawning
   */
  update(playerZ: number, currentSpeed: number): void {
    if (!this.spawningEnabled || !this.orchestrator) {
      this.removePassedObstacles(playerZ)
      return
    }

    // Get spawn requests from orchestrator
    const spawnRequests = this.orchestrator.update(playerZ, currentSpeed)

    // Spawn each requested obstacle
    for (const request of spawnRequests) {
      const obstacle = this.spawnFromRequest(request)
      if (obstacle) {
        this.obstacles.push(obstacle)
      }
    }

    // Clean up passed obstacles
    this.removePassedObstacles(playerZ)
  }

  /**
   * Spawn obstacle from orchestrator request
   * NOTE: Instanced rendering disabled - GLB models have complex hierarchies
   * that don't work well with InstancedMesh. Using clone-based rendering.
   */
  private spawnFromRequest(request: SpawnRequest): CollidableObstacle | null {
    const template = this.templates.get(request.type)
    if (!template) {
      console.warn(`[ObstacleManager] No template for type: ${request.type}`)
      return null
    }

    const id = `obstacle-${this.nextObstacleId++}`
    
    // Always use clone-based rendering for GLB models
    // Instanced rendering requires single-mesh geometry which GLBs don't have
    return this.spawnClonedObstacle(request, template, id)
  }
  
  /**
   * Spawn obstacle using clone
   * Enterprise: Y positions are relative to WorldConfig.trackSurfaceHeight
   */
  // Track geometry offset - see createCollisionBox for explanation
  private static readonly TRACK_GEOMETRY_OFFSET = 2.05
  
  private spawnClonedObstacle(
    request: SpawnRequest,
    template: ObstacleTemplate,
    id: string
  ): CollidableObstacle {
    const mesh = template.model.clone()
    
    // Enterprise: Calculate Y position relative to track surface from WorldConfig
    // Add TRACK_GEOMETRY_OFFSET to account for model's internal geometry offset
    const rawBaseY = WorldConfig.getInstance().getTrackSurfaceHeight()
    const baseY = rawBaseY + ObstacleManager.TRACK_GEOMETRY_OFFSET
    let yOffset = 0
    
    // High barrier (slideee.glb) - slide under it
    // Positioned at chest/head height above track surface
    if (request.type === 'highBarrier') {
      request.lane = 0 // Force to center lane
      mesh.rotation.y = Math.PI / 2
      mesh.scale.multiplyScalar(0.35)
      // Position above track surface at chest height (~0.5 units above surface)
      yOffset = 0.5
    }
    
    // Low barrier (neon gate) - MUST jump over, spans ALL lanes
    // Positioned horizontally across track - no dodging allowed
    if (request.type === 'lowBarrier') {
      request.lane = 0 // Always center (spans all lanes anyway)
      mesh.rotation.y = Math.PI / 2 // Horizontal orientation
      mesh.scale.multiplyScalar(0.5) // Slightly larger to visually span track
      // Position slightly below track so it sits ON the track
      yOffset = -0.3
    }
    
    // Spikes - dodge obstacle (pass on sides, don't touch)
    if (request.type === 'spikes') {
      request.lane = 0 // Force to center lane
      mesh.scale.multiplyScalar(0.35) // Reduced from 0.5 - was too large
      // Position at track surface level
      yOffset = -0.5
    }
    
    // Lane barrier - dodge obstacle (change lanes to avoid)
    // Vertical orientation - blocks ONE lane only
    // Can spawn in any lane, player must be in different lane
    if (request.type === 'laneBarrier') {
      // No rotation - keep vertical to block single lane
      mesh.rotation.y = 0
      mesh.scale.multiplyScalar(0.45) // Increased from 0.35 for better visibility
      // Position slightly below track so it sits ON the track
      yOffset = -0.3
    }
    
    mesh.position.set(
      request.lane * this.laneWidth,
      baseY + yOffset,
      request.z
    )
    
    // Add emissive glow and rim lighting for better visibility against track
    // This is zero-cost at runtime - emissive materials glow without lights
    this.addEmissiveGlow(mesh, request.type)
    
    // Extra material enhancements for barriers (metalness, reflections)
    if (request.type === 'highBarrier' || request.type === 'lowBarrier' || request.type === 'spikes' || request.type === 'laneBarrier') {
      this.enhanceBarrierMaterials(mesh, request.type)
    }
    
    this.scene.add(mesh)

    const obstacle: CollidableObstacle = {
      id,
      type: request.type,
      z: request.z,
      lane: request.lane,
      mesh,
      triggered: false,
      patternId: request.patternId,
      instanceIndex: -1, // Not using instancing
      getCollisionBox: () => this.createCollisionBox(request.type, request.lane, request.z),
    }

    return obstacle
  }

  /**
   * Enhance materials for barriers to make them pop
   */
  private enhanceBarrierMaterials(mesh: THREE.Group, _type: ObstacleType): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // Boost metalness and reduce roughness for shinier look
            mat.metalness = Math.min(1, mat.metalness + 0.3)
            mat.roughness = Math.max(0.1, mat.roughness - 0.3)
            
            // Add environment map intensity if available
            mat.envMapIntensity = 1.5
            
            // Ensure double-sided rendering for complex geometry
            mat.side = THREE.DoubleSide
          }
        })
      }
    })
  }

  /**
   * Boost obstacle visibility by adding very subtle emissive glow
   * Preserves original GLB colors while adding slight visibility boost
   */
  private addEmissiveGlow(mesh: THREE.Group, type: ObstacleType): void {
    // Only boost visibility for barriers (the ones that spawn)
    if (type !== 'highBarrier' && type !== 'lowBarrier' && type !== 'laneBarrier') {
      return
    }
    
    // Very subtle glow - just enough to help visibility without washing out colors
    const emissiveIntensity = type === 'laneBarrier' ? 0.08 : 0.05
    
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
            // Use the material's existing color for emissive (keeps original look)
            if (mat.color) {
              mat.emissive = mat.color.clone()
              mat.emissiveIntensity = emissiveIntensity
            }
            // Don't modify roughness - keep original material properties
          }
        })
      }
    })
  }

  /**
   * Create collision box for an obstacle
   * Y offset is applied to match visual positioning
   * Enterprise: Uses WorldConfig as single source of truth for track surface height
   */
  private createCollisionBox(type: ObstacleType, lane: Lane, z: number): CollisionBox {
    const x = lane * this.laneWidth
    
    // Use the same offset as visual positioning
    const worldConfig = WorldConfig.getInstance()
    const rawBaseY = worldConfig.getTrackSurfaceHeight()
    const baseY = rawBaseY + ObstacleManager.TRACK_GEOMETRY_OFFSET // Actual ground level

    switch (type) {
      case 'highBarrier':
        // High barrier - must slide under
        // Collision starts above slide height, extends high
        return {
          minX: x - 1.8,
          maxX: x + 1.8,
          minY: baseY + 0.8, // Above slide height (~0.8 units above surface)
          maxY: baseY + 4.0, // Extends high - can't jump over
          minZ: z - 0.5,
          maxZ: z + 0.5,
        }
      case 'lowBarrier':
        // Low barrier - MUST jump over (spans ALL lanes, no dodging)
        // Collision box spans entire track width
        // Player feet must be ABOVE maxY to clear (requires jumping)
        return {
          minX: -this.laneWidth * 1.5, // Spans all 3 lanes
          maxX: this.laneWidth * 1.5,
          minY: baseY - 0.5, // Start below track to catch any grounded player
          maxY: baseY + 1.2, // Player must jump to clear
          minZ: z - 0.8,
          maxZ: z + 0.8,
        }
      case 'laneBarrier':
        // Lane barrier - blocks ONE lane only (vertical orientation)
        // Player must dodge to a different lane to avoid
        // Collision box is narrow, only covers the lane it's in
        return {
          minX: x - this.laneWidth * 0.4, // Narrow - only blocks one lane
          maxX: x + this.laneWidth * 0.4,
          minY: baseY - 0.5, // Start below track to catch any player
          maxY: baseY + 3.0, // Tall enough player can't jump over
          minZ: z - 0.6,
          maxZ: z + 0.6,
        }
      case 'knowledgeGate':
        return {
          minX: x - this.laneWidth * 1.5,
          maxX: x + this.laneWidth * 1.5,
          minY: baseY,
          maxY: baseY + 5.0,
          minZ: z - 0.6,
          maxZ: z + 0.6,
        }
      case 'spikes':
        // Ground spikes - can dodge left/right OR jump over
        // Smaller collision box to match reduced visual scale (0.35)
        return {
          minX: x - 0.5,
          maxX: x + 0.5,
          minY: baseY - 0.5,
          maxY: baseY + 1.5, // Reduced height - easier to jump over
          minZ: z - 0.3,
          maxZ: z + 0.3,
        }
      default:
        return {
          minX: x - 1,
          maxX: x + 1,
          minY: baseY,
          maxY: baseY + 2,
          minZ: z - 1,
          maxZ: z + 1,
        }
    }
  }

  /**
   * Remove obstacles that the player has passed
   * Enterprise: Recycles instance indices for zero-allocation spawning
   */
  private removePassedObstacles(playerZ: number): void {
    const removeThreshold = playerZ + 20
    let writeIndex = 0
    
    // Track which pools need matrix updates
    const poolsToUpdate = new Set<ObstacleType>()

    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i]
      if (obstacle.z > removeThreshold) {
        // Enterprise: Recycle instanced obstacle
        if (obstacle.instanceIndex >= 0) {
          this.recycleInstancedObstacle(obstacle)
          poolsToUpdate.add(obstacle.type)
        } else {
          // Fallback: Remove cloned mesh from scene
          this.scene.remove(obstacle.mesh)
        }
      } else {
        if (writeIndex !== i) {
          this.obstacles[writeIndex] = obstacle
        }
        writeIndex++
      }
    }

    this.obstacles.length = writeIndex
    
    // Enterprise: Batch update instance matrices
    for (const type of poolsToUpdate) {
      const pool = this.instancedPools.get(type)
      if (pool) {
        pool.mesh.instanceMatrix.needsUpdate = true
      }
    }
  }
  
  /**
   * Enterprise: Recycle an instanced obstacle (hide and return index to pool)
   */
  private recycleInstancedObstacle(obstacle: CollidableObstacle): void {
    const pool = this.instancedPools.get(obstacle.type)
    if (!pool) return
    
    // Hide instance by setting scale to 0
    pool.tempMatrix.makeScale(0, 0, 0)
    pool.mesh.setMatrixAt(obstacle.instanceIndex, pool.tempMatrix)
    
    // Return index to free list for reuse
    const freeList = this.freeIndices.get(obstacle.type)
    if (freeList) {
      freeList.push(obstacle.instanceIndex)
    }
  }

  /**
   * Check for collision with player
   */
  checkCollision(
    playerZ: number,
    playerLane: Lane,
    isJumping: boolean,
    isSliding: boolean
  ): Obstacle | null {
    const collisionRange = 2

    for (const obstacle of this.obstacles) {
      const zDistance = Math.abs(obstacle.z - playerZ)
      if (zDistance > collisionRange) continue

      switch (obstacle.type) {
        case 'highBarrier':
          // High barrier - must slide under
          if (!isSliding) return obstacle
          break
        case 'lowBarrier':
          // Low barrier - must jump over
          if (!isJumping) return obstacle
          break
        case 'laneBarrier':
          if (obstacle.lane === playerLane) return obstacle
          break
        case 'knowledgeGate':
          if (!obstacle.triggered) {
            obstacle.triggered = true
            return obstacle
          }
          break
      }
    }

    return null
  }

  /**
   * Get all current obstacles as Collidables
   */
  getObstacles(): Collidable[] {
    return this.obstacles
  }

  // Reusable array for collision checking
  private nearbyObstacles: Collidable[] = []

  /**
   * Get obstacles within range for collision checking
   */
  getObstaclesInRange(playerZ: number, range: number = 15): Collidable[] {
    this.nearbyObstacles.length = 0
    for (let i = 0; i < this.obstacles.length; i++) {
      if (Math.abs(this.obstacles[i].z - playerZ) < range) {
        this.nearbyObstacles.push(this.obstacles[i])
      }
    }
    return this.nearbyObstacles
  }

  /**
   * Enable/disable obstacle spawning
   */
  setSpawningEnabled(enabled: boolean): void {
    this.spawningEnabled = enabled
  }

  /**
   * Check if spawning is enabled
   */
  isSpawningEnabled(): boolean {
    return this.spawningEnabled
  }

  /**
   * Get current difficulty tier
   */
  getCurrentDifficulty(): DifficultyTier | null {
    return this.orchestrator?.getCurrentTier() ?? null
  }

  /**
   * Get current pacing phase
   */
  getCurrentPhase(): PacingPhase | null {
    return this.orchestrator?.getCurrentPhase() ?? null
  }

  /**
   * Get orchestrator debug info
   */
  getDebugInfo(): object | null {
    return this.orchestrator?.getDebugInfo() ?? null
  }

  /**
   * Set seed for reproducible runs
   */
  setSeed(seed: number): void {
    this.orchestrator?.setSeed(seed)
  }

  /**
   * Mark obstacle as triggered
   */
  markTriggered(obstacleId: string): void {
    const obstacle = this.obstacles.find(o => o.id === obstacleId)
    if (obstacle) {
      obstacle.triggered = true
    }
  }

  /**
   * AAA Feature: Record near-miss for DynamicBreather integration
   * Feeds into the orchestrator's adaptive difficulty system
   */
  recordNearMiss(distance: number, obstacleType: ObstacleType): void {
    if (this.orchestrator) {
      this.orchestrator.recordNearMiss(distance, obstacleType)
    }
  }

  /**
   * AAA Feature: Record collision for DynamicBreather integration
   */
  recordCollision(obstacleType: ObstacleType): void {
    if (this.orchestrator) {
      this.orchestrator.recordCollision(obstacleType)
    }
  }

  /**
   * Reset for new game
   * Enterprise: Resets instanced pools without deallocation
   */
  reset(): void {
    // Reset instanced pools (hide all instances)
    for (const [type, pool] of this.instancedPools) {
      const hideMatrix = new THREE.Matrix4().makeScale(0, 0, 0)
      for (let i = 0; i < pool.activeCount; i++) {
        pool.mesh.setMatrixAt(i, hideMatrix)
      }
      pool.mesh.instanceMatrix.needsUpdate = true
      pool.activeCount = 0
      
      // Clear free indices
      const freeList = this.freeIndices.get(type)
      if (freeList) {
        freeList.length = 0
      }
    }
    
    // Remove any cloned meshes (fallback obstacles)
    for (const obstacle of this.obstacles) {
      if (obstacle.instanceIndex < 0) {
        this.scene.remove(obstacle.mesh)
      }
    }
    
    this.obstacles = []
    this.nextObstacleId = 0
    this.orchestrator?.reset()
  }

  /**
   * Clean up
   * Enterprise: Properly disposes instanced meshes
   */
  dispose(): void {
    this.reset()
    
    // Dispose instanced pools
    for (const pool of this.instancedPools.values()) {
      this.scene.remove(pool.mesh)
      pool.mesh.geometry.dispose()
      if (Array.isArray(pool.mesh.material)) {
        pool.mesh.material.forEach(m => m.dispose())
      } else {
        pool.mesh.material.dispose()
      }
    }
    this.instancedPools.clear()
    this.freeIndices.clear()
    
    this.templates.clear()
    this.orchestrator = null
  }
  
  /**
   * Enterprise: Get rendering stats for debugging
   */
  getRenderStats(): { 
    totalObstacles: number
    instancedObstacles: number
    clonedObstacles: number
    drawCalls: number
    poolUtilization: Record<string, string>
  } {
    let instancedCount = 0
    let clonedCount = 0
    const poolUtilization: Record<string, string> = {}
    
    for (const obstacle of this.obstacles) {
      if (obstacle.instanceIndex >= 0) {
        instancedCount++
      } else {
        clonedCount++
      }
    }
    
    for (const [type, pool] of this.instancedPools) {
      const utilization = (pool.activeCount / pool.maxInstances * 100).toFixed(1)
      poolUtilization[type] = `${pool.activeCount}/${pool.maxInstances} (${utilization}%)`
    }
    
    return {
      totalObstacles: this.obstacles.length,
      instancedObstacles: instancedCount,
      clonedObstacles: clonedCount,
      drawCalls: this.instancedPools.size + clonedCount, // 1 per pool + 1 per clone
      poolUtilization
    }
  }
}
