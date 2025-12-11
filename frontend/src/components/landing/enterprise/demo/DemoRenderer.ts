/**
 * DemoRenderer - Rendering for demo game
 * 
 * Handles canvas rendering of arena, players, and projectiles
 * 
 * @module landing/enterprise/demo/DemoRenderer
 */

import type { DemoPlayerState, DemoProjectile } from './types'
import type { DemoArenaConfig } from './DemoPhysics'

/**
 * Clear and fill background
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#09090B'
  ctx.fillRect(0, 0, width, height)
}

/**
 * Render arena background with grid
 */
export function renderArena(
  ctx: CanvasRenderingContext2D,
  arena: DemoArenaConfig,
  scaleX: number,
  scaleY: number
): void {
  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1

  const gridSize = 50
  for (let x = 0; x <= arena.width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x * scaleX, 0)
    ctx.lineTo(x * scaleX, arena.height * scaleY)
    ctx.stroke()
  }
  for (let y = 0; y <= arena.height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y * scaleY)
    ctx.lineTo(arena.width * scaleX, y * scaleY)
    ctx.stroke()
  }

  // Border
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)'
  ctx.lineWidth = 2
  ctx.strokeRect(2, 2, arena.width * scaleX - 4, arena.height * scaleY - 4)
}

/**
 * Render a player
 */
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: DemoPlayerState,
  arena: DemoArenaConfig,
  scaleX: number,
  scaleY: number
): void {
  if (!player.isAlive) return

  const x = player.position.x * scaleX
  const y = player.position.y * scaleY
  const r = arena.playerRadius * scaleX

  // Glow
  ctx.beginPath()
  ctx.arc(x, y, r * 1.5, 0, Math.PI * 2)
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5)
  gradient.addColorStop(0, player.color + '40')
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.fill()

  // Body
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = player.color
  ctx.fill()

  // Direction indicator
  const dirX = player.facingRight ? r * 0.8 : -r * 0.8
  ctx.beginPath()
  ctx.arc(x + dirX, y - r * 0.3, r * 0.25, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
}

/**
 * Render projectiles
 */
export function renderProjectiles(
  ctx: CanvasRenderingContext2D,
  projectiles: DemoProjectile[],
  arena: DemoArenaConfig,
  scaleX: number,
  scaleY: number
): void {
  for (const proj of projectiles) {
    ctx.beginPath()
    ctx.arc(
      proj.position.x * scaleX,
      proj.position.y * scaleY,
      arena.projectileRadius * scaleX,
      0,
      Math.PI * 2
    )
    ctx.fillStyle = proj.color
    ctx.shadowColor = proj.color
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

/**
 * Full render pass
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  arena: DemoArenaConfig,
  player1: DemoPlayerState,
  player2: DemoPlayerState,
  projectiles: DemoProjectile[]
): void {
  const w = canvas.width
  const h = canvas.height
  const scaleX = w / arena.width
  const scaleY = h / arena.height

  clearCanvas(ctx, w, h)
  renderArena(ctx, arena, scaleX, scaleY)
  renderProjectiles(ctx, projectiles, arena, scaleX, scaleY)
  renderPlayer(ctx, player1, arena, scaleX, scaleY)
  renderPlayer(ctx, player2, arena, scaleX, scaleY)
}
