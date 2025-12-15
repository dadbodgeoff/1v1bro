/**
 * CollectibleManager - Handles collectible spawning, rendering, and collection
 */

import * as THREE from 'three'
import type { Collectible, CollectibleSpawnRequest } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'

export interface CollectibleManagerEvents {
  onCollect?: (collectible: Collectible) => void
  onScoreAdd?: (points: number) => void
}

export class CollectibleManager {
  private scene: THREE.Scene
  private collectibles: Collectible[] = []
  private template: THREE.Group | null = null
  private nextId: number = 0
  private events: CollectibleManagerEvents
  private spawningEnabled: boolean = false
  private readonly COLLECT_RADIUS = 1.5
  private readonly FLOAT_HEIGHT = 1.2
  private readonly FLOAT_AMPLITUDE = 0.3
  private readonly ROTATION_SPEED = 2.0
  private readonly GEM_SCALE = 0.8
  private readonly GEM_VALUE = 10
  private animationTime: number = 0
  
  // Dynamic config
  private readonly laneWidth: number

  constructor(scene: THREE.Scene, events: CollectibleManagerEvents = {}) {
    this.scene = scene
    this.events = events
    
    // Load dynamic config
    const config = getSurvivalConfig()
    this.laneWidth = config.laneWidth
  }

  initialize(gemModel: THREE.Group): void {
    this.template = gemModel.clone()
    this.template.scale.set(this.GEM_SCALE, this.GEM_SCALE, this.GEM_SCALE)
    this.addEmissiveGlow(this.template)
  }

  private addEmissiveGlow(mesh: THREE.Group): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive = new THREE.Color(0x00ffaa)
            mat.emissiveIntensity = 0.5
          }
        })
      }
    })
  }

  spawnFromRequests(requests: CollectibleSpawnRequest[]): void {
    if (!this.template || !this.spawningEnabled) return
    for (const request of requests) {
      this.spawnCollectible(request)
    }
  }


  private spawnCollectible(request: CollectibleSpawnRequest): Collectible | null {
    if (!this.template) return null
    const mesh = this.template.clone()
    const x = request.lane * this.laneWidth
    const y = request.y ?? this.FLOAT_HEIGHT
    mesh.position.set(x, y, request.z)
    this.scene.add(mesh)

    const collectible: Collectible = {
      id: `gem-${this.nextId++}`,
      type: request.type,
      z: request.z,
      lane: request.lane,
      y: y,
      mesh,
      collected: false,
      value: this.GEM_VALUE,
    }
    this.collectibles.push(collectible)
    return collectible
  }

  update(delta: number, playerX: number, playerY: number, playerZ: number): void {
    this.animationTime += delta
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i]
      if (collectible.collected) continue

      const floatOffset = Math.sin(this.animationTime * 2 + collectible.z * 0.1) * this.FLOAT_AMPLITUDE
      collectible.mesh.position.y = collectible.y + floatOffset
      collectible.mesh.rotation.y += this.ROTATION_SPEED * delta

      const dx = collectible.mesh.position.x - playerX
      const dy = collectible.mesh.position.y - playerY
      const dz = collectible.z - playerZ
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distance < this.COLLECT_RADIUS) {
        this.collect(collectible)
      }
    }
    this.removePassedCollectibles(playerZ)
  }

  private collect(collectible: Collectible): void {
    collectible.collected = true
    this.scene.remove(collectible.mesh)
    this.events.onCollect?.(collectible)
    this.events.onScoreAdd?.(collectible.value)
  }

  private removePassedCollectibles(playerZ: number): void {
    const removeThreshold = playerZ + 10
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i]
      if (collectible.z > removeThreshold) {
        if (!collectible.collected) {
          this.scene.remove(collectible.mesh)
        }
        this.collectibles.splice(i, 1)
      }
    }
  }

  setSpawningEnabled(enabled: boolean): void {
    this.spawningEnabled = enabled
  }

  getActiveCount(): number {
    return this.collectibles.filter(c => !c.collected).length
  }

  reset(): void {
    for (const collectible of this.collectibles) {
      this.scene.remove(collectible.mesh)
    }
    this.collectibles = []
    this.nextId = 0
    this.animationTime = 0
  }

  dispose(): void {
    this.reset()
    this.template = null
  }
}
