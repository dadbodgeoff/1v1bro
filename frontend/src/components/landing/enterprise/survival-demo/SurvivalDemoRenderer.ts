/**
 * SurvivalDemoRenderer - Canvas rendering for survival demo
 * 
 * Renders the endless runner scene with pseudo-3D perspective.
 * Mimics the visual style of the full survival mode.
 * 
 * @module landing/enterprise/survival-demo/SurvivalDemoRenderer
 */

import type { DemoRunnerState, DemoObstacle, DemoCollectible, DemoTrackTile, DemoGameState } from './types'
import { DEMO_TRACK, getGroundY } from './SurvivalDemoPhysics'

// Colors matching the survival mode theme
const COLORS = {
  background: '#09090B',
  trackBase: '#1a1a2e',
  trackLine: '#F97316',
  trackLineGlow: 'rgba(249, 115, 22, 0.3)',
  runner: '#F97316',
  runnerGlow: 'rgba(249, 115, 22, 0.5)',
  obstacle: '#ef4444',
  obstacleGlow: 'rgba(239, 68, 68, 0.4)',
  collectibleGem: '#a855f7',
  collectibleCoin: '#fbbf24',
  stars: '#ffffff',
  nebula1: '#1a0a2e',
  nebula2: '#4c1d95',
}

/**
 * Clear canvas with space background
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#0a0a1a')
  gradient.addColorStop(0.5, '#09090B')
  gradient.addColorStop(1, '#0d0d1a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

/**
 * Render starfield background
 */
export function renderStars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
): void {
  ctx.fillStyle = COLORS.stars
  
  // Static stars (seeded positions)
  const starCount = 80
  for (let i = 0; i < starCount; i++) {
    const seed = i * 1337
    const x = (seed * 7919) % width
    const y = ((seed * 104729) % (height * 0.6))
    const size = 0.5 + (seed % 3) * 0.5
    const twinkle = Math.sin(time * 2 + seed) * 0.3 + 0.7
    
    ctx.globalAlpha = twinkle * 0.8
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/**
 * Render nebula clouds
 */
export function renderNebula(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
): void {
  // Subtle nebula glow
  const nebulaGradient = ctx.createRadialGradient(
    width * 0.7 + Math.sin(time * 0.1) * 50,
    height * 0.3,
    0,
    width * 0.7,
    height * 0.3,
    300
  )
  nebulaGradient.addColorStop(0, 'rgba(76, 29, 149, 0.15)')
  nebulaGradient.addColorStop(0.5, 'rgba(26, 10, 46, 0.1)')
  nebulaGradient.addColorStop(1, 'transparent')
  
  ctx.fillStyle = nebulaGradient
  ctx.fillRect(0, 0, width, height)
}

/**
 * Render the track with perspective
 */
export function renderTrack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  _tiles: DemoTrackTile[],
  viewZ: number
): void {
  const horizonY = height * 0.35
  
  // Track surface gradient
  const trackGradient = ctx.createLinearGradient(0, horizonY, 0, height)
  trackGradient.addColorStop(0, 'rgba(26, 26, 46, 0.3)')
  trackGradient.addColorStop(1, 'rgba(26, 26, 46, 0.8)')
  
  // Draw track trapezoid
  ctx.beginPath()
  ctx.moveTo(width * 0.15, height) // Bottom left
  ctx.lineTo(width * 0.85, height) // Bottom right
  ctx.lineTo(width * 0.6, horizonY) // Top right
  ctx.lineTo(width * 0.4, horizonY) // Top left
  ctx.closePath()
  ctx.fillStyle = trackGradient
  ctx.fill()
  
  // Lane lines with perspective
  const lanes = [0.35, 0.5, 0.65] // Lane center positions
  
  for (const laneX of lanes) {
    ctx.beginPath()
    ctx.moveTo(width * laneX, height)
    ctx.lineTo(width * (0.4 + (laneX - 0.35) * 0.67), horizonY)
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.2)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
  
  // Horizontal track lines (moving with viewZ)
  const lineSpacing = 80
  const lineCount = 12
  
  for (let i = 0; i < lineCount; i++) {
    const baseZ = (i * lineSpacing - (viewZ % lineSpacing)) / (lineCount * lineSpacing)
    const perspectiveY = horizonY + (height - horizonY) * (1 - Math.pow(1 - baseZ, 2))
    
    if (perspectiveY < horizonY || perspectiveY > height) continue
    
    const perspectiveScale = (perspectiveY - horizonY) / (height - horizonY)
    const leftX = width * (0.15 + (0.4 - 0.15) * (1 - perspectiveScale))
    const rightX = width * (0.85 - (0.85 - 0.6) * (1 - perspectiveScale))
    
    ctx.beginPath()
    ctx.moveTo(leftX, perspectiveY)
    ctx.lineTo(rightX, perspectiveY)
    ctx.strokeStyle = `rgba(249, 115, 22, ${0.1 + perspectiveScale * 0.2})`
    ctx.lineWidth = 1 + perspectiveScale
    ctx.stroke()
  }
  
  // Edge glow
  ctx.strokeStyle = COLORS.trackLineGlow
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(width * 0.15, height)
  ctx.lineTo(width * 0.4, horizonY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(width * 0.85, height)
  ctx.lineTo(width * 0.6, horizonY)
  ctx.stroke()
}

/**
 * Convert lane to screen X position
 */
function laneToScreenX(laneX: number, width: number): number {
  // Map lane positions to screen space
  const normalized = (laneX - 200) / 400 // 0 to 1
  return width * (0.25 + normalized * 0.5)
}

/**
 * Render the runner character
 */
export function renderRunner(
  ctx: CanvasRenderingContext2D,
  runner: DemoRunnerState,
  width: number,
  _height: number,
  time: number
): void {
  const screenX = laneToScreenX(runner.laneX, width)
  const screenY = runner.y
  
  // Runner dimensions
  const runnerWidth = runner.isSliding ? 45 : 30
  const runnerHeight = runner.isSliding ? 25 : 55
  
  // Glow effect
  const glowGradient = ctx.createRadialGradient(
    screenX, screenY - runnerHeight / 2,
    0,
    screenX, screenY - runnerHeight / 2,
    runnerHeight
  )
  glowGradient.addColorStop(0, COLORS.runnerGlow)
  glowGradient.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGradient
  ctx.fillRect(screenX - runnerHeight, screenY - runnerHeight * 1.5, runnerHeight * 2, runnerHeight * 2)
  
  // Body
  ctx.fillStyle = COLORS.runner
  
  if (runner.isSliding) {
    // Sliding pose - horizontal rectangle
    ctx.fillRect(screenX - runnerWidth / 2, screenY - runnerHeight, runnerWidth, runnerHeight)
  } else {
    // Running/jumping pose
    const bobY = runner.isJumping ? 0 : Math.sin(time * 12) * 3
    
    // Torso
    ctx.fillRect(screenX - runnerWidth / 2, screenY - runnerHeight + bobY, runnerWidth, runnerHeight * 0.6)
    
    // Head
    ctx.beginPath()
    ctx.arc(screenX, screenY - runnerHeight - 8 + bobY, 12, 0, Math.PI * 2)
    ctx.fill()
    
    // Legs (animated)
    const legPhase = runner.isJumping ? 0.5 : (time * 12) % (Math.PI * 2)
    const leg1Offset = Math.sin(legPhase) * 8
    const leg2Offset = Math.sin(legPhase + Math.PI) * 8
    
    ctx.fillRect(screenX - 8, screenY - runnerHeight * 0.4 + bobY, 6, 20)
    ctx.fillRect(screenX + 2, screenY - runnerHeight * 0.4 + bobY, 6, 20)
    
    if (!runner.isJumping) {
      // Foot positions
      ctx.fillRect(screenX - 10 + leg1Offset, screenY - 5, 8, 5)
      ctx.fillRect(screenX + 2 + leg2Offset, screenY - 5, 8, 5)
    }
  }
  
  // Trail effect when running fast
  ctx.globalAlpha = 0.3
  ctx.fillStyle = COLORS.runner
  for (let i = 1; i <= 3; i++) {
    const trailX = screenX - i * 8
    const trailAlpha = 0.3 - i * 0.1
    ctx.globalAlpha = trailAlpha
    ctx.fillRect(trailX - 5, screenY - runnerHeight * 0.8, 10, runnerHeight * 0.6)
  }
  ctx.globalAlpha = 1
}

/**
 * Render obstacles with perspective
 */
export function renderObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: DemoObstacle[],
  width: number,
  height: number,
  viewZ: number
): void {
  const horizonY = height * 0.35
  const groundY = getGroundY()
  
  // Sort by Z for proper depth ordering
  const sorted = [...obstacles].sort((a, b) => b.z - a.z)
  
  for (const obstacle of sorted) {
    if (obstacle.cleared) continue
    
    const relativeZ = obstacle.z - viewZ
    if (relativeZ < 0 || relativeZ > 500) continue
    
    // Perspective calculation
    const perspectiveT = 1 - relativeZ / 500
    const perspectiveY = horizonY + (groundY - horizonY) * perspectiveT
    const scale = perspectiveT * 0.8 + 0.2
    
    const screenX = laneToScreenX(DEMO_TRACK.lanePositions[obstacle.lane], width)
    
    // Obstacle dimensions with perspective
    const obsWidth = obstacle.width * scale
    const obsHeight = obstacle.height * scale
    
    // Glow
    ctx.shadowColor = COLORS.obstacleGlow
    ctx.shadowBlur = 15 * scale
    
    ctx.fillStyle = COLORS.obstacle
    
    if (obstacle.type === 'overhead') {
      // Overhead bar
      ctx.fillRect(
        screenX - obsWidth / 2,
        perspectiveY - obsHeight - 40 * scale,
        obsWidth,
        obsHeight * 0.5
      )
    } else if (obstacle.type === 'spike') {
      // Spike triangle
      ctx.beginPath()
      ctx.moveTo(screenX, perspectiveY - obsHeight)
      ctx.lineTo(screenX - obsWidth / 2, perspectiveY)
      ctx.lineTo(screenX + obsWidth / 2, perspectiveY)
      ctx.closePath()
      ctx.fill()
    } else if (obstacle.type === 'gap') {
      // Gap in track (dark rectangle)
      ctx.fillStyle = '#000'
      ctx.fillRect(
        screenX - obsWidth / 2,
        perspectiveY - 5,
        obsWidth,
        20 * scale
      )
    } else {
      // Barrier block
      ctx.fillRect(
        screenX - obsWidth / 2,
        perspectiveY - obsHeight,
        obsWidth,
        obsHeight
      )
    }
    
    ctx.shadowBlur = 0
  }
}

/**
 * Render collectibles
 */
export function renderCollectibles(
  ctx: CanvasRenderingContext2D,
  collectibles: DemoCollectible[],
  width: number,
  height: number,
  viewZ: number,
  time: number
): void {
  const horizonY = height * 0.35
  const groundY = getGroundY()
  
  for (const collectible of collectibles) {
    if (collectible.collected) continue
    
    const relativeZ = collectible.z - viewZ
    if (relativeZ < 0 || relativeZ > 500) continue
    
    const perspectiveT = 1 - relativeZ / 500
    const perspectiveY = horizonY + (groundY - horizonY) * perspectiveT
    const scale = perspectiveT * 0.8 + 0.2
    
    const screenX = laneToScreenX(DEMO_TRACK.lanePositions[collectible.lane], width)
    const floatOffset = Math.sin(time * 4 + collectible.z * 0.1) * 5 * scale
    const screenY = perspectiveY - 30 * scale + floatOffset
    
    const color = collectible.type === 'coin' ? COLORS.collectibleCoin : COLORS.collectibleGem
    const size = (collectible.type === 'coin' ? 12 : 10) * scale
    
    // Glow
    ctx.shadowColor = color
    ctx.shadowBlur = 10 * scale
    
    ctx.fillStyle = color
    
    if (collectible.type === 'coin') {
      // Coin circle
      ctx.beginPath()
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Gem diamond
      ctx.beginPath()
      ctx.moveTo(screenX, screenY - size)
      ctx.lineTo(screenX + size * 0.7, screenY)
      ctx.lineTo(screenX, screenY + size * 0.7)
      ctx.lineTo(screenX - size * 0.7, screenY)
      ctx.closePath()
      ctx.fill()
    }
    
    ctx.shadowBlur = 0
  }
}

/**
 * Full render pass
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  runner: DemoRunnerState,
  obstacles: DemoObstacle[],
  collectibles: DemoCollectible[],
  tiles: DemoTrackTile[],
  viewZ: number,
  time: number,
  _gameState: DemoGameState
): void {
  const w = canvas.width
  const h = canvas.height
  
  clearCanvas(ctx, w, h)
  renderStars(ctx, w, h, time)
  renderNebula(ctx, w, h, time)
  renderTrack(ctx, w, h, tiles, viewZ)
  renderObstacles(ctx, obstacles, w, h, viewZ)
  renderCollectibles(ctx, collectibles, w, h, viewZ, time)
  renderRunner(ctx, runner, w, h, time)
}
