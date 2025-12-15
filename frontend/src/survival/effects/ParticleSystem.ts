/**
 * ParticleSystem - GPU-efficient particle effects for game juice
 * Handles dust, sparks, trails, and impact effects
 * 
 * Mobile Optimization:
 * - Pool sizes scale with quality profile
 * - Emission rates reduced on low-end devices
 * - Subscribes to quality changes for runtime adjustment
 */

import * as THREE from 'three'
import { COLORS } from '../config/constants'
import { getQualityProfile, onQualityChange, type QualityProfile } from '../config/quality'

// Particle types
export type ParticleEffectType = 
  | 'dust-landing'      // Dust puff on landing
  | 'dust-running'      // Continuous dust trail while running
  | 'sparks-near-miss'  // Sparks on close call
  | 'sparks-collision'  // Sparks on hit
  | 'trail-speed'       // Speed trail at high velocity
  | 'boost-burst'       // Burst effect for power-ups
  | 'engine-trail'      // Thruster exhaust behind player
  | 'dodge-sparks'      // Sparks on close dodge
  | 'perfect-burst'     // Perfect dodge burst
  | 'perfect-flash'     // Perfect dodge flash
  | 'combo-trail'       // Combo streak trail
  | 'death-burst'       // Dramatic death explosion
  | 'respawn-glow'      // Respawn energy effect

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  color: THREE.Color
  alpha: number
}

interface ParticlePool {
  particles: Particle[]
  geometry: THREE.BufferGeometry
  material: THREE.PointsMaterial
  mesh: THREE.Points
  activeCount: number
}

// Base pool sizes (for high quality)
const BASE_POOL_SIZES: Record<ParticleEffectType, number> = {
  'dust-landing': 30,
  'dust-running': 50,
  'sparks-near-miss': 40,
  'sparks-collision': 60,
  'trail-speed': 100,
  'boost-burst': 50,
  'engine-trail': 80,
  'dodge-sparks': 40,
  'perfect-burst': 60,
  'perfect-flash': 20,
  'combo-trail': 50,
  'death-burst': 80,
  'respawn-glow': 60,
}

// Quality multipliers for pool sizes
const QUALITY_MULTIPLIERS: Record<string, number> = {
  low: 0.3,
  medium: 0.6,
  high: 1.0,
  ultra: 1.5,
}

export class ParticleSystem {
  private scene: THREE.Scene
  private pools: Map<ParticleEffectType, ParticlePool> = new Map()
  
  // Reusable vectors to avoid GC
  private tempVec3: THREE.Vector3 = new THREE.Vector3()
  
  // Quality-aware configuration
  private qualityProfile: QualityProfile
  private qualityMultiplier: number = 1.0
  private unsubscribeQuality: (() => void) | null = null
  
  // Computed pool sizes based on quality
  private poolSizes: Record<ParticleEffectType, number>

  // Track last emission counts for testing
  private lastDodgeEmitCount: number = 0
  private lastPerfectEmitCount: number = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
    
    // Get initial quality profile
    this.qualityProfile = getQualityProfile()
    this.qualityMultiplier = QUALITY_MULTIPLIERS[this.qualityProfile.tier] || 1.0
    
    // Calculate pool sizes based on quality
    this.poolSizes = this.calculatePoolSizes()
    
    // Subscribe to quality changes
    this.unsubscribeQuality = onQualityChange(this.handleQualityChange.bind(this))
    
    this.initializePools()
  }

  /**
   * Calculate pool sizes based on current quality profile
   */
  private calculatePoolSizes(): Record<ParticleEffectType, number> {
    const maxParticles = this.qualityProfile.particles.maxParticles
    const multiplier = this.qualityMultiplier
    
    // Scale pool sizes, but ensure minimum viable counts
    const sizes: Record<ParticleEffectType, number> = {} as Record<ParticleEffectType, number>
    for (const [type, baseSize] of Object.entries(BASE_POOL_SIZES)) {
      const scaledSize = Math.floor(baseSize * multiplier)
      // Ensure minimum of 10 particles per pool, max based on quality budget
      sizes[type as ParticleEffectType] = Math.max(10, Math.min(scaledSize, maxParticles / 10))
    }
    
    return sizes
  }

  /**
   * Handle runtime quality changes
   */
  private handleQualityChange(newProfile: QualityProfile): void {
    const oldMultiplier = this.qualityMultiplier
    this.qualityProfile = newProfile
    this.qualityMultiplier = QUALITY_MULTIPLIERS[newProfile.tier] || 1.0
    
    // Only rebuild pools if quality changed significantly
    if (Math.abs(this.qualityMultiplier - oldMultiplier) > 0.1) {
      this.rebuildPools()
    }
  }

  /**
   * Rebuild particle pools with new quality settings
   */
  private rebuildPools(): void {
    // Dispose existing pools
    for (const [, pool] of this.pools) {
      this.scene.remove(pool.mesh)
      pool.geometry.dispose()
      pool.material.dispose()
    }
    this.pools.clear()
    
    // Recalculate sizes and reinitialize
    this.poolSizes = this.calculatePoolSizes()
    this.initializePools()
  }

  /**
   * Check if particles are enabled
   */
  isEnabled(): boolean {
    return this.qualityProfile.particles.enabled
  }

  /**
   * Get quality multiplier for external use
   */
  getQualityMultiplier(): number {
    return this.qualityMultiplier
  }

  /**
   * Initialize particle pools for each effect type
   */
  private initializePools(): void {
    // Dust particles (brown/gray)
    this.createPool('dust-landing', 0x8b7355, 0.3, true)
    this.createPool('dust-running', 0x6b5344, 0.2, true)
    
    // Spark particles (orange/yellow)
    this.createPool('sparks-near-miss', COLORS.brandOrange, 0.15, false)
    this.createPool('sparks-collision', 0xff4444, 0.2, false)
    
    // Trail particles (brand colors)
    this.createPool('trail-speed', COLORS.brandIndigo, 0.1, true)
    this.createPool('boost-burst', COLORS.brandOrange, 0.25, false)
    
    // Engine trail (cyan/blue thruster exhaust)
    this.createPool('engine-trail', 0x44ddff, 0.15, true)

    // AAA Dodge particles
    this.createPool('dodge-sparks', COLORS.brandOrange, 0.18, false)
    this.createPool('perfect-burst', 0x00ffff, 0.22, false)  // Cyan
    this.createPool('perfect-flash', 0xffffff, 0.5, true)    // White glow
    this.createPool('combo-trail', 0xff00ff, 0.12, true)     // Magenta
    
    // AAA Death/Respawn particles
    this.createPool('death-burst', 0xff2222, 0.35, false)    // Red explosion
    this.createPool('respawn-glow', 0x00ffaa, 0.25, true)    // Cyan-green glow
  }

  /**
   * Create a particle pool
   */
  private createPool(
    type: ParticleEffectType,
    color: number,
    baseSize: number,
    additive: boolean
  ): void {
    const poolSize = this.poolSizes[type]
    const particles: Particle[] = []
    
    // Pre-allocate particles
    for (let i = 0; i < poolSize; i++) {
      particles.push({
        position: new THREE.Vector3(0, -1000, 0), // Off-screen
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        size: baseSize,
        color: new THREE.Color(color),
        alpha: 0,
      })
    }
    
    // Create geometry with positions
    const positions = new Float32Array(poolSize * 3)
    const sizes = new Float32Array(poolSize)
    const alphas = new Float32Array(poolSize)
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    
    // Create material
    const material = new THREE.PointsMaterial({
      color: color,
      size: baseSize,
      transparent: true,
      opacity: 1,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    
    const mesh = new THREE.Points(geometry, material)
    mesh.frustumCulled = false
    this.scene.add(mesh)
    
    this.pools.set(type, {
      particles,
      geometry,
      material,
      mesh,
      activeCount: 0,
    })
  }

  /**
   * Emit particles at a position
   * Respects quality settings - reduces count on low-end devices
   */
  emit(
    type: ParticleEffectType,
    position: THREE.Vector3,
    count: number = 10,
    options: {
      spread?: number
      speed?: number
      direction?: THREE.Vector3
      lifetime?: number
    } = {}
  ): void {
    // Skip if particles disabled
    if (!this.qualityProfile.particles.enabled) return
    
    const pool = this.pools.get(type)
    if (!pool) return
    
    // Scale count by quality multiplier
    const scaledCount = Math.max(1, Math.floor(count * this.qualityMultiplier))
    
    const {
      spread = 1,
      speed = 5,
      direction = new THREE.Vector3(0, 1, 0),
      lifetime = 0.5,
    } = options
    
    let emitted = 0
    for (const particle of pool.particles) {
      if (particle.life <= 0 && emitted < scaledCount) {
        // Activate particle
        particle.position.copy(position)
        
        // Random velocity based on direction and spread
        particle.velocity.set(
          direction.x + (Math.random() - 0.5) * spread,
          direction.y + (Math.random() - 0.5) * spread,
          direction.z + (Math.random() - 0.5) * spread
        ).normalize().multiplyScalar(speed * (0.5 + Math.random() * 0.5))
        
        particle.life = lifetime * (0.7 + Math.random() * 0.3)
        particle.maxLife = particle.life
        particle.alpha = 1
        
        emitted++
        pool.activeCount++
      }
    }
  }

  /**
   * Emit dust on landing
   */
  emitLandingDust(position: THREE.Vector3, velocity: number): void {
    const count = Math.min(20, Math.floor(velocity * 1.5))
    this.emit('dust-landing', position, count, {
      spread: 2,
      speed: velocity * 0.3,
      direction: new THREE.Vector3(0, 0.3, 0),
      lifetime: 0.4,
    })
  }

  /**
   * Emit running dust trail
   */
  emitRunningDust(position: THREE.Vector3, speed: number): void {
    // Only emit occasionally based on speed
    if (Math.random() > speed * 0.02) return
    
    this.tempVec3.copy(position)
    this.tempVec3.y = position.y - 0.5 // At feet level
    
    this.emit('dust-running', this.tempVec3, 2, {
      spread: 0.5,
      speed: 1,
      direction: new THREE.Vector3(0, 0.5, 1), // Kick back
      lifetime: 0.3,
    })
  }

  // AAA Feature: Footstep dust tracking
  private lastFootstepPhase: number = 0

  /**
   * AAA Feature: Emit footstep dust synced to run cycle
   * Creates subtle dust puffs at each footfall for grounding effect
   * @param position Player position
   * @param runCycle Current run cycle phase (0-1)
   * @param speed Current game speed
   * @param isGrounded Whether player is on ground
   */
  emitFootstepDust(
    position: THREE.Vector3,
    runCycle: number,
    speed: number,
    isGrounded: boolean
  ): void {
    if (!isGrounded) {
      this.lastFootstepPhase = runCycle
      return
    }

    // Detect footfall - when cycle crosses 0.0 or 0.5 (each foot)
    const crossedFirstFoot = this.lastFootstepPhase < 0.5 && runCycle >= 0.5
    const crossedSecondFoot = this.lastFootstepPhase > 0.5 && runCycle < 0.5
    
    if (crossedFirstFoot || crossedSecondFoot) {
      // Emit dust at feet level
      this.tempVec3.copy(position)
      this.tempVec3.y = 0.1 // Ground level
      
      // Offset slightly to left or right foot
      const footOffset = crossedFirstFoot ? -0.2 : 0.2
      this.tempVec3.x += footOffset
      
      // More particles at higher speed
      const count = Math.ceil(2 + (speed / 40) * 3)
      
      this.emit('dust-running', this.tempVec3, count, {
        spread: 0.4,
        speed: 1.5 + speed * 0.05,
        direction: new THREE.Vector3(0, 0.4, 0.8), // Kick back and up
        lifetime: 0.25,
      })
    }
    
    this.lastFootstepPhase = runCycle
  }

  /**
   * Emit sparks on near-miss
   */
  emitNearMissSparks(position: THREE.Vector3, direction: THREE.Vector3): void {
    this.emit('sparks-near-miss', position, 15, {
      spread: 1.5,
      speed: 8,
      direction: direction,
      lifetime: 0.3,
    })
  }

  /**
   * Emit sparks on collision
   */
  emitCollisionSparks(position: THREE.Vector3): void {
    this.emit('sparks-collision', position, 25, {
      spread: 2,
      speed: 12,
      direction: new THREE.Vector3(0, 1, 1),
      lifetime: 0.5,
    })
  }

  /**
   * Emit speed trail
   */
  emitSpeedTrail(position: THREE.Vector3, speed: number): void {
    if (speed < 30) return // Only at high speed
    
    const intensity = (speed - 30) / 30 // 0-1 based on speed
    if (Math.random() > intensity * 0.3) return
    
    this.emit('trail-speed', position, 3, {
      spread: 0.3,
      speed: 2,
      direction: new THREE.Vector3(0, 0, 1), // Trail behind
      lifetime: 0.2,
    })
  }

  /**
   * Emit engine trail (thruster exhaust)
   * Continuous emission based on speed - creates a persistent trail
   */
  emitEngineTrail(position: THREE.Vector3, speed: number): void {
    if (speed < 10) return // Need some speed
    
    // Emission rate scales with speed
    const intensity = Math.min(1, speed / 40)
    const emitChance = 0.3 + intensity * 0.5
    
    if (Math.random() > emitChance) return
    
    // Emit from slightly behind and below player center
    this.tempVec3.copy(position)
    this.tempVec3.y -= 0.3
    this.tempVec3.z += 0.8
    
    // More particles at higher speed
    const count = Math.ceil(1 + intensity * 2)
    
    this.emit('engine-trail', this.tempVec3, count, {
      spread: 0.4 + intensity * 0.3,
      speed: 3 + speed * 0.1,
      direction: new THREE.Vector3(0, 0.2, 1), // Mostly backward, slight upward
      lifetime: 0.15 + intensity * 0.1,
    })
  }

  /**
   * Update all particles
   */
  update(delta: number): void {
    for (const [, pool] of this.pools) {
      if (pool.activeCount === 0) continue
      
      const positions = pool.geometry.attributes.position.array as Float32Array
      const sizes = pool.geometry.attributes.size.array as Float32Array
      const alphas = pool.geometry.attributes.alpha.array as Float32Array
      
      let activeCount = 0
      
      for (let i = 0; i < pool.particles.length; i++) {
        const particle = pool.particles[i]
        
        if (particle.life > 0) {
          // Update physics
          particle.life -= delta
          particle.position.add(
            this.tempVec3.copy(particle.velocity).multiplyScalar(delta)
          )
          
          // Apply gravity
          particle.velocity.y -= 15 * delta
          
          // Update alpha based on life
          const lifeRatio = particle.life / particle.maxLife
          particle.alpha = lifeRatio
          
          // Update buffer
          const idx = i * 3
          positions[idx] = particle.position.x
          positions[idx + 1] = particle.position.y
          positions[idx + 2] = particle.position.z
          sizes[i] = particle.size * (0.5 + lifeRatio * 0.5)
          alphas[i] = particle.alpha
          
          activeCount++
        } else {
          // Hide dead particle
          const idx = i * 3
          positions[idx + 1] = -1000
          alphas[i] = 0
        }
      }
      
      pool.activeCount = activeCount
      pool.geometry.attributes.position.needsUpdate = true
      pool.geometry.attributes.size.needsUpdate = true
      pool.geometry.attributes.alpha.needsUpdate = true
    }
  }

  /**
   * AAA Feature: Emit dodge particles for near-miss
   * Emits 15-20 particles in the dodge direction
   * @param position Obstacle position
   * @param direction Direction away from obstacle
   * @param intensity 0-1 based on proximity (closer = more intense)
   */
  emitDodgeParticles(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    intensity: number = 1
  ): void {
    // 15-20 particles for near-miss
    const count = Math.floor(15 + Math.random() * 5)
    this.lastDodgeEmitCount = count
    
    this.emit('dodge-sparks', position, count, {
      spread: 1.2,
      speed: 6 + intensity * 4,
      direction: direction,
      lifetime: 0.35,
    })
  }

  /**
   * AAA Feature: Emit perfect dodge burst
   * Emits 30-40 particles with enhanced visuals
   * @param position Obstacle position
   * @param direction Direction away from obstacle
   */
  emitPerfectDodgeBurst(
    position: THREE.Vector3,
    direction: THREE.Vector3
  ): void {
    // 30-40 particles for perfect dodge
    const count = Math.floor(30 + Math.random() * 10)
    this.lastPerfectEmitCount = count
    
    this.emit('perfect-burst', position, count, {
      spread: 1.8,
      speed: 10,
      direction: direction,
      lifetime: 0.45,
    })
    
    // Also emit the flash effect
    this.emitPerfectFlash(position)
  }

  /**
   * AAA Feature: Emit perfect dodge flash/glow
   * Brief expanding glow at dodge position
   */
  emitPerfectFlash(position: THREE.Vector3): void {
    this.emit('perfect-flash', position, 8, {
      spread: 0.5,
      speed: 3,
      direction: new THREE.Vector3(0, 1, 0),
      lifetime: 0.2,
    })
  }

  /**
   * AAA Feature: Update combo trail
   * Continuous trail behind player at high combo
   * @param playerPos Player position
   * @param combo Current combo value
   */
  updateComboTrail(playerPos: THREE.Vector3, combo: number): void {
    if (combo < 5) return  // Only at combo 5+
    
    // Emission rate and intensity scale with combo
    const intensity = Math.min(1, (combo - 5) / 15)  // Max at combo 20
    const emitChance = 0.2 + intensity * 0.4
    
    if (Math.random() > emitChance) return
    
    // Emit from behind player
    this.tempVec3.copy(playerPos)
    this.tempVec3.z += 0.5
    
    const count = Math.ceil(1 + intensity * 2)
    
    this.emit('combo-trail', this.tempVec3, count, {
      spread: 0.3 + intensity * 0.3,
      speed: 2,
      direction: new THREE.Vector3(0, 0.3, 1),
      lifetime: 0.25 + intensity * 0.15,
    })
  }

  /**
   * Get last dodge emit count (for testing)
   */
  getLastDodgeEmitCount(): number {
    return this.lastDodgeEmitCount
  }

  /**
   * Get last perfect emit count (for testing)
   */
  getLastPerfectEmitCount(): number {
    return this.lastPerfectEmitCount
  }

  /**
   * AAA Feature: Emit death burst explosion
   * Dramatic red particle explosion on death
   * @param position Player death position
   */
  emitDeathBurst(position: THREE.Vector3): void {
    // Large burst of red particles in all directions
    this.emit('death-burst', position, 50, {
      spread: 3,
      speed: 15,
      direction: new THREE.Vector3(0, 1, 0),
      lifetime: 0.8,
    })
    
    // Secondary wave slightly delayed effect
    setTimeout(() => {
      this.emit('death-burst', position, 30, {
        spread: 2,
        speed: 8,
        direction: new THREE.Vector3(0, 0.5, 0),
        lifetime: 0.6,
      })
    }, 100)
  }

  /**
   * AAA Feature: Emit respawn glow effect
   * Cyan-green energy particles on respawn
   * @param position Player respawn position
   */
  emitRespawnGlow(position: THREE.Vector3): void {
    // Rising energy particles
    this.emit('respawn-glow', position, 40, {
      spread: 1.5,
      speed: 6,
      direction: new THREE.Vector3(0, 1, 0),
      lifetime: 0.7,
    })
    
    // Ground ring effect
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const dir = new THREE.Vector3(Math.cos(angle), 0.3, Math.sin(angle))
      this.emit('respawn-glow', position, 5, {
        spread: 0.3,
        speed: 4,
        direction: dir,
        lifetime: 0.5,
      })
    }
  }

  /**
   * Emit collect burst effect when picking up a gem
   * Sparkly green/cyan particles burst outward
   * @param position Collectible position
   */
  emitCollectBurst(position: THREE.Vector3): void {
    // Sparkly burst in all directions
    this.emit('boost-burst', position, 25, {
      spread: 2,
      speed: 8,
      direction: new THREE.Vector3(0, 1, 0),
      lifetime: 0.5,
    })
    
    // Rising sparkles
    this.emit('respawn-glow', position, 15, {
      spread: 1,
      speed: 5,
      direction: new THREE.Vector3(0, 1.5, 0),
      lifetime: 0.6,
    })
  }

  /**
   * Reset all particles
   */
  reset(): void {
    for (const [, pool] of this.pools) {
      for (const particle of pool.particles) {
        particle.life = 0
        particle.position.y = -1000
      }
      pool.activeCount = 0
    }
    this.lastDodgeEmitCount = 0
    this.lastPerfectEmitCount = 0
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Unsubscribe from quality changes
    if (this.unsubscribeQuality) {
      this.unsubscribeQuality()
      this.unsubscribeQuality = null
    }
    
    for (const [, pool] of this.pools) {
      this.scene.remove(pool.mesh)
      pool.geometry.dispose()
      pool.material.dispose()
    }
    this.pools.clear()
  }
}
