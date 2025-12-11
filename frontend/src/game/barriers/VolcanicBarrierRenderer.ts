/**
 * VolcanicBarrierRenderer - Volcanic theme barrier rendering
 * 
 * @module barriers/VolcanicBarrierRenderer
 */

import type { BarrierState } from '../arena/types'
import type { OneWayBarrier } from './OneWayBarrier'
import { VOLCANIC_COLORS } from '../backdrop/types'
import { renderOneWayIndicator } from './BarrierRenderer'

/**
 * Render volcanic obsidian barrier
 */
export function renderVolcanicBarrier(
  ctx: CanvasRenderingContext2D,
  barrier: BarrierState,
  oneWay?: OneWayBarrier
): void {
  const { position, size, type, damageState, health, maxHealth } = barrier
  const time = Date.now() / 1000
  const pulse = 0.6 + 0.4 * Math.sin(time * 2)

  ctx.save()

  const isHorizontal = size.x > size.y
  const obsidianGradient = isHorizontal
    ? ctx.createLinearGradient(position.x, position.y, position.x, position.y + size.y)
    : ctx.createLinearGradient(position.x, position.y, position.x + size.x, position.y)

  obsidianGradient.addColorStop(0, '#2d2d2d')
  obsidianGradient.addColorStop(0.3, VOLCANIC_COLORS.obsidian)
  obsidianGradient.addColorStop(0.7, VOLCANIC_COLORS.obsidian)
  obsidianGradient.addColorStop(1, '#2d2d2d')

  ctx.fillStyle = obsidianGradient
  ctx.fillRect(position.x, position.y, size.x, size.y)

  ctx.save()
  ctx.shadowColor = VOLCANIC_COLORS.lavaGlow
  ctx.shadowBlur = 8 * pulse
  ctx.strokeStyle = VOLCANIC_COLORS.lavaDark
  ctx.lineWidth = 2
  ctx.strokeRect(position.x, position.y, size.x, size.y)
  ctx.restore()

  ctx.strokeStyle = `rgba(255, 102, 0, ${0.3 * pulse})`
  ctx.lineWidth = 1
  ctx.strokeRect(position.x + 2, position.y + 2, size.x - 4, size.y - 4)

  renderVolcanicTexture(ctx, barrier)

  if (type === 'destructible') {
    const crackIntensity = 1 - (health / maxHealth)
    renderVolcanicCracks(ctx, barrier, crackIntensity)
  }

  if (type === 'half' || damageState !== 'intact') {
    renderVolcanicCracks(ctx, barrier, type === 'half' ? 0.3 : 0.5)
  }

  if (type === 'one_way' && oneWay) {
    renderOneWayIndicator(ctx, barrier, oneWay)
  }

  ctx.restore()
}

/**
 * Render volcanic rock texture
 */
export function renderVolcanicTexture(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
  const { position, size } = barrier

  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#0a0a0a'

  const seed = position.x * 7 + position.y * 13
  for (let i = 0; i < 5; i++) {
    const x = position.x + ((seed * (i + 1) * 17) % size.x)
    const y = position.y + ((seed * (i + 1) * 23) % size.y)
    const w = 8 + ((seed * (i + 1) * 7) % 15)
    const h = 6 + ((seed * (i + 1) * 11) % 10)

    ctx.fillRect(x, y, w, h)
  }

  ctx.globalAlpha = 1
}

/**
 * Render volcanic cracks with lava glow
 */
export function renderVolcanicCracks(
  ctx: CanvasRenderingContext2D,
  barrier: BarrierState,
  intensity: number
): void {
  if (intensity <= 0) return

  const { position, size } = barrier
  const time = Date.now() / 1000
  const glowPulse = 0.5 + 0.5 * Math.sin(time * 3)

  ctx.save()
  ctx.shadowColor = VOLCANIC_COLORS.lavaCore
  ctx.shadowBlur = 6 * intensity * glowPulse
  ctx.strokeStyle = VOLCANIC_COLORS.crack
  ctx.lineWidth = 2 * intensity

  const crackCount = Math.floor(2 + intensity * 4)
  const seed = position.x * 11 + position.y * 7

  for (let i = 0; i < crackCount; i++) {
    const startX = position.x + ((seed * (i + 1) * 13) % size.x)
    const startY = position.y + ((seed * (i + 1) * 17) % size.y)
    const endX = startX + ((seed * (i + 1) * 7) % 30) - 15
    const endY = startY + ((seed * (i + 1) * 11) % 30) - 15

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(
      Math.max(position.x, Math.min(position.x + size.x, endX)),
      Math.max(position.y, Math.min(position.y + size.y, endY))
    )
    ctx.stroke()
  }

  ctx.restore()
}
