/**
 * AnimationLifeSystem - Coordinates all environmental animations
 * @module visual/AnimationLifeSystem
 */

import type { AnimatedElement, EnvironmentalEvent, Vector2 } from './types'

export class AnimationLifeSystem {
  private elements: Map<string, AnimatedElement> = new Map()
  private activeEvents: EnvironmentalEvent[] = []
  private time: number = 0
  private arenaWidth: number = 1920
  private arenaHeight: number = 1080

  // Event probabilities per second
  private eventProbabilities = {
    debris_fall: 0.1,
    lava_burst: 0.05,
    lightning: 0.02,
  }

  setArenaDimensions(width: number, height: number): void {
    this.arenaWidth = width
    this.arenaHeight = height
  }

  registerLavaAnimation(hazardId: string, position: Vector2): void {
    const frames = this.generateLavaFrames(8) // Minimum 8 frames

    this.elements.set(`lava_${hazardId}`, {
      id: `lava_${hazardId}`,
      type: 'lava',
      position,
      frames,
      frameRate: 10,
      currentFrame: 0,
      phaseOffset: Math.random() * Math.PI * 2,
      loop: true,
    })
  }

  registerSteamVent(propId: string, position: Vector2): void {
    // Steam uses particle system, not frame animation
    this.elements.set(`steam_${propId}`, {
      id: `steam_${propId}`,
      type: 'steam',
      position,
      frames: [],
      frameRate: 0,
      currentFrame: 0,
      phaseOffset: Math.random() * Math.PI * 2,
      loop: true,
    })
  }

  update(deltaTime: number): void {
    this.time += deltaTime

    // Update animated elements (delta-time based)
    for (const element of this.elements.values()) {
      if (element.frames.length === 0) continue

      const frameTime = 1 / element.frameRate
      const totalTime = this.time + element.phaseOffset
      element.currentFrame = Math.floor(totalTime / frameTime) % element.frames.length
    }

    // Check for new environmental events
    this.checkForNewEvents(deltaTime)

    // Update active events
    this.updateActiveEvents(deltaTime)
  }

  private checkForNewEvents(deltaTime: number): void {
    for (const [type, probability] of Object.entries(this.eventProbabilities)) {
      if (Math.random() < probability * deltaTime) {
        this.triggerEvent(type as EnvironmentalEvent['type'])
      }
    }
  }

  private triggerEvent(type: EnvironmentalEvent['type']): void {
    const event: EnvironmentalEvent = {
      type,
      position: this.getRandomEventPosition(type),
      startTime: this.time,
      duration: 0.5 + Math.random() * 1.5, // 0.5-2 seconds
      progress: 0,
    }
    this.activeEvents.push(event)
  }

  private getRandomEventPosition(type: EnvironmentalEvent['type']): Vector2 {
    switch (type) {
      case 'debris_fall':
        return { x: Math.random() * this.arenaWidth, y: 0 }
      case 'lava_burst':
        return { x: Math.random() * this.arenaWidth, y: this.arenaHeight }
      case 'lightning':
        return { x: Math.random() * this.arenaWidth, y: Math.random() * this.arenaHeight * 0.3 }
      default:
        return { x: 0, y: 0 }
    }
  }

  private updateActiveEvents(deltaTime: number): void {
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
      const event = this.activeEvents[i]
      event.progress += deltaTime / event.duration

      if (event.progress >= 1) {
        this.activeEvents.splice(i, 1)
      }
    }
  }

  private generateLavaFrames(count: number): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = []

    for (let i = 0; i < count; i++) {
      const canvas = document.createElement('canvas')
      canvas.width = 80
      canvas.height = 80
      const ctx = canvas.getContext('2d')!

      // Generate bubbling lava frame
      this.renderLavaFrame(ctx, i / count)
      frames.push(canvas)
    }

    return frames
  }

  private renderLavaFrame(ctx: CanvasRenderingContext2D, phase: number): void {
    // Base lava color
    const gradient = ctx.createLinearGradient(0, 0, 0, 80)
    gradient.addColorStop(0, '#ff4400')
    gradient.addColorStop(0.5, '#ff6600')
    gradient.addColorStop(1, '#ff2200')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 80, 80)

    // Bubbles
    ctx.fillStyle = '#ffaa00'
    const bubbleCount = 5
    for (let i = 0; i < bubbleCount; i++) {
      const bubblePhase = (phase + i / bubbleCount) % 1
      const x = 10 + (i * 15) % 60
      const y = 70 - bubblePhase * 60
      const radius = 3 + Math.sin(bubblePhase * Math.PI) * 3
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Surface flow effect
    ctx.fillStyle = 'rgba(255, 200, 100, 0.3)'
    const flowOffset = phase * 20
    for (let x = -20 + flowOffset; x < 100; x += 40) {
      ctx.beginPath()
      ctx.ellipse(x, 10, 15, 5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  getCurrentFrame(elementId: string): HTMLCanvasElement | null {
    const element = this.elements.get(elementId)
    if (!element || element.frames.length === 0) return null
    return element.frames[element.currentFrame]
  }

  getActiveEvents(): EnvironmentalEvent[] {
    return this.activeEvents
  }

  /**
   * Verify animation phases are staggered
   */
  arePhasesDiversified(): boolean {
    const phases = Array.from(this.elements.values()).map((e) => e.phaseOffset)
    if (phases.length < 3) return true

    // Check that at least 2 phases are different
    const uniquePhases = new Set(phases.map((p) => Math.round(p * 10) / 10))
    return uniquePhases.size >= 2
  }

  /**
   * Get all animated elements
   */
  getElements(): AnimatedElement[] {
    return Array.from(this.elements.values())
  }

  /**
   * Render environmental events
   */
  renderEvents(ctx: CanvasRenderingContext2D): void {
    for (const event of this.activeEvents) {
      ctx.save()
      ctx.globalAlpha = 1 - event.progress

      switch (event.type) {
        case 'debris_fall':
          this.renderDebrisFall(ctx, event)
          break
        case 'lava_burst':
          this.renderLavaBurst(ctx, event)
          break
        case 'lightning':
          this.renderLightning(ctx, event)
          break
      }

      ctx.restore()
    }
  }

  private renderDebrisFall(ctx: CanvasRenderingContext2D, event: EnvironmentalEvent): void {
    const y = event.position.y + event.progress * this.arenaHeight
    ctx.fillStyle = '#3d3d3d'
    ctx.beginPath()
    ctx.arc(event.position.x, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderLavaBurst(ctx: CanvasRenderingContext2D, event: EnvironmentalEvent): void {
    const height = (1 - event.progress) * 100
    ctx.fillStyle = '#ff6600'
    ctx.beginPath()
    ctx.moveTo(event.position.x - 10, event.position.y)
    ctx.lineTo(event.position.x, event.position.y - height)
    ctx.lineTo(event.position.x + 10, event.position.y)
    ctx.closePath()
    ctx.fill()
  }

  private renderLightning(ctx: CanvasRenderingContext2D, event: EnvironmentalEvent): void {
    if (event.progress > 0.2) return // Lightning is brief
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(event.position.x, event.position.y)
    ctx.lineTo(event.position.x + 20, event.position.y + 50)
    ctx.lineTo(event.position.x - 10, event.position.y + 80)
    ctx.lineTo(event.position.x + 15, event.position.y + 150)
    ctx.stroke()
  }
}
