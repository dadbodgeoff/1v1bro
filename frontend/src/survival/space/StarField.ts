/**
 * StarField - High-performance instanced star rendering
 * Uses GPU instancing for thousands of stars with minimal draw calls
 */

import * as THREE from 'three'
import type { StarLayerConfig } from './types'

// Star shader - handles twinkling and parallax in GPU
const starVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float twinkleOffset;
  
  uniform float uTime;
  uniform float uPlayerZ;
  uniform float uSpeedMultiplier;
  uniform float uTwinkleSpeed;
  
  varying vec3 vColor;
  varying float vTwinkle;
  
  void main() {
    vColor = customColor;
    
    // Twinkle effect
    float twinkle = sin(uTime * uTwinkleSpeed + twinkleOffset) * 0.3 + 0.7;
    vTwinkle = twinkle;
    
    // Parallax - stars move slower than player based on distance
    vec3 pos = position;
    
    // Infinite star field: wrap stars around player position
    // Player moves in -Z direction, so we need to handle negative playerZ
    float wrapDistance = 8000.0;
    float halfWrap = wrapDistance * 0.5;
    
    // Calculate relative position to player with parallax
    float starZ = pos.z + uPlayerZ * (1.0 - uSpeedMultiplier);
    
    // Wrap to keep stars in range around player
    float wrappedZ = mod(starZ + halfWrap, wrapDistance) - halfWrap;
    pos.z = uPlayerZ + wrappedZ;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 10.0);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying vec3 vColor;
  varying float vTwinkle;
  
  void main() {
    // Circular point with soft edge
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Soft glow falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vTwinkle;
    
    // Core brightness
    float core = 1.0 - smoothstep(0.0, 0.2, dist);
    vec3 color = vColor + vec3(core * 0.3);
    
    gl_FragColor = vec4(color, alpha);
  }
`

/**
 * Default star layer configurations for parallax depth
 * Optimized: Reduced counts ~45% for better FPS while maintaining visual density
 */
export const DEFAULT_STAR_LAYERS: StarLayerConfig[] = [
  {
    count: 600,
    minSize: 1.0,
    maxSize: 2.5,
    minDistance: 50,
    maxDistance: 150,
    speedMultiplier: 0.1, // Closest layer - moves fastest
    color: new THREE.Color(0xffffff),
    twinkleSpeed: 3.0,
  },
  {
    count: 900,
    minSize: 0.8,
    maxSize: 2.0,
    minDistance: 150,
    maxDistance: 300,
    speedMultiplier: 0.05,
    color: new THREE.Color(0xaaccff),
    twinkleSpeed: 2.0,
  },
  {
    count: 1000,
    minSize: 0.5,
    maxSize: 1.5,
    minDistance: 300,
    maxDistance: 500,
    speedMultiplier: 0.02, // Furthest layer - almost static
    color: new THREE.Color(0x8899bb),
    twinkleSpeed: 1.0,
  },
]

export class StarField {
  private layers: THREE.Points[] = []
  private materials: THREE.ShaderMaterial[] = []
  private group: THREE.Group

  constructor(layerConfigs: StarLayerConfig[] = DEFAULT_STAR_LAYERS) {
    this.group = new THREE.Group()
    this.group.renderOrder = -100 // Render behind everything
    this.group.frustumCulled = false // Stars are always visible (skybox)
    this.group.matrixAutoUpdate = false // Static group

    layerConfigs.forEach((config, index) => {
      const layer = this.createStarLayer(config, index)
      this.layers.push(layer)
      this.group.add(layer)
    })

    // Freeze group matrix
    this.group.updateMatrix()
  }

  /**
   * Create a single star layer with instanced geometry
   */
  private createStarLayer(config: StarLayerConfig, _layerIndex: number): THREE.Points {
    const { count, minSize, maxSize, minDistance, maxDistance, speedMultiplier, color, twinkleSpeed } = config

    // Create geometry with attributes
    const geometry = new THREE.BufferGeometry()
    
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const twinkleOffsets = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Spherical distribution around player
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const distance = minDistance + Math.random() * (maxDistance - minDistance)

      // Convert to cartesian, but bias toward sides/above (not directly ahead)
      const x = distance * Math.sin(phi) * Math.cos(theta)
      const y = Math.abs(distance * Math.sin(phi) * Math.sin(theta)) + 10 // Keep above track
      const z = distance * Math.cos(phi) * (Math.random() > 0.5 ? 1 : -1) * 2000 // Spread along Z (wider for infinite feel)

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Slight color variation
      const colorVariation = 0.9 + Math.random() * 0.2
      colors[i * 3] = color.r * colorVariation
      colors[i * 3 + 1] = color.g * colorVariation
      colors[i * 3 + 2] = color.b * colorVariation

      // Random size within range
      sizes[i] = minSize + Math.random() * (maxSize - minSize)

      // Random twinkle phase offset
      twinkleOffsets[i] = Math.random() * Math.PI * 2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1))

    // Create shader material
    const material = new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPlayerZ: { value: 0 },
        uSpeedMultiplier: { value: speedMultiplier },
        uTwinkleSpeed: { value: twinkleSpeed },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.materials.push(material)

    const points = new THREE.Points(geometry, material)
    // Enterprise optimizations
    points.frustumCulled = false // Stars wrap infinitely, always render
    points.matrixAutoUpdate = false // Static geometry
    points.updateMatrix()

    return points
  }

  /**
   * Get the star field group to add to scene
   */
  getObject(): THREE.Group {
    return this.group
  }

  /**
   * Update star field
   */
  update(_delta: number, playerZ: number): void {
    const time = performance.now() * 0.001

    this.materials.forEach(material => {
      material.uniforms.uTime.value = time
      material.uniforms.uPlayerZ.value = playerZ
    })

    // Don't move the group - shader handles parallax via uPlayerZ uniform
    // Moving the group AND using playerZ in shader causes double movement
  }

  /**
   * Set quality (star count)
   */
  setQuality(_totalStars: number): void {
    // Quality adjustment would rebuild layers
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.layers.forEach(layer => {
      layer.geometry.dispose()
    })
    this.materials.forEach(material => {
      material.dispose()
    })
    this.layers = []
    this.materials = []
  }
}
