/**
 * NebulaBackground - Procedural nebula/galaxy shader
 * Creates a beautiful, slowly-shifting cosmic backdrop
 * Pure GPU - no textures needed, extremely performant
 */

import * as THREE from 'three'
import { COLORS } from '../config/constants'

// Nebula fragment shader - procedural cosmic clouds
const nebulaVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const nebulaFragmentShader = `
  uniform float uTime;
  uniform float uPlayerZ;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uDensity;
  uniform float uScale;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Fractal Brownian Motion for cloud-like patterns
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }
  
  void main() {
    // Use world position for consistent nebula regardless of camera
    vec3 samplePos = vWorldPosition * uScale * 0.001;
    
    // Slow drift over time
    float drift = uTime * 0.02;
    samplePos.x += drift;
    samplePos.z += sin(drift * 0.5) * 0.5;
    
    // Multiple noise layers for depth
    float n1 = fbm(samplePos);
    float n2 = fbm(samplePos * 2.0 + vec3(100.0));
    float n3 = fbm(samplePos * 0.5 + vec3(200.0));
    
    // Combine for cloud density
    float density = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * uDensity;
    density = smoothstep(-0.2, 0.8, density);
    
    // Color mixing based on noise
    vec3 color = mix(uColor1, uColor2, smoothstep(-0.5, 0.5, n1));
    color = mix(color, uColor3, smoothstep(0.0, 1.0, n2) * 0.5);
    
    // Add subtle brightness variation
    float brightness = 0.3 + n3 * 0.2;
    color *= brightness;
    
    // Vignette - darker at edges
    vec2 center = vUv - 0.5;
    float vignette = 1.0 - dot(center, center) * 1.5;
    vignette = clamp(vignette, 0.0, 1.0);
    
    // Final alpha based on density and vignette
    float alpha = density * vignette * 0.6;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export interface NebulaConfig {
  color1: number
  color2: number
  color3: number
  density: number
  scale: number
}

const DEFAULT_CONFIG: NebulaConfig = {
  color1: 0x1a0a2e, // Deep purple
  color2: COLORS.brandIndigo, // Brand indigo
  color3: 0x0d1b2a, // Dark blue
  density: 1.0,
  scale: 1.0,
}

export class NebulaBackground {
  private mesh: THREE.Mesh
  private material: THREE.ShaderMaterial
  private uniforms: {
    uTime: { value: number }
    uPlayerZ: { value: number }
    uColor1: { value: THREE.Color }
    uColor2: { value: THREE.Color }
    uColor3: { value: THREE.Color }
    uDensity: { value: number }
    uScale: { value: number }
  }

  constructor(config: Partial<NebulaConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }

    this.uniforms = {
      uTime: { value: 0 },
      uPlayerZ: { value: 0 },
      uColor1: { value: new THREE.Color(finalConfig.color1) },
      uColor2: { value: new THREE.Color(finalConfig.color2) },
      uColor3: { value: new THREE.Color(finalConfig.color3) },
      uDensity: { value: finalConfig.density },
      uScale: { value: finalConfig.scale },
    }

    this.material = new THREE.ShaderMaterial({
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    })

    // Large sphere that encompasses everything
    // Optimized: 16x12 segments - procedural shader hides low poly, saves GPU
    const geometry = new THREE.SphereGeometry(800, 16, 12)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = -200 // Render behind stars
    this.mesh.frustumCulled = false // Always visible (skybox)
  }

  /**
   * Get the mesh to add to scene
   */
  getObject(): THREE.Mesh {
    return this.mesh
  }

  /**
   * Update nebula
   */
  update(delta: number, playerZ: number): void {
    this.uniforms.uTime.value += delta
    this.uniforms.uPlayerZ.value = playerZ
    
    // Move with player
    this.mesh.position.z = playerZ
  }

  /**
   * Set nebula colors (for game state changes)
   */
  setColors(color1: number, color2: number, color3: number): void {
    this.uniforms.uColor1.value.setHex(color1)
    this.uniforms.uColor2.value.setHex(color2)
    this.uniforms.uColor3.value.setHex(color3)
  }

  /**
   * Set density (0-2 range)
   */
  setDensity(density: number): void {
    this.uniforms.uDensity.value = density
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
