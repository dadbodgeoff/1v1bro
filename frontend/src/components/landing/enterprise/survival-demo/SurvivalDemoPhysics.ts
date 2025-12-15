/**
 * SurvivalDemoPhysics - Physics for survival demo
 * 
 * Handles runner movement, jumping, sliding, and collision detection.
 * Lightweight 2.5D physics mimicking the full survival mode.
 * 
 * @module landing/enterprise/survival-demo/SurvivalDemoPhysics
 */

import type { DemoRunnerState, DemoObstacle, DemoCollectible, Lane, ObstacleType } from './types'

export interface DemoTrackConfig {
  width: number
  height: number
  laneWidth: number
  lanePositions: Record<Lane, number>
  gravity: number
  jumpForce: number
  slideHeight: number
  runnerHeight: number
  runnerWidth: number
}

export const DEMO_TRACK: DemoTrackConfig = {
  width: 800,
  height: 450,
  laneWidth: 80,
  lanePositions: {
    left: 200,
    center: 400,
    right: 600,
  },
  gravity: 2800,
  jumpForce: 900,
  slideHeight: 20,
  runnerHeight: 60,
  runnerWidth: 30,
}

// Ground Y position (bottom of track area)
const GROUND_Y = 320

/**
 * Create initial runner state
 */
export function createRunner(): DemoRunnerState {
  return {
    lane: 'center',
    laneX: DEMO_TRACK.lanePositions.center,
    z: 0,
    y: GROUND_Y,
    velocityY: 0,
    isJumping: false,
    isSliding: false,
    isRunning: true,
    animationFrame: 0,
  }
}

/**
 * Move runner to a lane
 */
export function moveToLane(runner: DemoRunnerState, lane: Lane): void {
  runner.lane = lane
}

/**
 * Make runner jump
 */
export function jump(runner: DemoRunnerState): boolean {
  if (!runner.isJumping && !runner.isSliding) {
    runner.velocityY = -DEMO_TRACK.jumpForce
    runner.isJumping = true
    return true
  }
  return false
}

/**
 * Make runner slide
 */
export function startSlide(runner: DemoRunnerState): boolean {
  if (!runner.isJumping && !runner.isSliding) {
    runner.isSliding = true
    return true
  }
  return false
}

/**
 * Stop sliding
 */
export function stopSlide(runner: DemoRunnerState): void {
  runner.isSliding = false
}

/**
 * Update runner physics
 */
export function updateRunner(runner: DemoRunnerState, dt: number, speed: number): void {
  // Smooth lane transition
  const targetX = DEMO_TRACK.lanePositions[runner.lane]
  runner.laneX += (targetX - runner.laneX) * dt * 12

  // Update distance (z position)
  runner.z += speed * dt

  // Jump physics
  if (runner.isJumping) {
    runner.velocityY += DEMO_TRACK.gravity * dt
    runner.y += runner.velocityY * dt

    // Land
    if (runner.y >= GROUND_Y) {
      runner.y = GROUND_Y
      runner.velocityY = 0
      runner.isJumping = false
    }
  }

  // Animation frame
  runner.animationFrame += dt * (runner.isRunning ? 12 : 0)
}

/**
 * Create an obstacle
 */
export function createObstacle(
  type: ObstacleType,
  lane: Lane,
  z: number
): DemoObstacle {
  const dimensions = getObstacleDimensions(type)
  return {
    id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    lane,
    z,
    width: dimensions.width,
    height: dimensions.height,
    cleared: false,
  }
}

function getObstacleDimensions(type: ObstacleType): { width: number; height: number } {
  switch (type) {
    case 'barrier':
      return { width: 60, height: 50 }
    case 'spike':
      return { width: 40, height: 35 }
    case 'overhead':
      return { width: 80, height: 30 }
    case 'gap':
      return { width: 70, height: 100 }
    default:
      return { width: 50, height: 40 }
  }
}

/**
 * Create a collectible
 */
export function createCollectible(
  lane: Lane,
  z: number,
  floating: boolean = false
): DemoCollectible {
  return {
    id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    lane,
    z,
    y: floating ? GROUND_Y - 80 : GROUND_Y - 30,
    collected: false,
    type: Math.random() > 0.7 ? 'coin' : 'gem',
  }
}

export interface CollisionResult {
  hit: boolean
  type: 'obstacle' | 'collectible' | null
  obstacleType?: ObstacleType
  points?: number
}

/**
 * Check collision between runner and obstacle
 */
export function checkObstacleCollision(
  runner: DemoRunnerState,
  obstacle: DemoObstacle,
  viewZ: number
): CollisionResult {
  if (obstacle.cleared) return { hit: false, type: null }

  // Convert obstacle Z to screen space
  const obstacleScreenZ = obstacle.z - viewZ
  const runnerScreenZ = 50 // Runner is always at fixed screen position

  // Z proximity check (obstacle passing through runner)
  const zDist = Math.abs(obstacleScreenZ - runnerScreenZ)
  if (zDist > 40) return { hit: false, type: null }

  // Lane check
  if (obstacle.lane !== runner.lane) {
    // Mark as cleared if passed
    if (obstacleScreenZ < runnerScreenZ - 30) {
      obstacle.cleared = true
    }
    return { hit: false, type: null }
  }

  // Height check based on obstacle type
  const runnerTop = runner.y - (runner.isSliding ? DEMO_TRACK.slideHeight : DEMO_TRACK.runnerHeight)
  const runnerBottom = runner.y

  if (obstacle.type === 'overhead') {
    // Overhead obstacles - must slide under
    const obstacleBottom = GROUND_Y - 40
    if (runnerTop < obstacleBottom && !runner.isSliding) {
      return { hit: true, type: 'obstacle', obstacleType: obstacle.type }
    }
  } else if (obstacle.type === 'gap') {
    // Gap - must jump over
    if (runnerBottom >= GROUND_Y - 10) {
      return { hit: true, type: 'obstacle', obstacleType: obstacle.type }
    }
  } else {
    // Regular obstacles - must jump over
    const obstacleTop = GROUND_Y - obstacle.height
    if (runnerBottom > obstacleTop && !runner.isJumping) {
      return { hit: true, type: 'obstacle', obstacleType: obstacle.type }
    }
  }

  // Mark as cleared if passed without collision
  if (obstacleScreenZ < runnerScreenZ - 30) {
    obstacle.cleared = true
  }

  return { hit: false, type: null }
}

/**
 * Check collision between runner and collectible
 */
export function checkCollectibleCollision(
  runner: DemoRunnerState,
  collectible: DemoCollectible,
  viewZ: number
): CollisionResult {
  if (collectible.collected) return { hit: false, type: null }

  const collectibleScreenZ = collectible.z - viewZ
  const runnerScreenZ = 50

  const zDist = Math.abs(collectibleScreenZ - runnerScreenZ)
  if (zDist > 30) return { hit: false, type: null }

  if (collectible.lane !== runner.lane) return { hit: false, type: null }

  // Vertical check
  const runnerTop = runner.y - DEMO_TRACK.runnerHeight
  if (collectible.y > runnerTop && collectible.y < runner.y + 20) {
    collectible.collected = true
    return {
      hit: true,
      type: 'collectible',
      points: collectible.type === 'coin' ? 50 : 25,
    }
  }

  return { hit: false, type: null }
}

/**
 * Get ground Y position
 */
export function getGroundY(): number {
  return GROUND_Y
}
