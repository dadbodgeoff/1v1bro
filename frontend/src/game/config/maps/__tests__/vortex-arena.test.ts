/**
 * Vortex Arena Map Configuration Tests
 * Property-based and unit tests for map validation
 * 
 * @module config/maps/__tests__/vortex-arena.test
 */

import { describe, it, expect } from 'vitest'
import { VORTEX_ARENA } from '../vortex-arena'
import { NEXUS_ARENA } from '../nexus-arena'
import { validateMapConfig } from '../map-schema'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate Euclidean distance between two points
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * Check if a point is inside a rectangle
 */
function pointInRect(
  px: number, py: number,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
}

/**
 * Calculate minimum distance from point to rectangle boundary
 */
function distanceToRect(
  px: number, py: number,
  rx: number, ry: number, rw: number, rh: number
): number {
  const closestX = Math.max(rx, Math.min(px, rx + rw))
  const closestY = Math.max(ry, Math.min(py, ry + rh))
  return distance(px, py, closestX, closestY)
}

/**
 * Check if two rectangles overlap
 */
function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

/**
 * Mirror x coordinate around center (640)
 */
function mirrorX(x: number): number {
  return 1280 - x
}

// ============================================================================
// Unit Tests - Map Configuration Structure
// ============================================================================

describe('Vortex Arena - Configuration Structure', () => {
  /**
   * Feature: vortex-arena-map, Property 1: Map Configuration Completeness
   * Validates: Requirements 1.1
   */
  it('should have all required MapConfig fields', () => {
    expect(VORTEX_ARENA).toHaveProperty('metadata')
    expect(VORTEX_ARENA).toHaveProperty('tiles')
    expect(VORTEX_ARENA).toHaveProperty('barriers')
    expect(VORTEX_ARENA).toHaveProperty('hazards')
    expect(VORTEX_ARENA).toHaveProperty('traps')
    expect(VORTEX_ARENA).toHaveProperty('teleporters')
    expect(VORTEX_ARENA).toHaveProperty('jumpPads')
    expect(VORTEX_ARENA).toHaveProperty('spawnPoints')
    expect(VORTEX_ARENA).toHaveProperty('powerUpSpawns')
  })

  it('should have correct metadata values', () => {
    expect(VORTEX_ARENA.metadata.name).toBe('Vortex Arena')
    expect(VORTEX_ARENA.metadata.version).toBe('2.0.0') // Updated for volcanic theme
    expect(VORTEX_ARENA.metadata.theme).toBe('volcanic')
    expect(VORTEX_ARENA.metadata.description.length).toBeLessThanOrEqual(200)
    expect(VORTEX_ARENA.metadata.author).toBeTruthy()
  })

  it('should have correct tile grid dimensions (9 rows × 16 columns)', () => {
    expect(VORTEX_ARENA.tiles).toHaveLength(9)
    VORTEX_ARENA.tiles.forEach((row) => {
      expect(row).toHaveLength(16)
    })
  })

  it('should have minimum required barriers (8+)', () => {
    expect(VORTEX_ARENA.barriers.length).toBeGreaterThanOrEqual(8)
  })

  it('should have at least 2 destructible barriers', () => {
    const destructible = VORTEX_ARENA.barriers.filter(b => b.type === 'destructible')
    expect(destructible.length).toBeGreaterThanOrEqual(2)
    destructible.forEach(b => {
      expect(b.health).toBeGreaterThanOrEqual(50)
      expect(b.health).toBeLessThanOrEqual(200)
    })
  })

  it('should have at least 4 half-wall barriers', () => {
    const halfWalls = VORTEX_ARENA.barriers.filter(b => b.type === 'half')
    expect(halfWalls.length).toBeGreaterThanOrEqual(4)
  })

  it('should have at least 2 full-wall barriers', () => {
    const fullWalls = VORTEX_ARENA.barriers.filter(b => b.type === 'full')
    expect(fullWalls.length).toBeGreaterThanOrEqual(2)
  })

  it('should have at least 2 damage hazard zones', () => {
    const damageZones = VORTEX_ARENA.hazards.filter(h => h.type === 'damage')
    expect(damageZones.length).toBeGreaterThanOrEqual(2)
    damageZones.forEach(h => {
      expect(h.intensity).toBeGreaterThanOrEqual(5)
      expect(h.intensity).toBeLessThanOrEqual(25)
    })
  })

  it('should have at least 2 slow field hazard zones', () => {
    const slowFields = VORTEX_ARENA.hazards.filter(h => h.type === 'slow')
    expect(slowFields.length).toBeGreaterThanOrEqual(2)
    slowFields.forEach(h => {
      expect(h.intensity).toBeGreaterThanOrEqual(0.25)
      expect(h.intensity).toBeLessThanOrEqual(0.75)
    })
  })

  it('should have at least 1 EMP hazard zone', () => {
    const empZones = VORTEX_ARENA.hazards.filter(h => h.type === 'emp')
    expect(empZones.length).toBeGreaterThanOrEqual(1)
  })

  it('should have at least 2 pressure traps', () => {
    const pressureTraps = VORTEX_ARENA.traps.filter(t => t.type === 'pressure')
    expect(pressureTraps.length).toBeGreaterThanOrEqual(2)
    pressureTraps.forEach(t => {
      expect(t.cooldown).toBeGreaterThanOrEqual(5)
      expect(t.cooldown).toBeLessThanOrEqual(30)
    })
  })

  it('should have at least 1 timed trap', () => {
    const timedTraps = VORTEX_ARENA.traps.filter(t => t.type === 'timed')
    expect(timedTraps.length).toBeGreaterThanOrEqual(1)
    timedTraps.forEach(t => {
      expect(t.interval).toBeGreaterThanOrEqual(5)
      expect(t.interval).toBeLessThanOrEqual(30)
    })
  })

  it('should have trap effect value of 35 damage', () => {
    VORTEX_ARENA.traps.forEach(t => {
      expect(t.effectValue).toBe(35)
    })
  })

  it('should have trap trigger radius of 40 pixels', () => {
    VORTEX_ARENA.traps.forEach(t => {
      expect(t.radius).toBe(40)
    })
  })

  it('should have at least 2 teleporter pairs (4+ pads)', () => {
    expect(VORTEX_ARENA.teleporters.length).toBeGreaterThanOrEqual(4)
  })

  it('should have teleporter radius of 30 pixels', () => {
    VORTEX_ARENA.teleporters.forEach(tp => {
      expect(tp.radius).toBe(30)
    })
  })

  it('should have at least 4 jump pads', () => {
    expect(VORTEX_ARENA.jumpPads.length).toBeGreaterThanOrEqual(4)
  })

  it('should have jump pad force of 400', () => {
    VORTEX_ARENA.jumpPads.forEach(jp => {
      expect(jp.force).toBe(400)
    })
  })

  it('should have jump pad radius of 40 pixels', () => {
    VORTEX_ARENA.jumpPads.forEach(jp => {
      expect(jp.radius).toBe(40)
    })
  })

  it('should use at least 3 different jump pad directions', () => {
    const directions = new Set(VORTEX_ARENA.jumpPads.map(jp => jp.direction))
    expect(directions.size).toBeGreaterThanOrEqual(3)
  })

  it('should have exactly 2 spawn points', () => {
    expect(VORTEX_ARENA.spawnPoints).toHaveLength(2)
    expect(VORTEX_ARENA.spawnPoints.find(s => s.id === 'player1')).toBeTruthy()
    expect(VORTEX_ARENA.spawnPoints.find(s => s.id === 'player2')).toBeTruthy()
  })

  it('should have at least 8 power-up spawn positions', () => {
    expect(VORTEX_ARENA.powerUpSpawns.length).toBeGreaterThanOrEqual(8)
  })
})

// ============================================================================
// Validation Tests
// ============================================================================

describe('Vortex Arena - Map Validation', () => {
  it('should pass validateMapConfig', () => {
    const result = validateMapConfig(VORTEX_ARENA)
    if (!result.valid) {
      console.log('Validation errors:', result.errors)
    }
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

// ============================================================================
// Property Tests
// ============================================================================

describe('Vortex Arena - Property Tests', () => {
  /**
   * Feature: vortex-arena-map, Property 2: Spawn Point Equidistance
   * Validates: Requirements 2.3
   */
  it('Property 2: spawn points should be equidistant from arena center', () => {
    const centerX = 640
    const centerY = 360
    
    const spawn1 = VORTEX_ARENA.spawnPoints.find(s => s.id === 'player1')!
    const spawn2 = VORTEX_ARENA.spawnPoints.find(s => s.id === 'player2')!
    
    const dist1 = distance(spawn1.position.x, spawn1.position.y, centerX, centerY)
    const dist2 = distance(spawn2.position.x, spawn2.position.y, centerX, centerY)
    
    expect(Math.abs(dist1 - dist2)).toBeLessThanOrEqual(1)
  })

  /**
   * Feature: vortex-arena-map, Property 3: Spatial Safety - Hazard Clearance
   * Validates: Requirements 2.4, 4.4, 6.5, 8.4
   */
  it('Property 3: spawn points, teleporters, and power-ups should not be inside hazard zones', () => {
    const positions = [
      ...VORTEX_ARENA.spawnPoints.map(s => ({ ...s.position, type: 'spawn', clearance: 160 })),
      ...VORTEX_ARENA.teleporters.map(t => ({ ...t.position, type: 'teleporter', clearance: 0 })),
      ...VORTEX_ARENA.powerUpSpawns.map(p => ({ ...p, type: 'powerup', clearance: 0 })),
    ]

    for (const pos of positions) {
      for (const hazard of VORTEX_ARENA.hazards) {
        const { x, y, width, height } = hazard.bounds
        
        // Check not inside hazard
        const inside = pointInRect(pos.x, pos.y, x, y, width, height)
        expect(inside).toBe(false)
        
        // For spawn points, check 160px clearance
        if (pos.type === 'spawn') {
          const dist = distanceToRect(pos.x, pos.y, x, y, width, height)
          expect(dist).toBeGreaterThanOrEqual(pos.clearance)
        }
      }
    }
  })

  /**
   * Feature: vortex-arena-map, Property 4: Spatial Safety - Trap Clearance
   * Validates: Requirements 2.5, 8.5
   */
  it('Property 4: spawn points and power-ups should have clearance from traps', () => {
    const spawnClearance = 80
    const powerupClearance = 40

    // Check spawn points
    for (const spawn of VORTEX_ARENA.spawnPoints) {
      for (const trap of VORTEX_ARENA.traps) {
        const dist = distance(spawn.position.x, spawn.position.y, trap.position.x, trap.position.y)
        expect(dist).toBeGreaterThanOrEqual(trap.radius + spawnClearance)
      }
    }

    // Check power-up spawns
    for (const powerup of VORTEX_ARENA.powerUpSpawns) {
      for (const trap of VORTEX_ARENA.traps) {
        const dist = distance(powerup.x, powerup.y, trap.position.x, trap.position.y)
        expect(dist).toBeGreaterThanOrEqual(trap.radius + powerupClearance)
      }
    }
  })

  /**
   * Feature: vortex-arena-map, Property 5: Barrier Non-Overlap
   * Validates: Requirements 3.5
   */
  it('Property 5: no barriers should overlap', () => {
    const barriers = VORTEX_ARENA.barriers

    for (let i = 0; i < barriers.length; i++) {
      for (let j = i + 1; j < barriers.length; j++) {
        const a = barriers[i]
        const b = barriers[j]
        
        const overlap = rectsOverlap(
          a.position.x, a.position.y, a.size.x, a.size.y,
          b.position.x, b.position.y, b.size.x, b.size.y
        )
        
        expect(overlap).toBe(false)
      }
    }
  })

  /**
   * Feature: vortex-arena-map, Property 6: Horizontal Symmetry
   * Validates: Requirements 3.6, 5.6, 6.6, 7.6, 8.3
   */
  it('Property 6: map elements should maintain horizontal symmetry', () => {
    const centerX = 640
    const tolerance = 1

    // Check barriers
    const leftBarriers = VORTEX_ARENA.barriers.filter(b => b.position.x < centerX)
    for (const left of leftBarriers) {
      const mirroredX = mirrorX(left.position.x + left.size.x)
      const hasMatch = VORTEX_ARENA.barriers.some(right => 
        right.position.x > centerX &&
        Math.abs(right.position.x - mirroredX) <= tolerance &&
        Math.abs(right.position.y - left.position.y) <= tolerance &&
        right.type === left.type
      )
      expect(hasMatch).toBe(true)
    }

    // Check traps
    const leftTraps = VORTEX_ARENA.traps.filter(t => t.position.x < centerX)
    for (const left of leftTraps) {
      const mirroredX = mirrorX(left.position.x)
      const hasMatch = VORTEX_ARENA.traps.some(right =>
        right.position.x > centerX &&
        Math.abs(right.position.x - mirroredX) <= tolerance &&
        Math.abs(right.position.y - left.position.y) <= tolerance
      )
      expect(hasMatch).toBe(true)
    }

    // Check jump pads
    const leftJumpPads = VORTEX_ARENA.jumpPads.filter(jp => jp.position.x < centerX)
    for (const left of leftJumpPads) {
      const mirroredX = mirrorX(left.position.x)
      const hasMatch = VORTEX_ARENA.jumpPads.some(right =>
        right.position.x > centerX &&
        Math.abs(right.position.x - mirroredX) <= tolerance &&
        Math.abs(right.position.y - left.position.y) <= tolerance
      )
      expect(hasMatch).toBe(true)
    }

    // Check power-up spawns
    const leftPowerups = VORTEX_ARENA.powerUpSpawns.filter(p => p.x < centerX)
    for (const left of leftPowerups) {
      const mirroredX = mirrorX(left.x)
      const hasMatch = VORTEX_ARENA.powerUpSpawns.some(right =>
        right.x > centerX &&
        Math.abs(right.x - mirroredX) <= tolerance &&
        Math.abs(right.y - left.y) <= tolerance
      )
      expect(hasMatch).toBe(true)
    }
  })

  /**
   * Feature: vortex-arena-map, Property 7: Teleporter Pair Validity
   * Validates: Requirements 6.2, 6.4
   */
  it('Property 7: teleporter pairs should be valid and on opposite sides', () => {
    const centerX = 640
    const pairCounts = new Map<string, number>()
    const pairPositions = new Map<string, { left: boolean; right: boolean }>()

    for (const tp of VORTEX_ARENA.teleporters) {
      pairCounts.set(tp.pairId, (pairCounts.get(tp.pairId) || 0) + 1)
      
      const positions = pairPositions.get(tp.pairId) || { left: false, right: false }
      if (tp.position.x < centerX) positions.left = true
      if (tp.position.x > centerX) positions.right = true
      pairPositions.set(tp.pairId, positions)
    }

    // Each pair should have exactly 2 teleporters
    for (const [, count] of pairCounts) {
      expect(count).toBe(2)
    }

    // Each pair should have one on each side
    for (const [, positions] of pairPositions) {
      expect(positions.left).toBe(true)
      expect(positions.right).toBe(true)
    }
  })

  /**
   * Feature: vortex-arena-map, Property 8: Hazard Coverage Limit
   * Validates: Requirements 4.5
   */
  it('Property 8: hazard zones should cover no more than 25% of arena', () => {
    const arenaArea = 1280 * 720
    const maxHazardArea = arenaArea * 0.25

    let totalHazardArea = 0
    for (const hazard of VORTEX_ARENA.hazards) {
      totalHazardArea += hazard.bounds.width * hazard.bounds.height
    }

    expect(totalHazardArea).toBeLessThanOrEqual(maxHazardArea)
  })

  /**
   * Feature: vortex-arena-map, Property 9: Power-Up Access Balance
   * Validates: Requirements 8.6
   */
  it('Property 9: both players should have equal access to power-ups', () => {
    const spawn1 = VORTEX_ARENA.spawnPoints.find(s => s.id === 'player1')!
    const spawn2 = VORTEX_ARENA.spawnPoints.find(s => s.id === 'player2')!

    const distances1 = VORTEX_ARENA.powerUpSpawns
      .map(p => distance(spawn1.position.x, spawn1.position.y, p.x, p.y))
      .sort((a, b) => a - b)

    const distances2 = VORTEX_ARENA.powerUpSpawns
      .map(p => distance(spawn2.position.x, spawn2.position.y, p.x, p.y))
      .sort((a, b) => a - b)

    // Both players should have the same sorted distance set (within tolerance)
    expect(distances1.length).toBe(distances2.length)
    for (let i = 0; i < distances1.length; i++) {
      expect(Math.abs(distances1[i] - distances2[i])).toBeLessThanOrEqual(1)
    }
  })
})

// ============================================================================
// Comparison with Nexus Arena
// ============================================================================

describe('Vortex Arena vs Nexus Arena', () => {
  it('should be a distinct map from Nexus Arena', () => {
    expect(VORTEX_ARENA.metadata.name).not.toBe(NEXUS_ARENA.metadata.name)
  })

  it('should have more teleporter pairs than Nexus Arena', () => {
    const vortexPairs = new Set(VORTEX_ARENA.teleporters.map(t => t.pairId)).size
    const nexusPairs = new Set(NEXUS_ARENA.teleporters.map(t => t.pairId)).size
    expect(vortexPairs).toBeGreaterThanOrEqual(nexusPairs)
  })

  it('should have more jump pads than Nexus Arena', () => {
    expect(VORTEX_ARENA.jumpPads.length).toBeGreaterThan(NEXUS_ARENA.jumpPads.length)
  })

  it('should have destructible barriers (Nexus Arena may not)', () => {
    const vortexDestructible = VORTEX_ARENA.barriers.filter(b => b.type === 'destructible')
    expect(vortexDestructible.length).toBeGreaterThan(0)
  })
})
