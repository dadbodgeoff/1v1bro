/**
 * Debug tests for collision issues with lowBarrier and laneBarrier
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CollisionSystem, type Collidable, type CollisionBox } from './CollisionSystem'
import { WorldConfig } from '../config/WorldConfig'

// Mock collidable for testing
function createMockObstacle(
  type: 'lowBarrier' | 'laneBarrier' | 'highBarrier' | 'spikes',
  lane: -1 | 0 | 1,
  z: number,
  collisionBox: CollisionBox
): Collidable {
  return {
    id: `test-${type}-${lane}-${z}`,
    type,
    lane,
    z,
    getCollisionBox: () => collisionBox,
  }
}

describe('Collision Debug Tests', () => {
  let collisionSystem: CollisionSystem
  const TRACK_SURFACE_HEIGHT = 1.3
  const LANE_WIDTH = 1.5

  beforeEach(() => {
    WorldConfig.resetInstance()
    const config = WorldConfig.getInstance()
    config.setTrackSurfaceHeight(TRACK_SURFACE_HEIGHT)
    config.setPlayerDimensions({
      width: 1.0,
      height: 2.0,
      depth: 0.8,
      footOffset: 0,
    })
    collisionSystem = new CollisionSystem()
  })

  describe('lowBarrier collision', () => {
    it('should detect collision when player is grounded and not jumping', () => {
      // Player grounded at track surface
      const playerX = 0
      const playerY = TRACK_SURFACE_HEIGHT // Feet at track surface
      const playerZ = 0
      const isJumping = false
      const isSliding = false

      // lowBarrier collision box (from ObstacleManager)
      const baseY = TRACK_SURFACE_HEIGHT
      const obstacleBox: CollisionBox = {
        minX: -1.8,
        maxX: 1.8,
        minY: baseY - 0.3, // 1.0
        maxY: baseY + 0.8, // 2.1
        minZ: -0.8,
        maxZ: 0.8,
      }

      const obstacle = createMockObstacle('lowBarrier', 0, 0, obstacleBox)
      const result = collisionSystem.checkObstacleCollision(
        playerX, playerY, playerZ, isJumping, isSliding, obstacle
      )

      console.log('Player box minY:', playerY, 'Obstacle maxY:', obstacleBox.maxY)
      console.log('Collision result:', result)

      // Player feet (1.3) < obstacle top (2.1), so collision should occur
      expect(result.collided).toBe(true)
      expect(result.obstacleType).toBe('lowBarrier')
    })

    it('should NOT detect collision when player jumps over', () => {
      // Player jumping - feet above obstacle
      const playerX = 0
      const playerY = TRACK_SURFACE_HEIGHT + 1.0 // Feet at 2.3 (above obstacle top of 2.1)
      const playerZ = 0
      const isJumping = true
      const isSliding = false

      const baseY = TRACK_SURFACE_HEIGHT
      const obstacleBox: CollisionBox = {
        minX: -1.8,
        maxX: 1.8,
        minY: baseY - 0.3,
        maxY: baseY + 0.8, // 2.1
        minZ: -0.8,
        maxZ: 0.8,
      }

      const obstacle = createMockObstacle('lowBarrier', 0, 0, obstacleBox)
      const result = collisionSystem.checkObstacleCollision(
        playerX, playerY, playerZ, isJumping, isSliding, obstacle
      )

      console.log('Player box minY:', playerY, 'Obstacle maxY:', obstacleBox.maxY)
      console.log('Collision result:', result)

      // Player feet (2.3) >= obstacle top (2.1), so no collision
      expect(result.collided).toBe(false)
    })

    it('should detect collision at realistic Z positions (player approaching obstacle)', () => {
      // Simulate player at Z=-50 approaching obstacle at Z=-50
      const playerX = 0
      const playerY = TRACK_SURFACE_HEIGHT
      const playerZ = -50 // Player at same Z as obstacle
      const isJumping = false
      const isSliding = false

      const baseY = TRACK_SURFACE_HEIGHT
      const obstacleZ = -50
      const obstacleBox: CollisionBox = {
        minX: -1.8,
        maxX: 1.8,
        minY: baseY - 0.3,
        maxY: baseY + 0.8,
        minZ: obstacleZ - 0.8, // -50.8
        maxZ: obstacleZ + 0.8, // -49.2
      }

      const obstacle = createMockObstacle('lowBarrier', 0, obstacleZ, obstacleBox)
      const result = collisionSystem.checkObstacleCollision(
        playerX, playerY, playerZ, isJumping, isSliding, obstacle
      )

      console.log('Player Z:', playerZ, 'Obstacle Z:', obstacleZ)
      console.log('Player box Z range: [', playerZ - 0.4, ',', playerZ + 0.4, ']')
      console.log('Obstacle box Z range: [', obstacleBox.minZ, ',', obstacleBox.maxZ, ']')
      console.log('Collision result:', result)

      expect(result.collided).toBe(true)
    })
  })

  describe('laneBarrier collision', () => {
    it('should detect collision when player is in same lane', () => {
      // Player in lane 0, obstacle in lane 0
      const playerX = 0 // Lane 0
      const playerY = TRACK_SURFACE_HEIGHT
      const playerZ = 0
      const isJumping = false
      const isSliding = false

      const baseY = TRACK_SURFACE_HEIGHT
      const obstacleBox: CollisionBox = {
        minX: 0 - LANE_WIDTH * 0.5, // -0.75
        maxX: 0 + LANE_WIDTH * 0.5, // 0.75
        minY: baseY,
        maxY: baseY + 3.0,
        minZ: -1.0,
        maxZ: 1.0,
      }

      const obstacle = createMockObstacle('laneBarrier', 0, 0, obstacleBox)
      const result = collisionSystem.checkObstacleCollision(
        playerX, playerY, playerZ, isJumping, isSliding, obstacle
      )

      console.log('Player X:', playerX, 'Obstacle lane X:', 0 * LANE_WIDTH)
      console.log('X distance:', Math.abs(playerX - 0 * LANE_WIDTH))
      console.log('Collision result:', result)

      // Player in same lane - collision should occur
      expect(result.collided).toBe(true)
      expect(result.obstacleType).toBe('laneBarrier')
    })

    it('should NOT detect collision when player is in different lane', () => {
      // Player in lane 1, obstacle in lane 0
      const playerX = 1 * LANE_WIDTH // Lane 1 = 1.5
      const playerY = TRACK_SURFACE_HEIGHT
      const playerZ = 0
      const isJumping = false
      const isSliding = false

      const baseY = TRACK_SURFACE_HEIGHT
      const obstacleBox: CollisionBox = {
        minX: 0 - LANE_WIDTH * 0.5, // -0.75
        maxX: 0 + LANE_WIDTH * 0.5, // 0.75
        minY: baseY,
        maxY: baseY + 3.0,
        minZ: -1.0,
        maxZ: 1.0,
      }

      const obstacle = createMockObstacle('laneBarrier', 0, 0, obstacleBox)
      const result = collisionSystem.checkObstacleCollision(
        playerX, playerY, playerZ, isJumping, isSliding, obstacle
      )

      console.log('Player X:', playerX, 'Obstacle lane X:', 0 * LANE_WIDTH)
      console.log('X distance:', Math.abs(playerX - 0 * LANE_WIDTH))
      console.log('Dodge threshold:', LANE_WIDTH * 0.6)
      console.log('Collision result:', result)

      // Player in different lane - no collision
      expect(result.collided).toBe(false)
    })

    it('should detect collision when player is transitioning between lanes', () => {
      // Player transitioning from lane 0 to lane 1, currently at X=0.5
      const playerX = 0.5 // Between lanes
      const playerY = TRACK_SURFACE_HEIGHT
      const playerZ = 0
      const isJumping = false
      const isSliding = false

      const baseY = TRACK_SURFACE_HEIGHT
      const obstacleBox: CollisionBox = {
        minX: 0 - LANE_WIDTH * 0.5, // -0.75
        maxX: 0 + LANE_WIDTH * 0.5, // 0.75
        minY: baseY,
        maxY: baseY + 3.0,
        minZ: -1.0,
        maxZ: 1.0,
      }

      const obstacle = createMockObstacle('laneBarrier', 0, 0, obstacleBox)
      const result = collisionSystem.checkObstacleCollision(
        playerX, playerY, playerZ, isJumping, isSliding, obstacle
      )

      console.log('Player X:', playerX, 'Obstacle lane X:', 0 * LANE_WIDTH)
      console.log('X distance:', Math.abs(playerX - 0 * LANE_WIDTH))
      console.log('Dodge threshold:', LANE_WIDTH * 0.6)
      console.log('Collision result:', result)

      // Player X=0.5, obstacle lane X=0, distance=0.5
      // Dodge threshold = 1.5 * 0.6 = 0.9
      // 0.5 < 0.9, so collision should occur
      expect(result.collided).toBe(true)
    })

    it('should NOT detect collision when boxes do not intersect in X', () => {
      // Player in lane 1, obstacle in lane -1 (far apart)
      const playerX = 1 * LANE_WIDTH // Lane 1 = 1.5
      const playerY = TRACK_SURFACE_HEIGHT
      const playerZ = 0
      const isJumping = false
      const isSliding = false

      const baseY = TRACK_SURFACE_HEIGHT
      const obstacleLane = -1
      const obstacleBox: CollisionBox = {
        minX: obstacleLane * LANE_WIDTH - LANE_WIDTH * 0.5, // -2.25
        maxX: obstacleLane * LANE_WIDTH + LANE_WIDTH * 0.5, // -0.75
        minY: baseY,
        maxY: baseY + 3.0,
        minZ: -1.0,
        maxZ: 1.0,
      }

      const obstacle = createMockObstacle('laneBarrier', obstacleLane, 0, obstacleBox)
      const result = collisionSystem.checkObstacleCollision(
        playerX, playerY, playerZ, isJumping, isSliding, obstacle
      )

      console.log('Player X:', playerX, 'Player box X range: [', playerX - 0.5, ',', playerX + 0.5, ']')
      console.log('Obstacle box X range: [', obstacleBox.minX, ',', obstacleBox.maxX, ']')
      console.log('Collision result:', result)

      // Boxes don't intersect in X, so no collision
      expect(result.collided).toBe(false)
    })
  })

  describe('checkAllCollisions', () => {
    it('should detect collision with lowBarrier in checkAllCollisions', () => {
      const playerX = 0
      const playerY = TRACK_SURFACE_HEIGHT
      const playerZ = -50
      const isJumping = false
      const isSliding = false

      const baseY = TRACK_SURFACE_HEIGHT
      const obstacleZ = -50
      const obstacleBox: CollisionBox = {
        minX: -1.8,
        maxX: 1.8,
        minY: baseY - 0.3,
        maxY: baseY + 0.8,
        minZ: obstacleZ - 0.8,
        maxZ: obstacleZ + 0.8,
      }

      const obstacles: Collidable[] = [
        createMockObstacle('lowBarrier', 0, obstacleZ, obstacleBox),
      ]

      // Store previous Z for swept collision
      collisionSystem.storePreviousZ(playerZ + 1) // Player was at -49

      const results = collisionSystem.checkAllCollisions(
        playerX, playerY, playerZ, isJumping, isSliding, obstacles
      )

      console.log('checkAllCollisions results:', results)

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].collided).toBe(true)
      expect(results[0].obstacleType).toBe('lowBarrier')
    })
  })
})
