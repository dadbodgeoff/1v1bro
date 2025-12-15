/**
 * CelestialManager - Manages planets, asteroids, and other space objects
 * Object pooling, procedural placement, and lifecycle management
 */

import * as THREE from 'three'
import type { CelestialObject, CelestialType, CelestialSpawnConfig } from './types'

/**
 * Default spawn configurations for celestial objects
 * Scales reduced ~50% total from original for better visual balance
 */
const DEFAULT_SPAWN_CONFIGS: CelestialSpawnConfig[] = [
  {
    type: 'planet-volcanic',
    weight: 1.5,
    minScale: 18,
    maxScale: 31,
    minDistance: 25,
    maxDistance: 50,
    rotationSpeedRange: [0.05, 0.15],
  },
  {
    type: 'planet-ice',
    weight: 1.5,
    minScale: 16,
    maxScale: 26,
    minDistance: 25,
    maxDistance: 50,
    rotationSpeedRange: [0.03, 0.1],
  },
  {
    type: 'planet-gas-giant',
    weight: 1.2,
    minScale: 26,
    maxScale: 44,
    minDistance: 40,
    maxDistance: 70,
    rotationSpeedRange: [0.02, 0.08],
  },
  {
    type: 'planet-earth-like',
    weight: 1.2,
    minScale: 14,
    maxScale: 22,
    minDistance: 22,
    maxDistance: 45,
    rotationSpeedRange: [0.04, 0.12],
  },
  {
    type: 'asteroid-cluster',
    weight: 1.5,
    minScale: 6,
    maxScale: 14,
    minDistance: 15,
    maxDistance: 30,
    rotationSpeedRange: [0.1, 0.3],
  },
  {
    type: 'space-station',
    weight: 1.0,
    minScale: 9,
    maxScale: 16,
    minDistance: 18,
    maxDistance: 35,
    rotationSpeedRange: [0.02, 0.05],
  },
  {
    type: 'comet',
    weight: 1.2,
    minScale: 6,
    maxScale: 11,
    minDistance: 15,
    maxDistance: 30,
    rotationSpeedRange: [0.05, 0.15],
  },
  // New epic celestials - rarer but more impactful
  {
    type: 'space-whale',
    weight: 0.4, // Very rare
    minScale: 21,
    maxScale: 37,
    minDistance: 30,
    maxDistance: 60,
    rotationSpeedRange: [0.01, 0.03], // Slow majestic movement
  },
  {
    type: 'ring-portal',
    weight: 0.5, // Rare
    minScale: 26,
    maxScale: 42,
    minDistance: 25,
    maxDistance: 45,
    rotationSpeedRange: [0.02, 0.06],
  },
  {
    type: 'crystal-formation',
    weight: 0.8, // Uncommon
    minScale: 13,
    maxScale: 23,
    minDistance: 20,
    maxDistance: 40,
    rotationSpeedRange: [0.03, 0.08],
  },
  {
    type: 'orbital-defense',
    weight: 0.6, // Rare
    minScale: 16,
    maxScale: 26,
    minDistance: 25,
    maxDistance: 45,
    rotationSpeedRange: [0.04, 0.1], // Rotating radar dishes
  },
  {
    type: 'derelict-ship',
    weight: 0.5, // Rare
    minScale: 23,
    maxScale: 39,
    minDistance: 35,
    maxDistance: 60,
    rotationSpeedRange: [0.005, 0.02], // Slow tumble
  },
]

/**
 * Placeholder geometry for celestial objects before models load
 */
function createPlaceholderGeometry(type: CelestialType): THREE.Mesh {
  let geometry: THREE.BufferGeometry
  let material: THREE.Material

  switch (type) {
    case 'planet-volcanic':
      geometry = new THREE.IcosahedronGeometry(1, 1)
      material = new THREE.MeshBasicMaterial({ 
        color: 0xff4400, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'planet-ice':
      geometry = new THREE.IcosahedronGeometry(1, 1)
      material = new THREE.MeshBasicMaterial({ 
        color: 0x88ccff, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'planet-gas-giant':
      geometry = new THREE.IcosahedronGeometry(1, 1)
      material = new THREE.MeshBasicMaterial({ 
        color: 0xffaa44, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'planet-earth-like':
      geometry = new THREE.IcosahedronGeometry(1, 1)
      material = new THREE.MeshBasicMaterial({ 
        color: 0x44aa88, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'asteroid-cluster':
      geometry = new THREE.OctahedronGeometry(1, 0)
      material = new THREE.MeshBasicMaterial({ 
        color: 0x888888, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'space-station':
      geometry = new THREE.BoxGeometry(1, 0.3, 2)
      material = new THREE.MeshBasicMaterial({ 
        color: 0xcccccc, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'comet':
      geometry = new THREE.ConeGeometry(0.5, 2, 6)
      material = new THREE.MeshBasicMaterial({ 
        color: 0x66ddff, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'space-whale':
      geometry = new THREE.CapsuleGeometry(0.8, 2, 4, 8)
      material = new THREE.MeshBasicMaterial({ 
        color: 0x8866ff, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'ring-portal':
      geometry = new THREE.TorusGeometry(1, 0.2, 8, 24)
      material = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'crystal-formation':
      geometry = new THREE.OctahedronGeometry(1, 0)
      material = new THREE.MeshBasicMaterial({ 
        color: 0xaa44ff, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'orbital-defense':
      geometry = new THREE.CylinderGeometry(0.5, 1, 1.5, 6)
      material = new THREE.MeshBasicMaterial({ 
        color: 0xff6644, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    case 'derelict-ship':
      geometry = new THREE.BoxGeometry(2, 0.5, 1)
      material = new THREE.MeshBasicMaterial({ 
        color: 0x666666, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      break
    default:
      geometry = new THREE.SphereGeometry(1, 8, 8)
      material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
  }

  return new THREE.Mesh(geometry, material)
}

export class CelestialManager {
  private scene: THREE.Scene
  private objects: CelestialObject[] = []
  private pool: Map<CelestialType, CelestialObject[]> = new Map()
  private loadedModels: Map<CelestialType, THREE.Group> = new Map()
  private spawnConfigs: CelestialSpawnConfig[]
  private totalWeight: number = 0
  
  private nextId: number = 0
  private lastSpawnZ: number = 0
  private spawnInterval: number = 180 // Distance between spawns (optimized)
  private maxActive: number = 5 // Reduced for better FPS - still feels populated
  private despawnDistance: number = 100 // Behind player

  constructor(scene: THREE.Scene, configs: CelestialSpawnConfig[] = DEFAULT_SPAWN_CONFIGS) {
    this.scene = scene
    this.spawnConfigs = configs
    
    // Calculate total weight for weighted random
    this.totalWeight = configs.reduce((sum, c) => sum + c.weight, 0)
    
    // Initialize pools
    configs.forEach(config => {
      this.pool.set(config.type, [])
    })
  }

  /**
   * Register a loaded model for a celestial type
   */
  registerModel(type: CelestialType, model: THREE.Group): void {
    this.loadedModels.set(type, model)
    
    // Update any existing placeholders with real models
    this.objects.forEach(obj => {
      if (obj.type === type && obj.mesh) {
        this.upgradeToRealModel(obj)
      }
    })
  }

  /**
   * Upgrade a placeholder to real model
   */
  private upgradeToRealModel(obj: CelestialObject): void {
    const model = this.loadedModels.get(obj.type)
    if (!model || !obj.mesh) return

    // Store transform
    const position = obj.mesh.position.clone()
    const rotation = obj.mesh.rotation.clone()
    const scale = obj.mesh.scale.x

    // Remove placeholder
    this.scene.remove(obj.mesh)
    if (obj.mesh instanceof THREE.Mesh) {
      obj.mesh.geometry.dispose()
      if (obj.mesh.material instanceof THREE.Material) {
        obj.mesh.material.dispose()
      }
    }

    // Create real model instance
    const newMesh = model.clone()
    newMesh.position.copy(position)
    newMesh.rotation.copy(rotation)
    newMesh.scale.setScalar(scale)

    // Apply enterprise rendering optimizations
    this.applyRenderOptimizations(newMesh)

    obj.mesh = newMesh
    this.scene.add(newMesh)
  }

  /**
   * Apply enterprise-grade rendering optimizations to celestial objects
   */
  private applyRenderOptimizations(mesh: THREE.Object3D): void {
    mesh.frustumCulled = true // Cull when off-screen
    mesh.renderOrder = -5 // Behind track/player, in front of stars

    mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.frustumCulled = true
        child.castShadow = false // Background objects don't cast shadows
        child.receiveShadow = false

        // Optimize materials for distant objects
        if (child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material]
          materials.forEach(mat => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.envMapIntensity = 0.4 // Reduce reflection work
            }
            mat.fog = false // Celestials don't need fog
          })
        }
      }
    })
  }

  /**
   * Select random celestial type based on weights
   */
  private selectRandomType(): CelestialSpawnConfig {
    let random = Math.random() * this.totalWeight
    
    for (const config of this.spawnConfigs) {
      random -= config.weight
      if (random <= 0) {
        return config
      }
    }
    
    return this.spawnConfigs[0]
  }

  /**
   * Acquire object from pool or create new
   */
  private acquireObject(type: CelestialType): CelestialObject {
    const pool = this.pool.get(type)
    
    if (pool && pool.length > 0) {
      return pool.pop()!
    }
    
    // Create new object
    const obj: CelestialObject = {
      id: `celestial-${this.nextId++}`,
      type,
      mesh: null,
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      rotationSpeed: new THREE.Vector3(),
      scale: 1,
      spawnDistance: 0,
      passedPlayer: false,
    }
    
    return obj
  }

  /**
   * Release object back to pool
   */
  private releaseObject(obj: CelestialObject): void {
    if (obj.mesh) {
      this.scene.remove(obj.mesh)
    }
    
    obj.passedPlayer = false
    
    const pool = this.pool.get(obj.type)
    if (pool) {
      pool.push(obj)
    }
  }

  /**
   * Spawn a celestial object
   */
  private spawnObject(_playerZ: number): void {
    if (this.objects.length >= this.maxActive) return
    
    const config = this.selectRandomType()
    const obj = this.acquireObject(config.type)
    
    // Random position in sky - can be overhead, left, or right
    const positionType = Math.random()
    let xPos: number
    let height: number
    const distance = config.minDistance + Math.random() * (config.maxDistance - config.minDistance)

    if (positionType < 0.3) {
      // Overhead (center-ish, high up)
      xPos = (Math.random() - 0.5) * 30 // -15 to +15
      height = 35 + Math.random() * 30 // 35 to 65 (high overhead)
    } else if (positionType < 0.65) {
      // Left side
      xPos = -(distance * 0.7 + Math.random() * distance * 0.3)
      height = 15 + Math.random() * 35 // 15 to 50
    } else {
      // Right side
      xPos = distance * 0.7 + Math.random() * distance * 0.3
      height = 15 + Math.random() * 35 // 15 to 50
    }
    
    obj.position.set(
      xPos,
      height,
      this.lastSpawnZ - this.spawnInterval
    )
    
    obj.scale = config.minScale + Math.random() * (config.maxScale - config.minScale)
    obj.spawnDistance = obj.position.z
    
    // Random rotation speed
    const [minRot, maxRot] = config.rotationSpeedRange
    obj.rotationSpeed.set(
      (Math.random() - 0.5) * (maxRot - minRot) + minRot,
      (Math.random() - 0.5) * (maxRot - minRot) + minRot,
      (Math.random() - 0.5) * (maxRot - minRot) + minRot
    )
    
    // Create mesh (real model or placeholder)
    const model = this.loadedModels.get(config.type)
    if (model) {
      obj.mesh = model.clone()
      // Apply enterprise rendering optimizations to real models
      this.applyRenderOptimizations(obj.mesh)
    } else {
      obj.mesh = createPlaceholderGeometry(config.type)
    }

    obj.mesh.position.copy(obj.position)
    obj.mesh.scale.setScalar(obj.scale)

    this.scene.add(obj.mesh)
    this.objects.push(obj)

    this.lastSpawnZ = obj.position.z
  }

  /**
   * Update celestial objects
   */
  update(delta: number, playerZ: number): void {
    // Spawn new objects ahead of player
    const spawnThreshold = playerZ - 500
    
    while (this.lastSpawnZ > spawnThreshold && this.objects.length < this.maxActive) {
      this.spawnObject(playerZ)
    }
    
    // Update existing objects
    let writeIndex = 0
    
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i]
      
      // Check if passed player (for events)
      if (!obj.passedPlayer && obj.position.z > playerZ) {
        obj.passedPlayer = true
        // Could emit event here
      }
      
      // Despawn if too far behind
      if (obj.position.z > playerZ + this.despawnDistance) {
        this.releaseObject(obj)
        continue
      }
      
      // Rotate
      if (obj.mesh) {
        obj.mesh.rotation.x += obj.rotationSpeed.x * delta
        obj.mesh.rotation.y += obj.rotationSpeed.y * delta
        obj.mesh.rotation.z += obj.rotationSpeed.z * delta
      }
      
      // Keep object
      if (writeIndex !== i) {
        this.objects[writeIndex] = obj
      }
      writeIndex++
    }
    
    this.objects.length = writeIndex
  }

  /**
   * Get count of active celestials
   */
  getActiveCount(): number {
    return this.objects.length
  }

  /**
   * Get count of celestials passed
   */
  getCelestialsPassed(): number {
    return this.objects.filter(o => o.passedPlayer).length
  }

  /**
   * Get active comet positions (for comet tail particles)
   */
  getCometPositions(): THREE.Vector3[] {
    return this.objects
      .filter(obj => obj.type === 'comet' && obj.mesh)
      .map(obj => obj.position)
  }

  /**
   * Set spawn interval (distance between spawns)
   */
  setSpawnInterval(interval: number): void {
    this.spawnInterval = interval
  }

  /**
   * Set max active celestials
   */
  setMaxActive(max: number): void {
    this.maxActive = max
  }

  /**
   * Reset manager
   */
  reset(): void {
    // Return all objects to pool
    this.objects.forEach(obj => this.releaseObject(obj))
    this.objects = []
    this.lastSpawnZ = 0
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.objects.forEach(obj => {
      if (obj.mesh) {
        this.scene.remove(obj.mesh)
        if (obj.mesh instanceof THREE.Mesh) {
          obj.mesh.geometry.dispose()
          if (obj.mesh.material instanceof THREE.Material) {
            obj.mesh.material.dispose()
          }
        }
      }
    })
    
    this.objects = []
    this.pool.clear()
    this.loadedModels.clear()
  }
}
