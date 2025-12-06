/**
 * Data Stream Layer
 * Renders Matrix-style falling character streams
 */

import type { BackdropLayer, BackdropConfig, DataStream } from '../types'

const STREAM_COUNT = 30
const CHAR_HEIGHT = 14

export class DataStreamLayer implements BackdropLayer {
  private config: BackdropConfig
  private streams: DataStream[] = []
  private initialized = false

  constructor(config: BackdropConfig) {
    this.config = config
  }

  private initialize(): void {
    if (this.initialized) return
    this.initialized = true

    const { width, height } = this.config

    for (let i = 0; i < STREAM_COUNT; i++) {
      this.streams.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 50 + Math.random() * 100,
        length: 5 + Math.floor(Math.random() * 15),
        alpha: 0.1 + Math.random() * 0.2,
      })
    }
  }

  update(deltaTime: number, _time: number): void {
    this.initialize()

    const { height } = this.config

    for (const stream of this.streams) {
      stream.y += stream.speed * deltaTime
      if (stream.y > height + 100) {
        stream.y = -50
        stream.x = Math.random() * this.config.width
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.initialize()

    const { height } = this.config

    ctx.save()
    ctx.font = '12px monospace'

    for (const stream of this.streams) {
      for (let i = 0; i < stream.length; i++) {
        const y = stream.y - i * CHAR_HEIGHT
        if (y < -20 || y > height + 20) continue

        const fadeAlpha = i === 0 ? stream.alpha : stream.alpha * (1 - i / stream.length) * 0.7
        ctx.globalAlpha = fadeAlpha

        const hue = 160 + (i / stream.length) * 20
        ctx.fillStyle = `hsl(${hue}, 100%, ${60 - i * 2}%)`

        const char = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96))
        ctx.fillText(char, stream.x, y)
      }
    }

    ctx.restore()
  }
}
