/**
 * Hex Grid Layer
 * Renders animated hexagonal grid pattern
 */

import type { BackdropLayer, BackdropConfig, HexCell } from '../types'
import { BACKDROP_COLORS } from '../types'

const HEX_SIZE = 40

export class HexGridLayer implements BackdropLayer {
  private config: BackdropConfig
  private cells: HexCell[] = []
  private initialized = false

  constructor(config: BackdropConfig) {
    this.config = config
  }

  private initialize(): void {
    if (this.initialized) return
    this.initialized = true

    const { width, height } = this.config
    const hexHeight = HEX_SIZE * Math.sqrt(3)

    for (let row = 0; row < height / hexHeight + 1; row++) {
      for (let col = 0; col < width / (HEX_SIZE * 1.5) + 1; col++) {
        const x = col * HEX_SIZE * 1.5
        const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0)
        this.cells.push({ x, y, phase: Math.random() * Math.PI * 2 })
      }
    }
  }

  update(_deltaTime: number, _time: number): void {
    // Cells are static, animation handled in render via time
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.initialize()

    const time = performance.now() / 1000

    ctx.save()
    ctx.strokeStyle = BACKDROP_COLORS.gridLine
    ctx.lineWidth = 1

    for (const cell of this.cells) {
      const pulse = Math.sin(time * 0.5 + cell.phase) * 0.5 + 0.5
      ctx.globalAlpha = 0.03 + pulse * 0.04
      this.drawHexagon(ctx, cell.x, cell.y, HEX_SIZE)
    }

    ctx.restore()
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const x = cx + size * Math.cos(angle)
      const y = cy + size * Math.sin(angle)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.stroke()
  }
}
