/**
 * ShootingStars - Particle system for shooting star effects
 * Occasional streaks across the sky for visual interest
 * Object pooled for zero GC pressure
 */

import * as THREE from 'three'
import type { ShootingStar, ShootingStarConfig } from './types'

const DEFAULT_CONFIG: ShootingStarConfig = {
  spawnRate: 0.3, // Per second (one every ~3 seconds)
  minSpeed: 200,
  maxSpeed: 400,
  minLength: 5,
  maxLength: 15,
  color: 0xffffff,
  fadeTime: 0.5,
}

// Shooting star shader
const shootingStarVertexShader = `
  attribute float alpha;
  attribute float size;
  
  varying float vAlpha;
  
  void main() {
    vAlpha = alpha;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 20.0);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const shootingStarFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - dist * 2.0) * vAlpha;
    
    // Bright core
    float core = 1.0 - smoothstep(0.0, 0.3, dist);
    vec3 color = uColor + vec3(core * 0.5);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export class ShootingStars {
  private config: ShootingStarConfig
  private stars: ShootingStar[] = []
  private pool: ShootingStar[] = []
  private nextId: number = 0
  private spawnAccumulator: number = 0
  
  // Rendering
  private geometry: THREE.BufferGeometry
  private material: THREE.ShaderMaterial
  private points: THREE.Points
  private maxStars: number = 20
  
  // Buffers
  private positions: Float32Array
  private alphas: Float32Array
  private sizes: Float32Array

  constructor(config: Partial<ShootingStarConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // Pre-allocate buffers
    this.positions = new Float32Array(this.maxStars * 3)
    this.alphas = new Float32Array(this.maxStars)
    this.sizes = new Float32Array(this.maxStars)
    
    // Create geometry
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))
    
    // Create material
    this.material = new THREE.ShaderMaterial({
      vertexShader: shootingStarVertexShader,
      fragmentShader: shootingStarFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(this.config.color) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    
    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false // Dynamic positions, skip culling
    this.points.renderOrder = -50 // Behind celestials, in front of stars

    // Pre-populate pool
    for (let i = 0; i < this.maxStars; i++) {
      this.pool.push(this.createStar())
    }
  }

  /**
   * Create a new star object (for pooling)
   */
  private createStar(): ShootingStar {
    return {
      id: this.nextId++,
      startPosition: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      speed: 0,
      length: 0,
      life: 0,
      maxLife: 0,
    }
  }

  /**
   * Get star from pool or create new
   */
  private acquireStar(): ShootingStar | null {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    if (this.stars.length < this.maxStars) {
      return this.createStar()
    }
    return null
  }

  /**
   * Return star to pool
   */
  private releaseStar(star: ShootingStar): void {
    this.pool.push(star)
  }

  /**
   * Spawn a shooting star
   */
  private spawnStar(playerZ: number): void {
    const star = this.acquireStar()
    if (!star) return
    
    const { minSpeed, maxSpeed, minLength, maxLength, fadeTime } = this.config
    
    // Random position in sky (above and to sides of player)
    const side = Math.random() > 0.5 ? 1 : -1
    star.startPosition.set(
      side * (50 + Math.random() * 100), // Left or right
      30 + Math.random() * 50, // Above
      playerZ - 50 - Math.random() * 200 // Ahead of player
    )
    
    // Direction - diagonal streak
    star.direction.set(
      -side * (0.3 + Math.random() * 0.4), // Toward center
      -0.2 - Math.random() * 0.3, // Downward
      -0.5 - Math.random() * 0.5 // Forward
    ).normalize()
    
    star.speed = minSpeed + Math.random() * (maxSpeed - minSpeed)
    star.length = minLength + Math.random() * (maxLength - minLength)
    star.maxLife = fadeTime + star.length / star.speed
    star.life = star.maxLife
    
    this.stars.push(star)
  }

  /**
   * Get the points object to add to scene
   */
  getObject(): THREE.Points {
    return this.points
  }

  /**
   * Update shooting stars
   */
  update(delta: number, playerZ: number): void {
    // Spawn new stars
    this.spawnAccumulator += delta
    const spawnInterval = 1 / this.config.spawnRate
    
    while (this.spawnAccumulator >= spawnInterval) {
      this.spawnAccumulator -= spawnInterval
      this.spawnStar(playerZ)
    }
    
    // Update existing stars
    let writeIndex = 0
    
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i]
      star.life -= delta
      
      if (star.life <= 0) {
        this.releaseStar(star)
        continue
      }
      
      // Move star
      const moveAmount = star.speed * delta
      star.startPosition.addScaledVector(star.direction, moveAmount)
      
      // Update buffer
      const idx = writeIndex * 3
      this.positions[idx] = star.startPosition.x
      this.positions[idx + 1] = star.startPosition.y
      this.positions[idx + 2] = star.startPosition.z
      
      // Fade out
      const lifeRatio = star.life / star.maxLife
      this.alphas[writeIndex] = lifeRatio
      this.sizes[writeIndex] = star.length * lifeRatio
      
      // Keep star
      if (writeIndex !== i) {
        this.stars[writeIndex] = star
      }
      writeIndex++
    }
    
    // Trim array
    this.stars.length = writeIndex
    
    // Zero out unused slots
    for (let i = writeIndex; i < this.maxStars; i++) {
      this.alphas[i] = 0
    }
    
    // Update GPU buffers
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.alpha.needsUpdate = true
    this.geometry.attributes.size.needsUpdate = true
  }

  /**
   * Set spawn rate
   */
  setSpawnRate(rate: number): void {
    this.config.spawnRate = rate
  }

  /**
   * Set color
   */
  setColor(color: number): void {
    this.material.uniforms.uColor.value.setHex(color)
  }

  /**
   * Trigger a burst of shooting stars (for special events)
   */
  triggerBurst(count: number, playerZ: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnStar(playerZ)
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    this.stars = []
    this.pool = []
  }
}
