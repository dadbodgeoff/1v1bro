/**
 * Gameplay Scenario Tests
 * Complete gameplay scenarios that exercise multiple arena systems
 * 
 * @module __tests__/e2e/scenarios/gameplay-scenarios.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Setup fake timers for trap warning state tests
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

import {
  ArenaFactory,
  createPlayerSimulator,
  createPlayer1,
  createPlayer2,
  createPlayerMap,
  createEventRecorder
} from '../helpers'

// ============================================================================
// Scenario 1: Player navigates through hazards and teleports
// **Validates: Requirements 11.1, 11.3**
// ============================================================================

describe('Scenario: Player navigates through hazards and teleports', () => {
  it('applies effects correctly through navigation sequence', () => {
    const arena = ArenaFactory.createMinimal({
      hazards: [
        { id: 'slow', type: 'slow', bounds: { x: 200, y: 300, width: 100, height: 100 }, intensity: 0.5 },
        { id: 'damage', type: 'damage', bounds: { x: 800, y: 300, width: 100, height: 100 }, intensity: 10 }
      ],
      teleporters: [
        { id: 'tp_a', pairId: 'main', position: { x: 400, y: 350 }, radius: 30 },
        { id: 'tp_b', pairId: 'main', position: { x: 700, y: 350 }, radius: 30 }
      ]
    })
    
    const recorder = createEventRecorder()
    arena.setCallbacks(recorder.getCallbacks())
    
    const player = createPlayer1()
    
    // Step 1: Move through slow field
    player.moveTo({ x: 250, y: 350 })
    arena.update(0.1, player.toPlayerMap())
    
    let effects = arena.getPlayerEffects(player.id)
    expect(effects.speedMultiplier).toBeLessThan(1.0)
    
    // Step 2: Exit slow field, enter teleporter
    player.moveTo({ x: 400, y: 350 })
    arena.update(0.1, player.toPlayerMap())
    
    effects = arena.getPlayerEffects(player.id)
    expect(effects.speedMultiplier).toBe(1.0)  // Exited slow field
    
    // Step 3: Teleport
    const destination = arena.checkTeleport(player.id, player.getPosition())
    expect(destination).not.toBeNull()
    expect(recorder.hasEvent('playerTeleported')).toBe(true)
    
    // Step 4: Move to damage zone
    player.moveTo({ x: 850, y: 350 })
    arena.update(0.1, player.toPlayerMap())
    
    effects = arena.getPlayerEffects(player.id)
    expect(effects.damagePerSecond).toBeGreaterThan(0)
  })
})


// ============================================================================
// Scenario 2: Player destroys barrier and passes through
// **Validates: Requirements 11.4**
// ============================================================================

describe('Scenario: Player destroys barrier and passes through', () => {
  it('allows passage after barrier destruction', () => {
    const barrier = {
      id: 'destructible',
      type: 'destructible' as const,
      position: { x: 600, y: 320 },
      size: { x: 80, y: 80 },
      health: 100
    }
    
    const arena = ArenaFactory.createWithBarrier(barrier)
    const recorder = createEventRecorder()
    arena.setCallbacks(recorder.getCallbacks())
    
    const barrierCenter = {
      x: barrier.position.x + barrier.size.x / 2,
      y: barrier.position.y + barrier.size.y / 2
    }
    
    // Step 1: Verify barrier blocks passage
    expect(arena.checkBarrierCollision(barrierCenter, 10)).toBe(true)
    
    // Step 2: Apply damage (simulating projectile hits)
    arena.damageBarrier(barrier.id, 40)  // 60 HP remaining
    expect(recorder.getEventCount('barrierDestroyed')).toBe(0)
    
    arena.damageBarrier(barrier.id, 40)  // 20 HP remaining
    expect(recorder.getEventCount('barrierDestroyed')).toBe(0)
    
    arena.damageBarrier(barrier.id, 40)  // 0 HP - destroyed
    
    // Step 3: Verify destruction event
    expect(recorder.hasEvent('barrierDestroyed', (e: unknown) => (e as { barrierId: string }).barrierId === barrier.id)).toBe(true)
    
    // Step 4: Verify passage is now allowed
    expect(arena.checkBarrierCollision(barrierCenter, 10)).toBe(false)
    
    // Step 5: Player can move through
    const player = createPlayerSimulator('test', barrierCenter)
    const resolved = arena.resolveCollision(player.getPosition(), 10)
    
    // Position should not be pushed out (no collision)
    expect(resolved.x).toBeCloseTo(barrierCenter.x, 0)
    expect(resolved.y).toBeCloseTo(barrierCenter.y, 0)
  })
})

// ============================================================================
// Scenario 3: Trap triggers while in hazard zone
// **Validates: Requirements 11.2**
// ============================================================================

describe('Scenario: Trap triggers while in hazard zone', () => {
  it('applies both trap effect and hazard effect', () => {
    const arena = ArenaFactory.createMinimal({
      hazards: [
        { id: 'slow', type: 'slow', bounds: { x: 600, y: 320, width: 160, height: 160 }, intensity: 0.5 }
      ],
      traps: [
        { 
          id: 'pressure', 
          type: 'pressure', 
          position: { x: 680, y: 400 }, 
          radius: 40,
          effect: 'damage_burst',
          effectValue: 50,
          cooldown: 10
        }
      ]
    })
    
    const recorder = createEventRecorder()
    arena.setCallbacks(recorder.getCallbacks())
    
    // Player enters hazard zone and steps on trap
    const player = createPlayerSimulator('test', { x: 680, y: 400 })
    
    // First update enters warning state and applies hazard
    arena.update(0.1, player.toPlayerMap())
    
    // Verify hazard effect is applied immediately
    const effects = arena.getPlayerEffects(player.id)
    expect(effects.speedMultiplier).toBeLessThan(1.0)
    
    // Advance time past warning period (300ms)
    vi.advanceTimersByTime(350)
    
    // Second update triggers the trap
    arena.update(0.1, player.toPlayerMap())
    
    // Verify trap triggered
    expect(recorder.hasEvent('trapTriggered')).toBe(true)
    
    // Both effects should be active simultaneously
    const trapEvent = recorder.trapTriggered[0]
    expect(trapEvent.affectedPlayers).toContain(player.id)
  })
})

// ============================================================================
// Scenario 4: Multiple players interact simultaneously
// **Validates: Requirements 11.5**
// ============================================================================

describe('Scenario: Multiple players interact simultaneously', () => {
  it('processes all player interactions correctly', () => {
    const arena = ArenaFactory.createMinimal({
      hazards: [
        { id: 'slow', type: 'slow', bounds: { x: 100, y: 300, width: 100, height: 100 }, intensity: 0.5 }
      ],
      traps: [
        { 
          id: 'trap1', 
          type: 'pressure', 
          position: { x: 900, y: 350 }, 
          radius: 40,
          effect: 'damage_burst',
          effectValue: 50,
          cooldown: 10
        }
      ],
      teleporters: [
        { id: 'tp_a', pairId: 'main', position: { x: 500, y: 350 }, radius: 30 },
        { id: 'tp_b', pairId: 'main', position: { x: 700, y: 350 }, radius: 30 }
      ]
    })
    
    const recorder = createEventRecorder()
    arena.setCallbacks(recorder.getCallbacks())
    
    // Player 1 in slow field
    const player1 = createPlayerSimulator('player1', { x: 150, y: 350 })
    
    // Player 2 on trap
    const player2 = createPlayerSimulator('player2', { x: 900, y: 350 })
    
    // Update with both players - first update enters warning state
    const players = createPlayerMap(player1, player2)
    arena.update(0.1, players)
    
    // Player 1 should have slow effect immediately
    const effects1 = arena.getPlayerEffects(player1.id)
    expect(effects1.speedMultiplier).toBeLessThan(1.0)
    
    // Advance time past warning period (300ms)
    vi.advanceTimersByTime(350)
    
    // Second update triggers the trap
    arena.update(0.1, players)
    
    // Player 2 should have triggered trap
    expect(recorder.hasEvent('trapTriggered', (e: unknown) => (e as { affectedPlayers: string[] }).affectedPlayers.includes(player2.id))).toBe(true)
    
    // Player 1 should NOT be affected by trap (too far)
    const trapEvent = recorder.trapTriggered[0]
    expect(trapEvent.affectedPlayers).not.toContain(player1.id)
    
    // Player 1 teleports
    const dest = arena.checkTeleport(player1.id, { x: 500, y: 350 })
    expect(dest).not.toBeNull()
    expect(recorder.hasEvent('playerTeleported', (e: unknown) => (e as { playerId: string }).playerId === player1.id)).toBe(true)
  })
})

// ============================================================================
// Scenario 5: Full arena gameplay with NEXUS_ARENA
// **Validates: All requirements**
// ============================================================================

describe('Scenario: Full NEXUS_ARENA gameplay', () => {
  it('loads and operates correctly with full map config', () => {
    const arena = ArenaFactory.createDefault()
    const recorder = createEventRecorder()
    arena.setCallbacks(recorder.getCallbacks())
    
    // Verify initialization
    expect(arena.getIsInitialized()).toBe(true)
    
    // Create players at spawn points
    const player1 = createPlayer1()
    const player2 = createPlayer2()
    
    // Simulate several frames of gameplay
    for (let i = 0; i < 10; i++) {
      const players = createPlayerMap(player1, player2)
      arena.update(0.016, players)  // ~60fps
    }
    
    // Arena should remain stable
    expect(arena.getIsInitialized()).toBe(true)
    
    // Effects should be clean (players at spawn, not in hazards)
    const effects1 = arena.getPlayerEffects(player1.id)
    const effects2 = arena.getPlayerEffects(player2.id)
    
    expect(effects1.speedMultiplier).toBe(1.0)
    expect(effects2.speedMultiplier).toBe(1.0)
  })

  it('handles player movement through arena features', () => {
    const arena = ArenaFactory.createDefault()
    const recorder = createEventRecorder()
    arena.setCallbacks(recorder.getCallbacks())
    
    const player = createPlayer1()
    
    // Move toward center (through slow fields in NEXUS_ARENA)
    const positions = [
      { x: 200, y: 360 },
      { x: 300, y: 360 },
      { x: 400, y: 300 },  // Near slow field
      { x: 500, y: 360 },
      { x: 600, y: 360 }   // Center area
    ]
    
    for (const pos of positions) {
      player.moveTo(pos)
      arena.update(0.1, player.toPlayerMap())
    }
    
    // Should have processed without errors
    expect(arena.getIsInitialized()).toBe(true)
  })
})
