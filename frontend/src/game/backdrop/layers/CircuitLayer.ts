/**
 * Circuit Layer
 * Renders animated circuit network with nodes and connections
 */

import type { BackdropLayer, BackdropConfig, CircuitNode } from '../types'
import { BACKDROP_COLORS } from '../types'

const NODE_SPACING = 120
const CONNECTION_DISTANCE = 150
const CONNECTION_PROBABILITY = 0.6

export class CircuitLayer implements BackdropLayer {
  private config: BackdropConfig
  private nodes: CircuitNode[] = []
  private initialized = false
  private time = 0

  constructor(config: BackdropConfig) {
    this.config = config
  }

  private initialize(): void {
    if (this.initialized) return
    this.initialized = true

    const { width, height } = this.config

    // Generate nodes
    for (let x = NODE_SPACING; x < width; x += NODE_SPACING) {
      for (let y = NODE_SPACING; y < height; y += NODE_SPACING) {
        const jitterX = (Math.random() - 0.5) * 40
        const jitterY = (Math.random() - 0.5) * 40

        this.nodes.push({
          x: x + jitterX,
          y: y + jitterY,
          connections: [],
          pulsePhase: Math.random() * Math.PI * 2,
          type: this.randomNodeType(),
        })
      }
    }

    // Connect nearby nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x
        const dy = this.nodes[i].y - this.nodes[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONNECTION_DISTANCE && Math.random() < CONNECTION_PROBABILITY) {
          this.nodes[i].connections.push(j)
        }
      }
    }
  }

  private randomNodeType(): CircuitNode['type'] {
    const r = Math.random()
    if (r > 0.7) return 'processor'
    if (r > 0.4) return 'junction'
    return 'endpoint'
  }

  update(_deltaTime: number, time: number): void {
    this.time = time
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.initialize()

    ctx.save()

    // Draw connections first (behind nodes)
    for (const node of this.nodes) {
      for (const connIdx of node.connections) {
        this.renderConnection(ctx, node, this.nodes[connIdx])
      }
    }

    // Draw nodes
    for (const node of this.nodes) {
      this.renderNode(ctx, node)
    }

    ctx.restore()
  }

  private renderConnection(ctx: CanvasRenderingContext2D, from: CircuitNode, to: CircuitNode): void {
    const pulsePos = (this.time * 0.3 + from.pulsePhase) % 1

    // Draw line
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    const midX = (from.x + to.x) / 2
    ctx.lineTo(midX, from.y)
    ctx.lineTo(midX, to.y)
    ctx.lineTo(to.x, to.y)

    ctx.strokeStyle = BACKDROP_COLORS.circuitPrimary
    ctx.globalAlpha = 0.15
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw traveling pulse
    const px = from.x + (to.x - from.x) * pulsePos
    const py = from.y + (to.y - from.y) * pulsePos

    ctx.beginPath()
    ctx.arc(px, py, 2, 0, Math.PI * 2)
    ctx.fillStyle = BACKDROP_COLORS.circuitPrimary
    ctx.globalAlpha = 0.6
    ctx.fill()
  }

  private renderNode(ctx: CanvasRenderingContext2D, node: CircuitNode): void {
    const pulse = Math.sin(this.time * 2 + node.pulsePhase) * 0.5 + 0.5
    const size = node.type === 'processor' ? 6 : node.type === 'junction' ? 4 : 2
    const color = node.type === 'processor' ? BACKDROP_COLORS.circuitSecondary : BACKDROP_COLORS.circuitPrimary
    const glow = node.type === 'processor' ? BACKDROP_COLORS.glowMagenta : BACKDROP_COLORS.glowCyan

    // Glow
    ctx.beginPath()
    ctx.arc(node.x, node.y, size + 4, 0, Math.PI * 2)
    ctx.fillStyle = glow
    ctx.globalAlpha = 0.2 + pulse * 0.2
    ctx.fill()

    // Core
    ctx.beginPath()
    ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.4 + pulse * 0.4
    ctx.fill()
  }
}
