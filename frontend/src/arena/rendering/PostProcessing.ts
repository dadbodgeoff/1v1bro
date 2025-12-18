/**
 * PostProcessing - Enterprise post-processing pipeline
 * 
 * Includes:
 * - Bloom for light glow
 * - SSAO for ambient occlusion
 * - Tone mapping
 * - Anti-aliasing (SMAA)
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

// Color grading shader for cinematic look
const ColorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    contrast: { value: 1.1 },
    saturation: { value: 1.05 },
    brightness: { value: 0.0 },
    vignetteAmount: { value: 0.3 },
    vignetteSize: { value: 0.5 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float contrast;
    uniform float saturation;
    uniform float brightness;
    uniform float vignetteAmount;
    uniform float vignetteSize;
    varying vec2 vUv;
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Brightness
      color.rgb += brightness;
      
      // Contrast
      color.rgb = (color.rgb - 0.5) * contrast + 0.5;
      
      // Saturation
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(gray), color.rgb, saturation);
      
      // Vignette
      vec2 uv = vUv * (1.0 - vUv.yx);
      float vignette = uv.x * uv.y * 15.0;
      vignette = pow(vignette, vignetteSize);
      color.rgb = mix(color.rgb * (1.0 - vignetteAmount), color.rgb, vignette);
      
      gl_FragColor = color;
    }
  `,
}

export interface PostProcessingConfig {
  bloom: {
    enabled: boolean
    strength: number
    radius: number
    threshold: number
  }
  colorGrading: {
    enabled: boolean
    contrast: number
    saturation: number
    brightness: number
    vignette: number
  }
  antialiasing: boolean
}

const DEFAULT_CONFIG: PostProcessingConfig = {
  bloom: {
    enabled: true,
    strength: 0.4,
    radius: 0.5,
    threshold: 0.8,
  },
  colorGrading: {
    enabled: true,
    contrast: 1.1,
    saturation: 1.05,
    brightness: 0.0,
    vignette: 0.25,
  },
  antialiasing: true,
}

export class PostProcessingPipeline {
  private composer: EffectComposer
  private bloomPass: UnrealBloomPass
  private colorGradingPass: ShaderPass
  private smaaPass: SMAAPass
  private config: PostProcessingConfig
  
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: Partial<PostProcessingConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // Create composer with high-quality render target
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType, // HDR support
      }
    )
    
    this.composer = new EffectComposer(renderer, renderTarget)
    
    // Render pass
    const renderPass = new RenderPass(scene, camera)
    this.composer.addPass(renderPass)
    
    // Bloom pass
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.config.bloom.strength,
      this.config.bloom.radius,
      this.config.bloom.threshold
    )
    this.bloomPass.enabled = this.config.bloom.enabled
    this.composer.addPass(this.bloomPass)
    
    // Color grading pass
    this.colorGradingPass = new ShaderPass(ColorGradingShader)
    this.colorGradingPass.uniforms.contrast.value = this.config.colorGrading.contrast
    this.colorGradingPass.uniforms.saturation.value = this.config.colorGrading.saturation
    this.colorGradingPass.uniforms.brightness.value = this.config.colorGrading.brightness
    this.colorGradingPass.uniforms.vignetteAmount.value = this.config.colorGrading.vignette
    this.colorGradingPass.enabled = this.config.colorGrading.enabled
    this.composer.addPass(this.colorGradingPass)
    
    // SMAA anti-aliasing
    this.smaaPass = new SMAAPass()
    this.smaaPass.enabled = this.config.antialiasing
    this.composer.addPass(this.smaaPass)
    
    // Output pass (tone mapping)
    const outputPass = new OutputPass()
    this.composer.addPass(outputPass)
  }
  
  render(): void {
    this.composer.render()
  }
  
  setSize(width: number, height: number): void {
    this.composer.setSize(width, height)
    this.bloomPass.resolution.set(width, height)
  }
  
  setBloomStrength(strength: number): void {
    this.bloomPass.strength = strength
  }
  
  setBloomEnabled(enabled: boolean): void {
    this.bloomPass.enabled = enabled
  }
  
  dispose(): void {
    this.composer.dispose()
  }
}
