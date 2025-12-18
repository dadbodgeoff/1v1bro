/**
 * ProjectileParticles - Efficient GPU-instanced particle system for projectile effects
 * 
 * Performance optimizations:
 * - Object pooling (no runtime allocations)
 * - InstancedMesh for single draw call per effect type
 * - GPU-based animation via custom shader
 * - Particle recycling
 * 
 * Effects:
 * - AK-47: Orange/yellow tracer with spark trail
 * - Raygun: Cyan plasma beam with energy particles
 */

import * as THREE from 'three'

// Max particles per pool (tune based on expected fire rate)
const MAX_BULLET_PARTICLES = 200
const MAX_PLASMA_PARTICLES = 300

/**
 * Particle data structure (CPU side)
 */
interface Particle {
  active: boolean
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number      // 0-1, decreases over time
  maxLife: number   // Total lifetime in seconds
  size: number
  color: THREE.Color
}

/**
 * Projectile effect types
 */
export type ProjectileEffectType = 'bullet' | 'plasma'

/**
 * Spawn configuration for a projectile
 */
export interface ProjectileSpawnConfig {
  type: ProjectileEffectType
  origin: THREE.Vector3
  direction: THREE.Vector3
  speed: number
}

/**
 * Custom shader for particles with fade and glow
 */
const particleVertexShader = `
  attribute float instanceLife;
  attribute float instanceSize;
  attribute vec3 instanceColor;
  
  varying float vLife;
  varying vec3 vColor;
  
  void main() {
    vLife = instanceLife;
    vColor = instanceColor;
    
    // Scale by life and base size
    float scale = instanceSize * smoothstep(0.0, 0.2, instanceLife);
    
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position * scale, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const particleFragmentShader = `
  varying float vLife;
  varying vec3 vColor;
  
  void main() {
    // Circular particle with soft edge
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft edge falloff
    float alpha = smoothstep(0.5, 0.2, dist) * vLife;
    
    // Emissive glow
    vec3 color = vColor * (1.0 + vLife * 0.5);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export class ProjectileParticles {
  private scene: THREE.Scene
  
  // Bullet tracer pool
  private bulletParticles: Particle[] = []
  private bulletMesh!: THREE.InstancedMesh
  private bulletLifeAttr!: THREE.InstancedBufferAttribute
  private bulletSizeAttr!: THREE.InstancedBufferAttribute
  private bulletColorAttr!: THREE.InstancedBufferAttribute
  
  // Plasma beam pool
  private plasmaParticles: Particle[] = []
  private plasmaMesh!: THREE.InstancedMesh
  private plasmaLifeAttr!: THREE.InstancedBufferAttribute
  private plasmaSizeAttr!: THREE.InstancedBufferAttribute
  private plasmaColorAttr!: THREE.InstancedBufferAttribute
  
  // Temp objects (avoid allocations in update loop)
  private tempMatrix = new THREE.Matrix4()
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
    
    // Initialize bullet particles
    this.initBulletPool()
    
    // Initialize plasma particles
    this.initPlasmaPool()
  }
  
  private initBulletPool(): void {
    // Create particle geometry (small quad)
    const geometry = new THREE.PlaneGeometry(0.05, 0.05)
    
    // Create instanced attributes
    const lifeArray = new Float32Array(MAX_BULLET_PARTICLES)
    const sizeArray = new Float32Array(MAX_BULLET_PARTICLES)
    const colorArray = new Float32Array(MAX_BULLET_PARTICLES * 3)
    
    this.bulletLifeAttr = new THREE.InstancedBufferAttribute(lifeArray, 1)
    this.bulletSizeAttr = new THREE.InstancedBufferAttribute(sizeArray, 1)
    this.bulletColorAttr = new THREE.InstancedBufferAttribute(colorArray, 3)
    
    geometry.setAttribute('instanceLife', this.bulletLifeAttr)
    geometry.setAttribute('instanceSize', this.bulletSizeAttr)
    geometry.setAttribute('instanceColor', this.bulletColorAttr)
    
    // Create material with custom shader
    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    
    // Create instanced mesh
    this.bulletMesh = new THREE.InstancedMesh(geometry, material, MAX_BULLET_PARTICLES)
    this.bulletMesh.frustumCulled = false
    this.scene.add(this.bulletMesh)
    
    // Initialize particle pool
    for (let i = 0; i < MAX_BULLET_PARTICLES; i++) {
      this.bulletParticles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.3,
        size: 1,
        color: new THREE.Color(1, 0.7, 0.2), // Orange/yellow
      })
      
      // Hide inactive particles
      this.tempMatrix.makeScale(0, 0, 0)
      this.bulletMesh.setMatrixAt(i, this.tempMatrix)
    }
    
    this.bulletMesh.instanceMatrix.needsUpdate = true
  }
  
  private initPlasmaPool(): void {
    const geometry = new THREE.PlaneGeometry(0.08, 0.08)
    
    const lifeArray = new Float32Array(MAX_PLASMA_PARTICLES)
    const sizeArray = new Float32Array(MAX_PLASMA_PARTICLES)
    const colorArray = new Float32Array(MAX_PLASMA_PARTICLES * 3)
    
    this.plasmaLifeAttr = new THREE.InstancedBufferAttribute(lifeArray, 1)
    this.plasmaSizeAttr = new THREE.InstancedBufferAttribute(sizeArray, 1)
    this.plasmaColorAttr = new THREE.InstancedBufferAttribute(colorArray, 3)
    
    geometry.setAttribute('instanceLife', this.plasmaLifeAttr)
    geometry.setAttribute('instanceSize', this.plasmaSizeAttr)
    geometry.setAttribute('instanceColor', this.plasmaColorAttr)
    
    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    
    this.plasmaMesh = new THREE.InstancedMesh(geometry, material, MAX_PLASMA_PARTICLES)
    this.plasmaMesh.frustumCulled = false
    this.scene.add(this.plasmaMesh)
    
    for (let i = 0; i < MAX_PLASMA_PARTICLES; i++) {
      this.plasmaParticles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.5,
        size: 1,
        color: new THREE.Color(0.2, 0.9, 1), // Cyan
      })
      
      this.tempMatrix.makeScale(0, 0, 0)
      this.plasmaMesh.setMatrixAt(i, this.tempMatrix)
    }
    
    this.plasmaMesh.instanceMatrix.needsUpdate = true
  }

  
  /**
   * Spawn a projectile effect
   */
  spawnProjectile(config: ProjectileSpawnConfig): void {
    if (config.type === 'bullet') {
      this.spawnBulletTracer(config)
    } else {
      this.spawnPlasmaBeam(config)
    }
  }
  
  /**
   * Spawn bullet tracer with spark trail
   */
  private spawnBulletTracer(config: ProjectileSpawnConfig): void {
    // Spawn 5-8 particles for the tracer
    const particleCount = 5 + Math.floor(Math.random() * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getInactiveParticle(this.bulletParticles)
      if (!particle) return
      
      // Stagger along the path
      const offset = i * 0.02
      particle.position.copy(config.origin)
      particle.position.addScaledVector(config.direction, offset)
      
      // Add some spread
      particle.velocity.copy(config.direction).multiplyScalar(config.speed * 0.8)
      particle.velocity.x += (Math.random() - 0.5) * 2
      particle.velocity.y += (Math.random() - 0.5) * 2
      particle.velocity.z += (Math.random() - 0.5) * 2
      
      particle.life = 1
      particle.maxLife = 0.15 + Math.random() * 0.1
      particle.size = 0.8 + Math.random() * 0.4
      particle.active = true
      
      // Vary color slightly (orange to yellow)
      particle.color.setRGB(
        1,
        0.5 + Math.random() * 0.4,
        0.1 + Math.random() * 0.2
      )
    }
  }
  
  /**
   * Spawn plasma beam with energy particles
   */
  private spawnPlasmaBeam(config: ProjectileSpawnConfig): void {
    // Spawn 8-12 particles for plasma effect
    const particleCount = 8 + Math.floor(Math.random() * 4)
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getInactiveParticle(this.plasmaParticles)
      if (!particle) return
      
      // Stagger along the path with more spread
      const offset = i * 0.03
      particle.position.copy(config.origin)
      particle.position.addScaledVector(config.direction, offset)
      
      // Add spiral motion for plasma effect
      const angle = i * 0.5 + Math.random() * Math.PI
      const spread = 0.1
      particle.position.x += Math.cos(angle) * spread
      particle.position.y += Math.sin(angle) * spread
      
      // Slower velocity with more drift
      particle.velocity.copy(config.direction).multiplyScalar(config.speed * 0.6)
      particle.velocity.x += (Math.random() - 0.5) * 3
      particle.velocity.y += (Math.random() - 0.5) * 3
      particle.velocity.z += (Math.random() - 0.5) * 3
      
      particle.life = 1
      particle.maxLife = 0.3 + Math.random() * 0.2
      particle.size = 1.0 + Math.random() * 0.5
      particle.active = true
      
      // Vary color (cyan to green)
      particle.color.setRGB(
        0.1 + Math.random() * 0.2,
        0.7 + Math.random() * 0.3,
        0.8 + Math.random() * 0.2
      )
    }
  }
  
  /**
   * Get an inactive particle from pool
   */
  private getInactiveParticle(pool: Particle[]): Particle | null {
    for (const particle of pool) {
      if (!particle.active) return particle
    }
    // Pool exhausted - recycle oldest (first active)
    for (const particle of pool) {
      if (particle.active && particle.life < 0.3) {
        return particle
      }
    }
    return null
  }
  
  /**
   * Update all particles
   */
  update(deltaTime: number): void {
    this.updatePool(
      this.bulletParticles,
      this.bulletMesh,
      this.bulletLifeAttr,
      this.bulletSizeAttr,
      this.bulletColorAttr,
      deltaTime
    )
    
    this.updatePool(
      this.plasmaParticles,
      this.plasmaMesh,
      this.plasmaLifeAttr,
      this.plasmaSizeAttr,
      this.plasmaColorAttr,
      deltaTime
    )
  }
  
  private updatePool(
    particles: Particle[],
    mesh: THREE.InstancedMesh,
    lifeAttr: THREE.InstancedBufferAttribute,
    sizeAttr: THREE.InstancedBufferAttribute,
    colorAttr: THREE.InstancedBufferAttribute,
    deltaTime: number
  ): void {
    let needsUpdate = false
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      
      if (!p.active) continue
      
      // Update life
      p.life -= deltaTime / p.maxLife
      
      if (p.life <= 0) {
        // Deactivate
        p.active = false
        this.tempMatrix.makeScale(0, 0, 0)
        mesh.setMatrixAt(i, this.tempMatrix)
        needsUpdate = true
        continue
      }
      
      // Update position
      p.position.addScaledVector(p.velocity, deltaTime)
      
      // Apply gravity/drag to velocity
      p.velocity.multiplyScalar(0.95)
      p.velocity.y -= 2 * deltaTime // Slight gravity
      
      // Update instance matrix
      this.tempMatrix.makeTranslation(p.position.x, p.position.y, p.position.z)
      mesh.setMatrixAt(i, this.tempMatrix)
      
      // Update attributes
      lifeAttr.setX(i, p.life)
      sizeAttr.setX(i, p.size)
      colorAttr.setXYZ(i, p.color.r, p.color.g, p.color.b)
      
      needsUpdate = true
    }
    
    if (needsUpdate) {
      mesh.instanceMatrix.needsUpdate = true
      lifeAttr.needsUpdate = true
      sizeAttr.needsUpdate = true
      colorAttr.needsUpdate = true
    }
  }
  
  /**
   * Spawn impact effect at hit location
   */
  spawnImpact(position: THREE.Vector3, type: ProjectileEffectType): void {
    const pool = type === 'bullet' ? this.bulletParticles : this.plasmaParticles
    const count = type === 'bullet' ? 10 : 15
    
    for (let i = 0; i < count; i++) {
      const particle = this.getInactiveParticle(pool)
      if (!particle) return
      
      particle.position.copy(position)
      
      // Explode outward
      particle.velocity.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 4,
        (Math.random() - 0.5) * 8
      )
      
      particle.life = 1
      particle.maxLife = 0.2 + Math.random() * 0.15
      particle.size = 0.6 + Math.random() * 0.4
      particle.active = true
      
      if (type === 'bullet') {
        particle.color.setRGB(1, 0.6 + Math.random() * 0.3, 0.2)
      } else {
        particle.color.setRGB(0.2, 0.8 + Math.random() * 0.2, 1)
      }
    }
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    this.scene.remove(this.bulletMesh)
    this.scene.remove(this.plasmaMesh)
    
    this.bulletMesh.geometry.dispose()
    ;(this.bulletMesh.material as THREE.Material).dispose()
    
    this.plasmaMesh.geometry.dispose()
    ;(this.plasmaMesh.material as THREE.Material).dispose()
  }
}
