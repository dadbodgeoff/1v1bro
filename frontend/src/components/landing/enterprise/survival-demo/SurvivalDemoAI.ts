/**
 * SurvivalDemoAI - AI controller for demo runner
 * 
 * Automatically controls the runner to showcase gameplay.
 * Makes smart decisions about jumping, sliding, and lane changes.
 * 
 * @module landing/enterprise/survival-demo/SurvivalDemoAI
 */

import type { DemoRunnerState, DemoObstacle, DemoCollectible, Lane } from './types'
import { jump, startSlide, stopSlide, moveToLane } from './SurvivalDemoPhysics'

export interface DemoAIState {
  reactionDistance: number
  lastActionTime: number
  targetLane: Lane | null
  isSliding: boolean
  slideEndTime: number
}

/**
 * Create AI state
 */
export function createAI(): DemoAIState {
  return {
    reactionDistance: 180, // How far ahead AI looks
    lastActionTime: 0,
    targetLane: null,
    isSliding: false,
    slideEndTime: 0,
  }
}

/**
 * Find the best lane to avoid obstacles
 */
function findSafeLane(
  obstacles: DemoObstacle[],
  currentLane: Lane,
  viewZ: number,
  lookAhead: number
): Lane | null {
  const lanes: Lane[] = ['left', 'center', 'right']
  const dangerZones: Record<Lane, number> = { left: 0, center: 0, right: 0 }
  
  // Score each lane based on obstacles
  for (const obs of obstacles) {
    if (obs.cleared) continue
    const relZ = obs.z - viewZ
    if (relZ < 0 || relZ > lookAhead) continue
    
    // Closer obstacles are more dangerous
    const danger = 1 - relZ / lookAhead
    dangerZones[obs.lane] += danger * 10
  }
  
  // Find safest lane
  let safestLane: Lane = currentLane
  let lowestDanger = dangerZones[currentLane]
  
  for (const lane of lanes) {
    if (dangerZones[lane] < lowestDanger) {
      lowestDanger = dangerZones[lane]
      safestLane = lane
    }
  }
  
  // Only switch if significantly safer
  if (dangerZones[currentLane] - lowestDanger > 2) {
    return safestLane
  }
  
  return null
}

/**
 * Find collectibles worth grabbing
 */
function findCollectibleLane(
  collectibles: DemoCollectible[],
  obstacles: DemoObstacle[],
  currentLane: Lane,
  viewZ: number,
  lookAhead: number
): Lane | null {
  const lanes: Lane[] = ['left', 'center', 'right']
  const collectibleScore: Record<Lane, number> = { left: 0, center: 0, right: 0 }
  const obstacleDanger: Record<Lane, boolean> = { left: false, center: false, right: false }
  
  // Check for obstacles in each lane
  for (const obs of obstacles) {
    if (obs.cleared) continue
    const relZ = obs.z - viewZ
    if (relZ > 0 && relZ < lookAhead * 0.8) {
      obstacleDanger[obs.lane] = true
    }
  }
  
  // Score collectibles
  for (const col of collectibles) {
    if (col.collected) continue
    const relZ = col.z - viewZ
    if (relZ < 0 || relZ > lookAhead) continue
    
    // Closer collectibles are more valuable
    const value = (1 - relZ / lookAhead) * (col.type === 'coin' ? 2 : 1)
    collectibleScore[col.lane] += value
  }
  
  // Find best lane with collectibles and no obstacles
  let bestLane: Lane | null = null
  let bestScore = 0
  
  for (const lane of lanes) {
    if (!obstacleDanger[lane] && collectibleScore[lane] > bestScore) {
      bestScore = collectibleScore[lane]
      bestLane = lane
    }
  }
  
  // Only switch if worth it
  if (bestScore > 0.5 && bestLane !== currentLane) {
    return bestLane
  }
  
  return null
}

/**
 * Update AI and control runner
 */
export function updateAI(
  ai: DemoAIState,
  runner: DemoRunnerState,
  obstacles: DemoObstacle[],
  collectibles: DemoCollectible[],
  viewZ: number,
  time: number
): void {
  // End slide if time
  if (ai.isSliding && time > ai.slideEndTime) {
    stopSlide(runner)
    ai.isSliding = false
  }
  
  // Look for immediate threats
  const immediateThreats = obstacles.filter(obs => {
    if (obs.cleared) return false
    const relZ = obs.z - viewZ
    return relZ > 0 && relZ < ai.reactionDistance && obs.lane === runner.lane
  })
  
  // Handle immediate obstacle
  if (immediateThreats.length > 0) {
    const threat = immediateThreats[0]
    const relZ = threat.z - viewZ
    
    // React based on obstacle type
    if (threat.type === 'overhead') {
      // Slide under overhead obstacles
      if (relZ < 120 && !ai.isSliding && !runner.isJumping) {
        startSlide(runner)
        ai.isSliding = true
        ai.slideEndTime = time + 0.6
        ai.lastActionTime = time
      }
    } else if (threat.type === 'gap' || threat.type === 'barrier' || threat.type === 'spike') {
      // Jump over other obstacles
      if (relZ < 100 && !runner.isJumping && !ai.isSliding) {
        jump(runner)
        ai.lastActionTime = time
      }
    }
    
    // Try to dodge to another lane if can't jump/slide
    if (relZ < 150 && !runner.isJumping && !ai.isSliding) {
      const safeLane = findSafeLane(obstacles, runner.lane, viewZ, ai.reactionDistance)
      if (safeLane && safeLane !== runner.lane) {
        moveToLane(runner, safeLane)
        ai.targetLane = safeLane
        ai.lastActionTime = time
      }
    }
  }
  
  // Look for collectibles if no immediate threat
  if (immediateThreats.length === 0 && time - ai.lastActionTime > 0.3) {
    const collectibleLane = findCollectibleLane(
      collectibles,
      obstacles,
      runner.lane,
      viewZ,
      ai.reactionDistance * 1.5
    )
    
    if (collectibleLane) {
      moveToLane(runner, collectibleLane)
      ai.targetLane = collectibleLane
      ai.lastActionTime = time
    }
  }
  
  // Proactive lane changes for upcoming obstacles
  if (time - ai.lastActionTime > 0.5) {
    const safeLane = findSafeLane(obstacles, runner.lane, viewZ, ai.reactionDistance * 2)
    if (safeLane && safeLane !== runner.lane) {
      moveToLane(runner, safeLane)
      ai.targetLane = safeLane
      ai.lastActionTime = time
    }
  }
}
