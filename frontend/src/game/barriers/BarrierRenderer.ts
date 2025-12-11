/**
 * BarrierRenderer - Default theme barrier rendering
 * 
 * @module barriers/BarrierRenderer
 */

import type { BarrierState } from '../arena/types'
import type { OneWayBarrier } from './OneWayBarrier'

/**
 * Render a barrier with default space theme
 */
export function renderBarrier(
  ctx: CanvasRenderingContext2D,
  barrier: BarrierState,
  oneWay?: OneWayBarrier
): void {
  const { position, size, type, damageState } = barrier
  const time = Date.now() / 1000
  const pulse = 0.6 + 0.4 * Math.sin(time * 1.5)

  ctx.save()

  const isHorizontal = size.x > size.y
  
  // Main body - dark metallic hull
  const coreGradient = isHorizontal
    ? ctx.createLinearGradient(position.x, position.y, position.x, position.y + size.y)
    : ctx.createLinearGradient(position.x, position.y, position.x + size.x, position.y)
  
  coreGradient.addColorStop(0, 'rgba(60, 65, 75, 0.95)')
  coreGradient.addColorStop(0.2, 'rgba(35, 40, 50, 0.98)')
  coreGradient.addColorStop(0.8, 'rgba(35, 40, 50, 0.98)')
  coreGradient.addColorStop(1, 'rgba(50, 55, 65, 0.95)')
  
  ctx.fillStyle = coreGradient
  ctx.fillRect(position.x, position.y, size.x, size.y)

  // Subtle outer edge highlight
  ctx.strokeStyle = 'rgba(100, 105, 115, 0.8)'
  ctx.lineWidth = 2
  ctx.strokeRect(position.x, position.y, size.x, size.y)

  // Inner bevel
  ctx.strokeStyle = 'rgba(20, 25, 35, 0.9)'
  ctx.lineWidth = 1
  ctx.strokeRect(position.x + 2, position.y + 2, size.x - 4, size.y - 4)

  renderPanelSeams(ctx, barrier)
  renderWarningLights(ctx, barrier, pulse)

  if (type === 'destructible' && damageState !== 'intact') {
    renderCracks(ctx, barrier)
  }

  if (type === 'one_way' && oneWay) {
    renderOneWayIndicator(ctx, barrier, oneWay)
  }

  ctx.restore()
}

/**
 * Render panel seam lines
 */
export function renderPanelSeams(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
  const { position, size } = barrier
  const panelSize = 35

  ctx.strokeStyle = 'rgba(20, 25, 35, 0.6)'
  ctx.lineWidth = 1

  for (let y = panelSize; y < size.y; y += panelSize) {
    ctx.beginPath()
    ctx.moveTo(position.x + 3, position.y + y)
    ctx.lineTo(position.x + size.x - 3, position.y + y)
    ctx.stroke()
  }

  for (let x = panelSize; x < size.x; x += panelSize) {
    ctx.beginPath()
    ctx.moveTo(position.x + x, position.y + 3)
    ctx.lineTo(position.x + x, position.y + size.y - 3)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(80, 85, 95, 0.4)'
  for (let y = panelSize; y < size.y; y += panelSize) {
    ctx.beginPath()
    ctx.moveTo(position.x + 3, position.y + y + 1)
    ctx.lineTo(position.x + size.x - 3, position.y + y + 1)
    ctx.stroke()
  }
}

/**
 * Render warning lights at corners
 */
export function renderWarningLights(
  ctx: CanvasRenderingContext2D,
  barrier: BarrierState,
  pulse: number
): void {
  const { position, size } = barrier
  const lightSize = 4
  const inset = 6
  
  ctx.fillStyle = `rgba(255, 150, 50, ${0.3 + pulse * 0.4})`
  ctx.shadowColor = 'rgba(255, 120, 30, 0.5)'
  ctx.shadowBlur = 6 * pulse
  
  ctx.beginPath()
  ctx.arc(position.x + inset, position.y + inset, lightSize, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.beginPath()
  ctx.arc(position.x + size.x - inset, position.y + inset, lightSize, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.beginPath()
  ctx.arc(position.x + inset, position.y + size.y - inset, lightSize, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.beginPath()
  ctx.arc(position.x + size.x - inset, position.y + size.y - inset, lightSize, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.shadowBlur = 0
}

/**
 * Render crack effects on damaged barriers
 */
export function renderCracks(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
  const { position, size, damageState } = barrier
  
  ctx.strokeStyle = '#00000066'
  ctx.lineWidth = 2

  const crackCount = damageState === 'cracked' ? 2 : 4

  for (let i = 0; i < crackCount; i++) {
    ctx.beginPath()
    const startX = position.x + Math.random() * size.x
    const startY = position.y + Math.random() * size.y
    ctx.moveTo(startX, startY)
    ctx.lineTo(startX + (Math.random() - 0.5) * 30, startY + (Math.random() - 0.5) * 30)
    ctx.stroke()
  }
}

/**
 * Render direction indicator for one-way barriers
 */
export function renderOneWayIndicator(
  ctx: CanvasRenderingContext2D,
  barrier: BarrierState,
  oneWay: OneWayBarrier
): void {
  const { position, size } = barrier
  const centerX = position.x + size.x / 2
  const centerY = position.y + size.y / 2
  const dir = oneWay.getPhaseDirection()

  ctx.fillStyle = '#00ffff88'
  ctx.beginPath()
  ctx.moveTo(centerX, centerY)
  ctx.lineTo(centerX + dir.x * 20 - dir.y * 10, centerY + dir.y * 20 + dir.x * 10)
  ctx.lineTo(centerX + dir.x * 20 + dir.y * 10, centerY + dir.y * 20 - dir.x * 10)
  ctx.closePath()
  ctx.fill()
}
