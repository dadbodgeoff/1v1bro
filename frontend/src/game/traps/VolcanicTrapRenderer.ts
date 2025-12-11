/**
 * VolcanicTrapRenderer - Volcanic theme trap rendering
 * 
 * @module traps/VolcanicTrapRenderer
 */

import type { Vector2 } from '../types'
import { VOLCANIC_COLORS } from '../backdrop/types'

/**
 * Render volcanic armed trap - lava vent with bubbling magma
 */
export function renderVolcanicArmedTrap(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  radius: number
): void {
  const time = Date.now() / 1000
  const pulse = 0.5 + 0.5 * Math.sin(time * 3)

  // Dark rock ring (vent opening)
  ctx.fillStyle = VOLCANIC_COLORS.obsidian
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius + 4, 0, Math.PI * 2)
  ctx.fill()

  // Glowing magma core
  const gradient = ctx.createRadialGradient(
    position.x, position.y, 0,
    position.x, position.y, radius
  )
  gradient.addColorStop(0, VOLCANIC_COLORS.fire)
  gradient.addColorStop(0.4, VOLCANIC_COLORS.lavaCore)
  gradient.addColorStop(0.8, VOLCANIC_COLORS.lavaDark)
  gradient.addColorStop(1, VOLCANIC_COLORS.obsidian)

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Bubbling effect
  const bubbleCount = 3
  for (let i = 0; i < bubbleCount; i++) {
    const angle = (time * 1.5 + i * (Math.PI * 2 / bubbleCount)) % (Math.PI * 2)
    const bx = position.x + Math.cos(angle) * radius * 0.4
    const by = position.y + Math.sin(angle) * radius * 0.4
    const bubbleSize = 3 + Math.sin(time * 4 + i) * 2

    ctx.fillStyle = `rgba(255, 200, 100, ${0.6 * pulse})`
    ctx.beginPath()
    ctx.arc(bx, by, bubbleSize, 0, Math.PI * 2)
    ctx.fill()
  }

  // Glow effect
  ctx.shadowColor = VOLCANIC_COLORS.lavaCore
  ctx.shadowBlur = 10 * pulse
  ctx.strokeStyle = VOLCANIC_COLORS.lavaGlow
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
  ctx.stroke()
}

/**
 * Render volcanic warning trap - ground cracks before eruption
 */
export function renderVolcanicWarningTrap(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  radius: number
): void {
  const time = Date.now() / 1000
  const flash = Math.sin(time * 25) > 0 ? 1 : 0.4

  // Expanding danger ring with lava glow
  ctx.shadowColor = VOLCANIC_COLORS.lavaCore
  ctx.shadowBlur = 15 * flash
  ctx.strokeStyle = VOLCANIC_COLORS.crack
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2)
  ctx.stroke()

  // Ground crack pattern
  ctx.strokeStyle = `rgba(255, 34, 0, ${flash})`
  ctx.lineWidth = 3
  const crackCount = 6
  for (let i = 0; i < crackCount; i++) {
    const angle = (i / crackCount) * Math.PI * 2
    const innerR = radius * 0.3
    const outerR = radius * 1.3
    ctx.beginPath()
    ctx.moveTo(
      position.x + Math.cos(angle) * innerR,
      position.y + Math.sin(angle) * innerR
    )
    ctx.lineTo(
      position.x + Math.cos(angle) * outerR,
      position.y + Math.sin(angle) * outerR
    )
    ctx.stroke()
  }

  // Inner lava glow
  const gradient = ctx.createRadialGradient(
    position.x, position.y, 0,
    position.x, position.y, radius
  )
  gradient.addColorStop(0, `rgba(255, 68, 0, ${0.8 * flash})`)
  gradient.addColorStop(0.5, `rgba(255, 102, 0, ${0.5 * flash})`)
  gradient.addColorStop(1, `rgba(204, 51, 0, ${0.3 * flash})`)

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Render volcanic triggered trap - lava geyser burst
 */
export function renderVolcanicTriggeredTrap(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  radius: number
): void {
  const time = Date.now() / 1000
  const expand = ((time * 8) % 1)

  // Lava burst rings
  for (let i = 0; i < 4; i++) {
    const ringExpand = (expand + i * 0.25) % 1
    const ringRadius = radius * (1 + ringExpand * 2.5)
    const alpha = 1 - ringExpand

    ctx.strokeStyle = `rgba(255, 102, 0, ${alpha})`
    ctx.lineWidth = 5 - ringExpand * 4
    ctx.beginPath()
    ctx.arc(position.x, position.y, ringRadius, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Bright lava center
  const gradient = ctx.createRadialGradient(
    position.x, position.y, 0,
    position.x, position.y, radius * 2
  )
  gradient.addColorStop(0, 'rgba(255, 255, 200, 0.95)')
  gradient.addColorStop(0.2, VOLCANIC_COLORS.fire)
  gradient.addColorStop(0.5, VOLCANIC_COLORS.lavaCore)
  gradient.addColorStop(1, 'transparent')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius * 2, 0, Math.PI * 2)
  ctx.fill()

  // Lava splash particles
  const particleCount = 8
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + time * 2
    const dist = radius * (0.5 + expand * 1.5)
    const px = position.x + Math.cos(angle) * dist
    const py = position.y + Math.sin(angle) * dist - expand * 20

    ctx.fillStyle = `rgba(255, 136, 68, ${1 - expand})`
    ctx.beginPath()
    ctx.arc(px, py, 4 * (1 - expand * 0.5), 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * Render volcanic cooldown trap - smoldering embers
 */
export function renderVolcanicCooldownTrap(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  radius: number,
  cooldown: number,
  cooldownRemaining: number
): void {
  const time = Date.now() / 1000
  const progress = 1 - (cooldownRemaining / cooldown)

  // Cooled rock base
  const gradient = ctx.createRadialGradient(
    position.x, position.y, 0,
    position.x, position.y, radius
  )
  gradient.addColorStop(0, `rgba(45, 45, 45, ${0.5 + progress * 0.3})`)
  gradient.addColorStop(1, `rgba(26, 26, 26, ${0.4 + progress * 0.2})`)

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Smoldering ember particles
  const emberCount = 4
  for (let i = 0; i < emberCount; i++) {
    const angle = (time * 0.5 + i * (Math.PI * 2 / emberCount)) % (Math.PI * 2)
    const dist = radius * 0.5
    const ex = position.x + Math.cos(angle) * dist
    const ey = position.y + Math.sin(angle) * dist
    const emberAlpha = 0.3 + Math.sin(time * 3 + i) * 0.2

    ctx.fillStyle = `rgba(255, 136, 68, ${emberAlpha * progress})`
    ctx.beginPath()
    ctx.arc(ex, ey, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // Progress arc (recharging with lava color)
  ctx.strokeStyle = `rgba(255, 102, 0, ${0.4 + progress * 0.5})`
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(
    position.x,
    position.y,
    radius - 4,
    -Math.PI / 2,
    -Math.PI / 2 + progress * Math.PI * 2
  )
  ctx.stroke()
  ctx.lineCap = 'butt'

  // Cooldown timer
  const secondsLeft = Math.ceil(cooldownRemaining)
  ctx.fillStyle = `rgba(255, 200, 150, ${0.6 + progress * 0.4})`
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${secondsLeft}`, position.x, position.y)
}
