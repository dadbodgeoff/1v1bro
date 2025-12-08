/**
 * TileBatchRenderer - Optimized tile rendering with batching
 * Groups tiles by type for minimal draw calls
 * Based on Arena Assets Cheatsheet performance recommendations
 * 
 * @module renderers/TileBatchRenderer
 */

import { BaseRenderer } from './BaseRenderer'
import { ARENA_SIZE, GRID_SIZE } from '../config'
import { getTileColor, getCurrentPalette } from '../terrain/MapThemes'
import type { TileMap } from '../arena/TileMap'
import type { TileType, TileData } from '../arena/types'

// ============================================================================
// Types
// ============================================================================

interface TileBatch {
  type: TileType
  tiles: TileData[]
  color: string
}

// ============================================================================
// TileBatchRenderer Class
// ============================================================================

/**
 * TileBatchRenderer renders tiles grouped by type for performance
 * Single draw call per tile type instead of per tile
 */
export class TileBatchRenderer extends BaseRenderer {
  private tileMap: TileMap | null = null
  private batches: Map<TileType, TileBatch> = new Map()
  private batchesDirty = true
  private showGrid = true


  /**
   * Set the tile map to render
   */
  setTileMap(tileMap: TileMap): void {
    this.tileMap = tileMap
    this.batchesDirty = true
  }

  /**
   * Toggle grid line visibility
   */
  setShowGrid(show: boolean): void {
    this.showGrid = show
  }

  /**
   * Mark batches as needing rebuild (call when tiles change)
   */
  invalidateBatches(): void {
    this.batchesDirty = true
  }

  /**
   * Update animation time for animated tiles
   */
  update(deltaTime: number): void {
    this.animationTime += deltaTime
  }

  /**
   * Rebuild tile batches grouped by type
   */
  private rebuildBatches(): void {
    if (!this.tileMap) return

    this.batches.clear()
    const config = this.tileMap.getConfig()

    for (const row of config.tiles) {
      for (const tile of row) {
        let batch = this.batches.get(tile.type)
        if (!batch) {
          batch = {
            type: tile.type,
            tiles: [],
            color: getTileColor(tile.type, tile.gridX, tile.gridY),
          }
          this.batches.set(tile.type, batch)
        }
        batch.tiles.push(tile)
      }
    }

    this.batchesDirty = false
  }

  /**
   * Render all tiles using batched draw calls
   */
  render(): void {
    if (!this.ctx || !this.tileMap) return

    if (this.batchesDirty) {
      this.rebuildBatches()
    }

    // Render floor tiles first (background)
    this.renderFloorBatch()

    // Render other tile types
    for (const [type, batch] of this.batches) {
      if (type === 'floor') continue
      this.renderBatch(batch)
    }

    // Render grid lines on top
    if (this.showGrid) {
      this.renderGridLines()
    }
  }


  /**
   * Render floor tiles with variants for visual variety
   */
  private renderFloorBatch(): void {
    if (!this.ctx || !this.tileMap) return
    const ctx = this.ctx
    const tileSize = this.tileMap.getTileSize()

    ctx.save()

    // Draw each floor tile with its variant color
    const floorBatch = this.batches.get('floor')
    if (floorBatch) {
      for (const tile of floorBatch.tiles) {
        const color = getTileColor('floor', tile.gridX, tile.gridY)
        ctx.fillStyle = color
        ctx.fillRect(tile.pixelX, tile.pixelY, tileSize, tileSize)
      }
    }

    ctx.restore()
  }

  /**
   * Render a batch of tiles of the same type
   */
  private renderBatch(batch: TileBatch): void {
    if (!this.ctx || !this.tileMap) return
    const ctx = this.ctx
    const tileSize = this.tileMap.getTileSize()

    ctx.save()

    switch (batch.type) {
      case 'wall':
        this.renderWallBatch(batch, tileSize)
        break
      case 'half_wall':
        this.renderHalfWallBatch(batch, tileSize)
        break
      case 'hazard_damage':
        this.renderHazardBatch(batch, tileSize, 'damage')
        break
      case 'hazard_slow':
        this.renderHazardBatch(batch, tileSize, 'slow')
        break
      case 'hazard_emp':
        this.renderHazardBatch(batch, tileSize, 'emp')
        break
      case 'trap_pressure':
      case 'trap_timed':
        this.renderTrapBatch(batch, tileSize)
        break
      case 'teleporter':
        this.renderTeleporterBatch(batch, tileSize)
        break
      case 'jump_pad':
        this.renderJumpPadBatch(batch, tileSize)
        break
      default:
        this.renderDefaultBatch(batch, tileSize)
    }

    ctx.restore()
  }


  /**
   * Render wall tiles with 3D effect
   */
  private renderWallBatch(batch: TileBatch, tileSize: number): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const palette = getCurrentPalette()

    for (const tile of batch.tiles) {
      const x = tile.pixelX
      const y = tile.pixelY

      // Main wall body
      ctx.fillStyle = palette.wall
      ctx.fillRect(x, y, tileSize, tileSize)

      // Top highlight for 3D effect
      ctx.fillStyle = palette.wallHighlight
      ctx.fillRect(x, y, tileSize, 4)

      // Left highlight
      ctx.fillRect(x, y, 4, tileSize)

      // Bottom shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(x, y + tileSize - 4, tileSize, 4)

      // Right shadow
      ctx.fillRect(x + tileSize - 4, y, 4, tileSize)
    }
  }

  /**
   * Render half wall tiles (shorter, can shoot over)
   */
  private renderHalfWallBatch(batch: TileBatch, tileSize: number): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const palette = getCurrentPalette()
    const halfHeight = tileSize * 0.5

    for (const tile of batch.tiles) {
      const x = tile.pixelX
      const y = tile.pixelY + tileSize - halfHeight

      ctx.fillStyle = palette.halfWall
      ctx.fillRect(x, y, tileSize, halfHeight)

      // Top highlight
      ctx.fillStyle = palette.wallHighlight
      ctx.fillRect(x, y, tileSize, 2)
    }
  }

  /**
   * Render hazard tiles with animated glow
   */
  private renderHazardBatch(batch: TileBatch, tileSize: number, type: string): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const palette = getCurrentPalette()
    const pulse = 0.7 + Math.sin(this.animationTime * 3) * 0.3

    let color: string
    switch (type) {
      case 'damage': color = palette.hazardDamage; break
      case 'slow': color = palette.hazardSlow; break
      case 'emp': color = palette.hazardEmp; break
      default: color = palette.hazardDamage
    }

    for (const tile of batch.tiles) {
      const x = tile.pixelX
      const y = tile.pixelY

      // Base color with pulse
      ctx.globalAlpha = 0.3 + pulse * 0.2
      ctx.fillStyle = color
      ctx.fillRect(x, y, tileSize, tileSize)

      // Inner glow
      ctx.globalAlpha = pulse * 0.4
      const gradient = ctx.createRadialGradient(
        x + tileSize / 2, y + tileSize / 2, 0,
        x + tileSize / 2, y + tileSize / 2, tileSize / 2
      )
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, tileSize, tileSize)
    }
    ctx.globalAlpha = 1
  }


  /**
   * Render trap tiles with warning pattern
   */
  private renderTrapBatch(batch: TileBatch, tileSize: number): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const palette = getCurrentPalette()
    const flash = Math.sin(this.animationTime * 2) > 0.5

    for (const tile of batch.tiles) {
      const x = tile.pixelX
      const y = tile.pixelY

      // Base
      ctx.fillStyle = flash ? palette.trap : 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(x, y, tileSize, tileSize)

      // Warning stripes
      ctx.strokeStyle = palette.trap
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.6
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        ctx.moveTo(x + i * 20, y)
        ctx.lineTo(x + i * 20 + tileSize, y + tileSize)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
  }

  /**
   * Render teleporter tiles with swirl effect
   */
  private renderTeleporterBatch(batch: TileBatch, tileSize: number): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const palette = getCurrentPalette()
    const rotation = this.animationTime * 2

    for (const tile of batch.tiles) {
      const cx = tile.pixelX + tileSize / 2
      const cy = tile.pixelY + tileSize / 2
      const radius = tileSize * 0.4

      // Outer glow
      ctx.globalAlpha = 0.3
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.5)
      gradient.addColorStop(0, palette.teleporter)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Spinning rings
      ctx.globalAlpha = 0.8
      ctx.strokeStyle = palette.teleporter
      ctx.lineWidth = 2
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(cx, cy, radius - i * 8, rotation + i, rotation + i + Math.PI * 1.5)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
  }

  /**
   * Render jump pad tiles with directional arrow
   */
  private renderJumpPadBatch(batch: TileBatch, tileSize: number): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const palette = getCurrentPalette()
    const bounce = Math.abs(Math.sin(this.animationTime * 4)) * 5

    for (const tile of batch.tiles) {
      const cx = tile.pixelX + tileSize / 2
      const cy = tile.pixelY + tileSize / 2 - bounce

      // Base pad
      ctx.fillStyle = palette.jumpPad
      ctx.globalAlpha = 0.4
      ctx.beginPath()
      ctx.arc(cx, cy + bounce, tileSize * 0.4, 0, Math.PI * 2)
      ctx.fill()

      // Arrow pointing up
      ctx.globalAlpha = 0.9
      ctx.fillStyle = palette.jumpPad
      ctx.beginPath()
      ctx.moveTo(cx, cy - 15)
      ctx.lineTo(cx - 12, cy + 5)
      ctx.lineTo(cx + 12, cy + 5)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }


  /**
   * Render default tiles (fallback)
   */
  private renderDefaultBatch(batch: TileBatch, tileSize: number): void {
    if (!this.ctx) return
    const ctx = this.ctx

    ctx.fillStyle = batch.color
    for (const tile of batch.tiles) {
      ctx.fillRect(tile.pixelX, tile.pixelY, tileSize, tileSize)
    }
  }

  /**
   * Render grid lines
   */
  private renderGridLines(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const palette = getCurrentPalette()

    ctx.save()
    ctx.strokeStyle = palette.gridLine
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= ARENA_SIZE.width; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, ARENA_SIZE.height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= ARENA_SIZE.height; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(ARENA_SIZE.width, y)
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * Get render statistics for debugging
   */
  getStats(): { batchCount: number; tileCount: number } {
    let tileCount = 0
    for (const batch of this.batches.values()) {
      tileCount += batch.tiles.length
    }
    return {
      batchCount: this.batches.size,
      tileCount,
    }
  }
}
