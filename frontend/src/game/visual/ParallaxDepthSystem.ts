/**
 * ParallaxDepthSystem - Enhanced backdrop with 4 distinct depth layers
 * @module visual/ParallaxDepthSystem
 */

import type {
  ParallaxLayer,
  LayerElement,
  Vector2,
  ThemeManifest,
} from './types'

export class ParallaxDepthSystem {
  private layers: ParallaxLayer[] = []
  private cameraPosition: Vector2 = { x: 0, y: 0 }

  constructor(width: number, height: number, theme: ThemeManifest) {
    this.initializeLayers(width, height, theme)
  }

  private initializeLayers(width: number, height: number, theme: ThemeManifest): void {
    // Layer 0: Far background (scrollRatio: 0.1)
    this.layers.push({
      id: 'far',
      depth: 0,
      scrollRatio: 0.1,
      canvas: this.createFarBackground(width, height, theme),
      elements: [],
      isStatic: true,
    })

    // Layer 1: Mid background (scrollRatio: 0.3)
    this.layers.push({
      id: 'mid',
      depth: 1,
      scrollRatio: 0.3,
      canvas: this.createMidBackground(width, height, theme),
      elements: [],
      isStatic: true,
    })

    // Layer 2: Gameplay (scrollRatio: 1.0) - handled by TileBatchRenderer
    // Not added here as it's managed separately

    // Layer 3: Foreground (scrollRatio: 1.2)
    this.layers.push({
      id: 'foreground',
      depth: 3,
      scrollRatio: 1.2,
      canvas: null,
      elements: this.createForegroundElements(theme),
      isStatic: false,
    })
  }

  private createFarBackground(width: number, height: number, theme: ThemeManifest): OffscreenCanvas {
    const canvas = new OffscreenCanvas(width * 2, height)
    const ctx = canvas.getContext('2d')!

    // Sky gradient (dark red to black for volcanic theme)
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#000000')
    gradient.addColorStop(0.5, theme.palette.background)
    gradient.addColorStop(1, theme.palette.primary)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width * 2, height)

    // Volcanic mountain silhouettes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.drawMountainSilhouette(ctx, width * 2, height)

    // Distant lava glow on horizon
    const glowGradient = ctx.createLinearGradient(0, height * 0.7, 0, height)
    glowGradient.addColorStop(0, 'transparent')
    glowGradient.addColorStop(1, `${theme.palette.hazard}40`)
    ctx.fillStyle = glowGradient
    ctx.fillRect(0, height * 0.7, width * 2, height * 0.3)

    return canvas
  }

  private createMidBackground(width: number, height: number, theme: ThemeManifest): OffscreenCanvas {
    const canvas = new OffscreenCanvas(width * 1.5, height)
    const ctx = canvas.getContext('2d')!

    // Base fill
    ctx.fillStyle = theme.palette.background
    ctx.fillRect(0, 0, width * 1.5, height)

    // Rock formation silhouettes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    this.drawRockFormations(ctx, width * 1.5, height)

    // Stalactite shadows from ceiling
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    this.drawStalactites(ctx, width * 1.5, 100)

    // Lava pool reflections
    const reflectionGradient = ctx.createLinearGradient(0, height - 100, 0, height)
    reflectionGradient.addColorStop(0, 'transparent')
    reflectionGradient.addColorStop(1, `${theme.palette.hazard}30`)
    ctx.fillStyle = reflectionGradient
    ctx.fillRect(0, height - 100, width * 1.5, 100)

    return canvas
  }

  private createForegroundElements(_theme: ThemeManifest): LayerElement[] {
    const elements: LayerElement[] = []

    // Hanging stalactites (partial screen coverage)
    for (let i = 0; i < 5; i++) {
      elements.push({
        type: 'procedural',
        position: { x: i * 300 + Math.random() * 100, y: 0 },
        size: { x: 40 + Math.random() * 30, y: 80 + Math.random() * 60 },
        alpha: 0.7,
        parallaxOffset: { x: 0, y: 0 },
      })
    }

    return elements
  }

  private drawMountainSilhouette(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
    ctx.beginPath()
    ctx.moveTo(0, height)

    const peaks = 8
    for (let i = 0; i <= peaks; i++) {
      const x = (i / peaks) * width
      const peakHeight = height * (0.3 + Math.random() * 0.3)
      const midX = x + (width / peaks) * 0.5
      ctx.lineTo(midX, height - peakHeight)
      ctx.lineTo(x + width / peaks, height - peakHeight * 0.6)
    }

    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()
  }

  private drawRockFormations(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
    for (let i = 0; i < 6; i++) {
      const x = i * (width / 6) + Math.random() * 50
      const rockWidth = 60 + Math.random() * 80
      const rockHeight = 100 + Math.random() * 150

      ctx.beginPath()
      ctx.moveTo(x, height)
      ctx.lineTo(x + rockWidth * 0.3, height - rockHeight)
      ctx.lineTo(x + rockWidth * 0.7, height - rockHeight * 0.8)
      ctx.lineTo(x + rockWidth, height)
      ctx.closePath()
      ctx.fill()
    }
  }

  private drawStalactites(ctx: OffscreenCanvasRenderingContext2D, width: number, maxHeight: number): void {
    for (let x = 0; x < width; x += 50 + Math.random() * 30) {
      const stalHeight = 30 + Math.random() * maxHeight
      const stalWidth = 10 + Math.random() * 15

      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + stalWidth / 2, stalHeight)
      ctx.lineTo(x + stalWidth, 0)
      ctx.closePath()
      ctx.fill()
    }
  }

  updateCameraPosition(position: Vector2): void {
    this.cameraPosition = position
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.layers) {
      ctx.save()

      // Apply parallax offset
      const offsetX = this.cameraPosition.x * layer.scrollRatio
      const offsetY = this.cameraPosition.y * layer.scrollRatio
      ctx.translate(-offsetX, -offsetY)

      if (layer.isStatic && layer.canvas) {
        ctx.drawImage(layer.canvas, 0, 0)
      } else {
        this.renderDynamicLayer(ctx, layer)
      }

      ctx.restore()
    }
  }

  private renderDynamicLayer(ctx: CanvasRenderingContext2D, layer: ParallaxLayer): void {
    for (const element of layer.elements) {
      ctx.save()
      ctx.globalAlpha = element.alpha
      ctx.translate(element.position.x + element.parallaxOffset.x, element.position.y + element.parallaxOffset.y)

      if (element.type === 'procedural') {
        // Draw stalactite shape
        ctx.fillStyle = 'rgba(30, 20, 20, 0.8)'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(element.size.x / 2, element.size.y)
        ctx.lineTo(element.size.x, 0)
        ctx.closePath()
        ctx.fill()
      } else if (element.sprite) {
        ctx.drawImage(element.sprite, 0, 0, element.size.x, element.size.y)
      }

      ctx.restore()
    }
  }

  /**
   * Get total layer count (including gameplay layer)
   */
  getLayerCount(): number {
    return this.layers.length + 1 // +1 for gameplay layer
  }

  /**
   * Get layers for testing
   */
  getLayers(): ParallaxLayer[] {
    return this.layers
  }

  /**
   * Calculate layer offset for a given camera position
   */
  getLayerOffset(layerId: string, cameraPosition: Vector2): Vector2 {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer) return { x: 0, y: 0 }

    return {
      x: cameraPosition.x * layer.scrollRatio,
      y: cameraPosition.y * layer.scrollRatio,
    }
  }
}
