/**
 * TriviaBillboard - Holographic floating billboard for trivia questions
 * 
 * Visual treatment:
 * - Semi-transparent glowing panel with scanline effects
 * - Holographic flicker/distortion on spawn
 * - Brand colors (indigo/orange glow edges)
 * - Text renders as if projected, with subtle bloom
 * - Slight rotation to face player as they pass
 */

import * as THREE from 'three'
import { COLORS } from '../config/constants'

export interface TriviaQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

export interface TriviaBillboardConfig {
  width: number
  height: number
  glowIntensity: number
  scanlineSpeed: number
  flickerIntensity: number
}

const DEFAULT_CONFIG: TriviaBillboardConfig = {
  width: 8,
  height: 6,
  glowIntensity: 0.8,
  scanlineSpeed: 0.5,
  flickerIntensity: 0.1,
}

// Typography hierarchy constants
const TYPOGRAPHY = {
  question: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
    font: 'bold 28px "Inter", system-ui, sans-serif',
  },
  option: {
    fontSize: 18,
    fontWeight: 'normal',
    lineHeight: 24,
    font: '18px "Inter", system-ui, sans-serif',
    smallFont: '15px "Inter", system-ui, sans-serif',
  },
  hint: {
    fontSize: 13,
    font: 'bold 13px "Inter", system-ui, sans-serif',
  },
  letterBadge: {
    fontSize: 16,
    font: 'bold 16px "Inter", system-ui, sans-serif',
    size: 26,
  },
}

// Spacing constants (in pixels at base scale)
const SPACING = {
  padding: 24,           // Outer padding
  questionBottom: 20,    // Space below question
  optionGap: 8,          // Gap between options
  optionPadding: 12,     // Padding inside option box
  hintTop: 16,           // Space above hint
}

/**
 * Holographic billboard shader material
 * Falls back to basic material if shader compilation fails (Safari)
 */
function createHologramMaterial(): THREE.ShaderMaterial | THREE.MeshBasicMaterial {
  try {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: null },
        uGlowColor: { value: new THREE.Color(COLORS.brandIndigo) },
        uEdgeColor: { value: new THREE.Color(COLORS.brandOrange) },
        uOpacity: { value: 0.85 },
        uScanlineIntensity: { value: 0.08 },
        uFlicker: { value: 0 },
        uReveal: { value: 0 }, // 0-1 for spawn animation
      },
      vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform sampler2D uTexture;
      uniform vec3 uGlowColor;
      uniform vec3 uEdgeColor;
      uniform float uOpacity;
      uniform float uScanlineIntensity;
      uniform float uFlicker;
      uniform float uReveal;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      
      // Noise function for holographic distortion
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        // Reveal animation - wipe from bottom to top
        float revealLine = uReveal * 1.2 - 0.1;
        if (vUv.y > revealLine) {
          discard;
        }
        
        // Sample texture - if no texture, use a fallback color
        vec2 distortedUv = vUv;
        vec4 texColor = texture2D(uTexture, distortedUv);
        
        // If texture alpha is 0, the texture might not be loaded yet
        if (texColor.a < 0.01) {
          texColor = vec4(0.1, 0.1, 0.15, 0.9);
        }
        
        // Scanline effect
        float scanline = sin(vUv.y * 100.0 + uTime * 2.0) * 0.5 + 0.5;
        scanline = pow(scanline, 6.0) * uScanlineIntensity;
        
        // Edge glow - stronger at edges
        float edgeX = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        float edgeY = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
        float edge = 1.0 - (edgeX * edgeY);
        
        // Combine colors
        vec3 baseColor = texColor.rgb;
        vec3 glowMix = mix(baseColor, uGlowColor, 0.1);
        vec3 edgeMix = mix(glowMix, uEdgeColor, edge * 0.4);
        
        // Add scanlines (subtle)
        vec3 finalColor = edgeMix - vec3(scanline * 0.5);
        
        // Flicker effect
        float flicker = 1.0 - uFlicker * noise(vec2(uTime * 10.0, 0.0));
        finalColor *= flicker;
        
        // Alpha with edge fade
        float alpha = texColor.a * uOpacity;
        
        // Reveal edge glow (subtle)
        float revealEdge = smoothstep(revealLine - 0.03, revealLine, vUv.y);
        finalColor += uEdgeColor * revealEdge * 0.5;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
  } catch (error) {
    // Fallback to basic material if shader fails (Safari compatibility)
    console.warn('[TriviaBillboard] Shader compilation failed, using fallback material:', error)
    return new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      opacity: 0.9,
    }) as unknown as THREE.ShaderMaterial
  }
}

/**
 * Calculate required billboard dimensions based on content
 * Returns exact size needed with minimal padding
 */
function calculateBillboardSize(question: TriviaQuestion): { width: number; height: number; metrics: ContentMetrics } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // Use consistent content width for readability
  const maxContentWidth = 500 // pixels
  const contentPadding = SPACING.padding * 2
  
  // Measure question
  ctx.font = TYPOGRAPHY.question.font
  const questionLines = wrapText(ctx, question.question, maxContentWidth)
  const questionHeight = questionLines.length * TYPOGRAPHY.question.lineHeight
  
  // Find widest question line
  let maxQuestionWidth = 0
  for (const line of questionLines) {
    maxQuestionWidth = Math.max(maxQuestionWidth, ctx.measureText(line).width)
  }
  
  // Measure options
  ctx.font = TYPOGRAPHY.option.font
  const optionMetrics: { lines: string[]; width: number; needsSmallFont: boolean }[] = []
  let maxOptionWidth = 0
  const optionTextMaxWidth = maxContentWidth - TYPOGRAPHY.letterBadge.size - 20 // Account for badge
  
  for (const option of question.options) {
    const optWidth = ctx.measureText(option).width
    const needsSmallFont = optWidth > optionTextMaxWidth
    
    if (needsSmallFont) {
      ctx.font = TYPOGRAPHY.option.smallFont
    }
    const lines = wrapText(ctx, option, optionTextMaxWidth)
    ctx.font = TYPOGRAPHY.option.font
    
    let thisOptionWidth = 0
    for (const line of lines) {
      ctx.font = needsSmallFont ? TYPOGRAPHY.option.smallFont : TYPOGRAPHY.option.font
      thisOptionWidth = Math.max(thisOptionWidth, ctx.measureText(line).width)
    }
    
    optionMetrics.push({ lines, width: thisOptionWidth, needsSmallFont })
    maxOptionWidth = Math.max(maxOptionWidth, thisOptionWidth + TYPOGRAPHY.letterBadge.size + 20)
  }
  
  // Calculate option heights
  let totalOptionHeight = 0
  const optionHeights: number[] = []
  for (const opt of optionMetrics) {
    const lineCount = opt.lines.length
    const lineH = opt.needsSmallFont ? 18 : TYPOGRAPHY.option.lineHeight
    const optH = Math.max(TYPOGRAPHY.letterBadge.size + 8, lineCount * lineH + SPACING.optionPadding * 2)
    optionHeights.push(optH)
    totalOptionHeight += optH + SPACING.optionGap
  }
  totalOptionHeight -= SPACING.optionGap // Remove last gap
  
  // Hint height
  const hintHeight = TYPOGRAPHY.hint.fontSize + SPACING.hintTop
  
  // Calculate final dimensions
  const contentWidth = Math.max(maxQuestionWidth, maxOptionWidth)
  const totalWidth = contentWidth + contentPadding
  const totalHeight = SPACING.padding + questionHeight + SPACING.questionBottom + totalOptionHeight + hintHeight + SPACING.padding
  
  // Convert to world units (64 pixels per unit)
  const pixelsPerUnit = 64
  const widthUnits = Math.max(6, totalWidth / pixelsPerUnit)
  const heightUnits = Math.max(4, totalHeight / pixelsPerUnit)
  
  return {
    width: widthUnits,
    height: heightUnits,
    metrics: {
      questionLines,
      optionMetrics,
      optionHeights,
      contentWidth,
      totalHeight,
    }
  }
}

interface ContentMetrics {
  questionLines: string[]
  optionMetrics: { lines: string[]; width: number; needsSmallFont: boolean }[]
  optionHeights: number[]
  contentWidth: number
  totalHeight: number
}

/**
 * Wrap text to fit within maxWidth, returns array of lines
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines.length > 0 ? lines : ['']
}

/**
 * Create a canvas texture with trivia content - auto-sized based on metrics
 */
function createTriviaTexture(
  question: TriviaQuestion,
  width: number,
  height: number,
  metrics: ContentMetrics,
  selectedAnswer: number | null = null,
  revealedAnswer: boolean = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  const scale = 2 // Higher res for crisp text
  canvas.width = width * 64 * scale
  canvas.height = height * 64 * scale
  
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  
  const w = width * 64
  const h = height * 64
  
  // Background - dark with slight transparency
  ctx.fillStyle = 'rgba(9, 9, 11, 0.92)'
  ctx.fillRect(0, 0, w, h)
  
  // Border glow effect
  const gradient = ctx.createLinearGradient(0, 0, w, 0)
  gradient.addColorStop(0, '#6366f1')
  gradient.addColorStop(0.5, '#f97316')
  gradient.addColorStop(1, '#6366f1')
  ctx.strokeStyle = gradient
  ctx.lineWidth = 3
  ctx.strokeRect(2, 2, w - 4, h - 4)
  
  // Inner border
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'
  ctx.lineWidth = 1
  ctx.strokeRect(6, 6, w - 12, h - 12)
  
  // Question text - using pre-calculated lines
  ctx.fillStyle = '#ffffff'
  ctx.font = TYPOGRAPHY.question.font
  ctx.textAlign = 'center'
  
  let y = SPACING.padding + TYPOGRAPHY.question.lineHeight * 0.8
  for (const line of metrics.questionLines) {
    ctx.fillText(line, w / 2, y)
    y += TYPOGRAPHY.question.lineHeight
  }
  
  // Answer options - using pre-calculated metrics
  let optionY = y + SPACING.questionBottom - TYPOGRAPHY.question.lineHeight + 10
  const letters = ['1', '2', '3', '4']
  
  question.options.forEach((_option, idx) => {
    const optMetric = metrics.optionMetrics[idx]
    const optHeight = metrics.optionHeights[idx]
    const isSelected = selectedAnswer === idx
    const isCorrect = idx === question.correctAnswer
    
    // Option background colors
    let bgColor = 'rgba(255, 255, 255, 0.06)'
    let textColor = '#e5e5e5'
    let letterBg = 'rgba(255, 255, 255, 0.12)'
    
    if (revealedAnswer) {
      if (isCorrect) {
        bgColor = 'rgba(34, 197, 94, 0.3)'
        textColor = '#22c55e'
        letterBg = '#22c55e'
      } else if (isSelected) {
        bgColor = 'rgba(239, 68, 68, 0.3)'
        textColor = '#ef4444'
        letterBg = '#ef4444'
      }
    } else if (isSelected) {
      bgColor = 'rgba(34, 211, 238, 0.2)'
      textColor = '#22d3ee'
      letterBg = '#22d3ee'
    }
    
    // Draw option box
    ctx.fillStyle = bgColor
    ctx.beginPath()
    ctx.roundRect(SPACING.padding, optionY, w - SPACING.padding * 2, optHeight, 6)
    ctx.fill()
    
    // Option border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Letter badge
    const badgeSize = TYPOGRAPHY.letterBadge.size
    const badgeX = SPACING.padding + 8
    const badgeY = optionY + (optHeight - badgeSize) / 2
    ctx.fillStyle = letterBg
    ctx.beginPath()
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 5)
    ctx.fill()
    
    ctx.fillStyle = isSelected || (revealedAnswer && isCorrect) ? '#000' : textColor
    ctx.font = TYPOGRAPHY.letterBadge.font
    ctx.textAlign = 'center'
    ctx.fillText(letters[idx], badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 5)
    
    // Option text - using pre-wrapped lines
    ctx.fillStyle = textColor
    ctx.font = optMetric.needsSmallFont ? TYPOGRAPHY.option.smallFont : TYPOGRAPHY.option.font
    ctx.textAlign = 'left'
    
    const textX = badgeX + badgeSize + 12
    const lineH = optMetric.needsSmallFont ? 18 : TYPOGRAPHY.option.lineHeight
    let textY = optionY + SPACING.optionPadding + lineH * 0.7
    
    if (optMetric.lines.length === 1) {
      // Center single line vertically
      textY = optionY + optHeight / 2 + 5
    }
    
    for (const line of optMetric.lines) {
      ctx.fillText(line, textX, textY)
      textY += lineH
    }
    
    optionY += optHeight + SPACING.optionGap
  })
  
  // Keyboard hint at bottom
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = TYPOGRAPHY.hint.font
  ctx.textAlign = 'center'
  ctx.fillText('Press 1-4 to answer', w / 2, h - SPACING.padding + 4)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export class TriviaBillboard {
  private group: THREE.Group
  private mesh: THREE.Mesh
  private material: THREE.ShaderMaterial | THREE.MeshBasicMaterial
  private isShaderMaterial: boolean = true
  private config: TriviaBillboardConfig
  private question: TriviaQuestion | null = null
  private contentMetrics: ContentMetrics | null = null
  private selectedAnswer: number | null = null
  private isRevealed: boolean = false
  private isActive: boolean = false
  
  // Animation state
  private revealProgress: number = 0
  private flickerTimer: number = 0
  private targetRotationY: number = 0
  
  // Glow plane behind billboard
  private glowMesh: THREE.Mesh | null = null

  constructor(config: Partial<TriviaBillboardConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.group = new THREE.Group()
    
    // Create billboard geometry
    const geometry = new THREE.PlaneGeometry(this.config.width, this.config.height)
    this.material = createHologramMaterial()
    this.isShaderMaterial = this.material instanceof THREE.ShaderMaterial
    this.mesh = new THREE.Mesh(geometry, this.material)
    
    // No glow mesh - it was causing visual artifacts
    this.glowMesh = null
    
    this.group.add(this.mesh)
    
    // Start hidden
    this.group.visible = false
  }

  /**
   * Spawn billboard with a trivia question
   * Dynamically sizes based on content length
   */
  spawn(question: TriviaQuestion, position: THREE.Vector3, side: 'left' | 'right'): void {
    this.question = question
    this.selectedAnswer = null
    this.isRevealed = false
    this.isActive = true
    this.revealProgress = 0
    this.flickerTimer = 0
    
    // Calculate dynamic size based on content
    const { width, height, metrics } = calculateBillboardSize(question)
    this.config.width = width
    this.config.height = height
    this.contentMetrics = metrics
    
    // Update geometry to match new size
    this.mesh.geometry.dispose()
    this.mesh.geometry = new THREE.PlaneGeometry(width, height)
    
    // Position
    this.group.position.copy(position)
    
    // Rotate to face track - reduced angle for better readability
    // Left side: slight angle inward (~12 degrees instead of 45)
    // This makes the billboard more straight-on while still angled
    const angle = side === 'left' ? Math.PI * 0.07 : -Math.PI * 0.07
    this.group.rotation.y = angle
    this.targetRotationY = angle
    
    // Update texture
    this.updateTexture()
    
    // Show
    this.group.visible = true
    
    // Reset material uniforms (only for shader material)
    if (this.isShaderMaterial && 'uniforms' in this.material) {
      this.material.uniforms.uReveal.value = 0
      this.material.uniforms.uFlicker.value = this.config.flickerIntensity
    }
  }

  /**
   * Update the canvas texture
   */
  private updateTexture(): void {
    if (!this.question || !this.contentMetrics) return
    
    const texture = createTriviaTexture(
      this.question,
      this.config.width,
      this.config.height,
      this.contentMetrics,
      this.selectedAnswer,
      this.isRevealed
    )
    
    // Dispose old texture
    if (this.isShaderMaterial && 'uniforms' in this.material) {
      if (this.material.uniforms.uTexture.value) {
        this.material.uniforms.uTexture.value.dispose()
      }
      this.material.uniforms.uTexture.value = texture
    } else {
      // For fallback material, set the map
      const basicMat = this.material as THREE.MeshBasicMaterial
      if (basicMat.map) {
        basicMat.map.dispose()
      }
      basicMat.map = texture
      basicMat.needsUpdate = true
    }
  }

  /**
   * Select an answer (before reveal)
   */
  selectAnswer(index: number): void {
    if (this.isRevealed || this.selectedAnswer !== null) return
    this.selectedAnswer = index
    this.updateTexture()
  }

  /**
   * Reveal the correct answer
   */
  reveal(): { isCorrect: boolean; correctAnswer: number } | null {
    if (!this.question || this.isRevealed) return null
    
    this.isRevealed = true
    this.updateTexture()
    
    return {
      isCorrect: this.selectedAnswer === this.question.correctAnswer,
      correctAnswer: this.question.correctAnswer,
    }
  }

  /**
   * Update animation
   */
  update(delta: number, playerZ: number): void {
    if (!this.isActive) return
    
    const time = performance.now() / 1000
    
    // Only update shader uniforms if using shader material
    if (this.isShaderMaterial && 'uniforms' in this.material) {
      // Update shader time
      this.material.uniforms.uTime.value = time
      
      // Reveal animation (spawn in)
      if (this.revealProgress < 1) {
        this.revealProgress += delta * 2 // 0.5 second reveal
        this.revealProgress = Math.min(1, this.revealProgress)
        this.material.uniforms.uReveal.value = this.easeOutCubic(this.revealProgress)
      }
      
      // Flicker decay
      if (this.flickerTimer < 1) {
        this.flickerTimer += delta * 2
        const flickerDecay = 1 - this.easeOutCubic(Math.min(1, this.flickerTimer))
        this.material.uniforms.uFlicker.value = this.config.flickerIntensity * flickerDecay
      }
    } else {
      // For fallback material, just track reveal progress
      if (this.revealProgress < 1) {
        this.revealProgress += delta * 2
        this.revealProgress = Math.min(1, this.revealProgress)
      }
    }
    
    // Subtle rotation to face player as they pass
    const billboardZ = this.group.position.z
    const relativeZ = playerZ - billboardZ
    
    // Only rotate when player is nearby
    if (Math.abs(relativeZ) < 30) {
      const rotationInfluence = Math.max(0, 1 - Math.abs(relativeZ) / 30)
      const facePlayerAngle = this.targetRotationY + (relativeZ * 0.01) * rotationInfluence
      this.group.rotation.y += (facePlayerAngle - this.group.rotation.y) * delta * 3
    }
    
    // Subtle hover animation
    this.group.position.y += Math.sin(time * 0.5) * 0.002
  }

  /**
   * Ease out cubic
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  /**
   * Despawn billboard
   */
  despawn(): void {
    this.isActive = false
    this.group.visible = false
    this.question = null
    this.contentMetrics = null
    this.selectedAnswer = null
    this.isRevealed = false
  }

  /**
   * Check if billboard is active
   */
  getIsActive(): boolean {
    return this.isActive
  }

  /**
   * Get the Three.js group
   */
  getObject(): THREE.Group {
    return this.group
  }

  /**
   * Get current question
   */
  getQuestion(): TriviaQuestion | null {
    return this.question
  }

  /**
   * Get Z position
   */
  getZ(): number {
    return this.group.position.z
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.material.dispose()
    this.mesh.geometry.dispose()
    if (this.isShaderMaterial && 'uniforms' in this.material) {
      if (this.material.uniforms.uTexture.value) {
        this.material.uniforms.uTexture.value.dispose()
      }
    } else {
      const basicMat = this.material as THREE.MeshBasicMaterial
      if (basicMat.map) {
        basicMat.map.dispose()
      }
    }
    if (this.glowMesh) {
      ;(this.glowMesh.material as THREE.Material).dispose()
      this.glowMesh.geometry.dispose()
    }
  }
}
