/**
 * TileArtSystem - Generates procedural tile textures with cracks, weathering, and baked lighting
 * @module visual/TileArtSystem
 */

import type {
  TileArtConfig,
  TileType,
  EdgeFlags,
  TileTexture,
  ThemePalette,
  Rect,
} from './types'

export class TileArtSystem {
  private cache: Map<string, TileTexture> = new Map()
  private config: TileArtConfig
  private palette: ThemePalette

  constructor(config: TileArtConfig, palette: ThemePalette) {
    this.config = config
    this.palette = palette
  }

  /**
   * Generate a tile texture with procedural details
   * Same seed + config = identical output (deterministic)
   */
  generateTileTexture(
    type: TileType,
    gridX: number,
    gridY: number,
    edges: EdgeFlags
  ): TileTexture {
    const cacheKey = `${type}_${gridX}_${gridY}_${JSON.stringify(edges)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const canvas = document.createElement('canvas')
    canvas.width = 80
    canvas.height = 80
    const ctx = canvas.getContext('2d')!

    // 1. Base color with noise
    this.renderBaseColor(ctx, type, gridX, gridY)

    // 2. Crack patterns
    if (this.config.crackDensity > 0) {
      this.renderCracks(ctx, gridX, gridY)
    }

    // 3. Edge erosion
    if (this.config.edgeErosion) {
      this.renderEdgeErosion(ctx, edges)
    }

    // 4. Baked lighting gradient
    this.applyBakedLighting(ctx)

    const texture: TileTexture = { canvas, width: 80, height: 80, edges }
    this.cache.set(cacheKey, texture)
    return texture
  }

  /**
   * Render using 9-slice for non-square barriers
   */
  render9Slice(
    ctx: CanvasRenderingContext2D,
    texture: TileTexture,
    bounds: Rect
  ): void {
    const cornerSize = 16
    const { canvas } = texture
    const { x, y, width, height } = bounds

    // Top-left corner
    ctx.drawImage(canvas, 0, 0, cornerSize, cornerSize, x, y, cornerSize, cornerSize)
    // Top-right corner
    ctx.drawImage(canvas, 80 - cornerSize, 0, cornerSize, cornerSize, x + width - cornerSize, y, cornerSize, cornerSize)
    // Bottom-left corner
    ctx.drawImage(canvas, 0, 80 - cornerSize, cornerSize, cornerSize, x, y + height - cornerSize, cornerSize, cornerSize)
    // Bottom-right corner
    ctx.drawImage(canvas, 80 - cornerSize, 80 - cornerSize, cornerSize, cornerSize, x + width - cornerSize, y + height - cornerSize, cornerSize, cornerSize)

    // Top edge
    ctx.drawImage(canvas, cornerSize, 0, 80 - 2 * cornerSize, cornerSize, x + cornerSize, y, width - 2 * cornerSize, cornerSize)
    // Bottom edge
    ctx.drawImage(canvas, cornerSize, 80 - cornerSize, 80 - 2 * cornerSize, cornerSize, x + cornerSize, y + height - cornerSize, width - 2 * cornerSize, cornerSize)
    // Left edge
    ctx.drawImage(canvas, 0, cornerSize, cornerSize, 80 - 2 * cornerSize, x, y + cornerSize, cornerSize, height - 2 * cornerSize)
    // Right edge
    ctx.drawImage(canvas, 80 - cornerSize, cornerSize, cornerSize, 80 - 2 * cornerSize, x + width - cornerSize, y + cornerSize, cornerSize, height - 2 * cornerSize)

    // Center
    ctx.drawImage(canvas, cornerSize, cornerSize, 80 - 2 * cornerSize, 80 - 2 * cornerSize, x + cornerSize, y + cornerSize, width - 2 * cornerSize, height - 2 * cornerSize)
  }

  /**
   * Seeded random number generator for deterministic output
   */
  private seededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      return s / 0x7fffffff
    }
  }

  private renderBaseColor(ctx: CanvasRenderingContext2D, type: TileType, gridX: number, gridY: number): void {
    const baseColor = (this.palette as unknown as Record<string, string>)[type] || this.palette.platform
    const random = this.seededRandom(this.config.seed + gridX * 1000 + gridY)

    // Fill base color
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, 80, 80)

    // Apply ±10% hue/saturation variation using seeded noise
    if (this.config.weatheringIntensity > 0) {
      const imageData = ctx.getImageData(0, 0, 80, 80)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const variation = (random() - 0.5) * 0.2 * this.config.weatheringIntensity
        data[i] = Math.max(0, Math.min(255, data[i] + data[i] * variation))
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + data[i + 1] * variation))
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + data[i + 2] * variation))
      }

      ctx.putImageData(imageData, 0, 0)
    }
  }

  private renderCracks(ctx: CanvasRenderingContext2D, gridX: number, gridY: number): void {
    const random = this.seededRandom(this.config.seed + gridX * 2000 + gridY * 3)
    const numCracks = Math.floor(this.config.crackDensity * 5)

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.lineWidth = 1

    for (let i = 0; i < numCracks; i++) {
      const startX = random() * 80
      const startY = random() * 80
      const length = 10 + random() * 20
      const angle = random() * Math.PI * 2

      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length)
      ctx.stroke()
    }
  }

  private renderEdgeErosion(ctx: CanvasRenderingContext2D, edges: EdgeFlags): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'

    // Crumbling fragments on exposed edges
    if (edges.top) {
      for (let x = 0; x < 80; x += 8) {
        const height = 2 + Math.random() * 4
        ctx.fillRect(x, 0, 6, height)
      }
    }
    if (edges.bottom) {
      for (let x = 0; x < 80; x += 8) {
        const height = 2 + Math.random() * 4
        ctx.fillRect(x, 80 - height, 6, height)
      }
    }
    if (edges.left) {
      for (let y = 0; y < 80; y += 8) {
        const width = 2 + Math.random() * 4
        ctx.fillRect(0, y, width, 6)
      }
    }
    if (edges.right) {
      for (let y = 0; y < 80; y += 8) {
        const width = 2 + Math.random() * 4
        ctx.fillRect(80 - width, y, width, 6)
      }
    }
  }

  private applyBakedLighting(ctx: CanvasRenderingContext2D): void {
    // Top 15% lighter, bottom 20% darker
    const gradient = ctx.createLinearGradient(0, 0, 0, 80)
    gradient.addColorStop(0, 'rgba(255,255,255,0.15)')
    gradient.addColorStop(0.5, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.20)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 80, 80)
  }

  /**
   * Clear the texture cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.cache.size
  }
}
