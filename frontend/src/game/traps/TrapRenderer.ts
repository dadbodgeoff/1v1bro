/**
 * TrapRenderer - Default theme trap rendering
 * 
 * @module traps/TrapRenderer
 */

import type { Vector2 } from '../types'
import { arenaAssets } from '../assets/ArenaAssetLoader'

/**
 * Render armed trap with mine icon
 */
export function renderArmedTrap(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  radius: number
): void {
  const time = Date.now() / 1000
  const pulse = 0.5 + 0.5 * Math.sin(time * 4)

  // Draw mine icon from image asset
  const iconSize = radius * 2.2
  ctx.globalAlpha = 0.85 + pulse * 0.15
  const drawn = arenaAssets.drawCentered(ctx, 'trap-mine', position.x, position.y, iconSize, iconSize)
  ctx.globalAlpha = 1

  // Fallback if image not loaded
  if (!drawn) {
    const gradient = ctx.createRadialGradient(
      position.x, position.y - radius * 0.3, 0,
      position.x, position.y, radius
    )
    gradient.addColorStop(0, `rgba(255, 120, 80, ${0.6 + pulse * 0.3})`)
    gradient.addColorStop(0.6, `rgba(200, 50, 50, ${0.5 + pulse * 0.3})`)
    gradient.addColorStop(1, `rgba(150, 30, 30, ${0.4 + pulse * 0.2})`)
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('!', position.x, position.y)
  }
}

/**
 * Render warning state - flashing danger indicator before explosion
 */
export function renderWarningTrap(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  radius: number
): void {
  const time = Date.now() / 1000
  const flash = Math.sin(time * 30) > 0 ? 1 : 0.3

  // Expanding danger ring
  ctx.strokeStyle = `rgba(255, 50, 50, ${flash})`
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2)
  ctx.stroke()

  // Inner danger zone fill
  const gradient = ctx.createRadialGradient(
    position.x, position.y, 0,
    position.x, position.y, radius * 1.2
  )
  gradient.addColorStop(0, `rgba(255, 100, 50, ${0.6 * flash})`)
  gradient.addColorStop(1, `rgba(255, 50, 50, ${0.3 * flash})`)
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius * 1.2, 0, Math.PI * 2)
  ctx.fill()

  // Draw mine icon (dimmer)
  const iconSize = radius * 2.2
  ctx.globalAlpha = 0.5 + flash * 0.5
  arenaAssets.drawCentered(ctx, 'trap-mine', position.x, position.y, iconSize, iconSize)
  ctx.globalAlpha = 1

  // Warning text
  ctx.fillStyle = `rgba(255, 255, 255, ${flash})`
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', position.x, position.y - radius - 15)
}

/**
 * Render triggered trap with explosion effect
 */
export function renderTriggeredTrap(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  radius: number
): void {
  const time = Date.now() / 1000
  const expand = ((time * 10) % 1)
  
  for (let i = 0; i < 3; i++) {
    const ringExpand = (expand + i * 0.3) % 1
    const ringRadius = radius * (1 + ringExpand * 2)
    const alpha = 1 - ringExpand
    
    ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`
    ctx.lineWidth = 4 - ringExpand * 3
    ctx.beginPath()
    ctx.arc(position.x, position.y, ringRadius, 0, Math.PI * 2)
    ctx.stroke()
  }

  const gradient = ctx.createRadialGradient(
    position.x, position.y, 0,
    position.x, position.y, radius * 1.5
  )
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.7)')
  gradient.addColorStop(1, 'rgba(255, 100, 50, 0)')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Render cooldown trap with progress indicator
 */
export function renderCooldownTrap(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  radius: number,
  cooldown: number,
  cooldownRemaining: number
): void {
  const gradient = ctx.createRadialGradient(
    position.x, position.y, 0,
    position.x, position.y, radius
  )
  gradient.addColorStop(0, 'rgba(80, 80, 80, 0.4)')
  gradient.addColorStop(1, 'rgba(50, 50, 50, 0.2)')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)'
  ctx.lineWidth = 2
  ctx.stroke()

  const progress = 1 - (cooldownRemaining / cooldown)
  ctx.strokeStyle = `rgba(255, 150, 100, ${0.4 + progress * 0.4})`
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(
    position.x, 
    position.y, 
    radius - 6, 
    -Math.PI / 2, 
    -Math.PI / 2 + progress * Math.PI * 2
  )
  ctx.stroke()
  ctx.lineCap = 'butt'

  const secondsLeft = Math.ceil(cooldownRemaining)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${secondsLeft}`, position.x, position.y)
}
