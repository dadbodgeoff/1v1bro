/**
 * Telemetry System End-to-End Tests
 * 
 * Tests the complete telemetry pipeline:
 * - TelemetryRecorder captures game state
 * - Death events trigger replay extraction
 * - ReplayPlayer plays back captured frames
 * - ReplayRenderer visualizes the replay
 * 
 * @module telemetry/telemetry-e2e.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TelemetryRecorder } from './TelemetryRecorder'
import { ReplayPlayer } from './ReplayPlayer'
import { ReplayRenderer } from './ReplayRenderer'
import type { PlayerState, HealthState, Projectile } from '../types'
import type { TelemetryCombatEvent, TelemetryFrame } from './types'

// ============================================================================
// Test Helpers
// ============================================================================

function createMockPlayer(id: string, x: number, y: number): PlayerState {
  return {
    id,
    position: { x, y },
    trail: [],
    isLocal: id === 'player1',
  }
}

function createMockHealthState(current: number, shield = 0): HealthState {
  return {
    current,
    max: 100,
    shield,
    shieldMax: 50,
    lastDamageTime: 0,
    isInvulnerable: false,
    invulnerabilityEnd: 0,
  }
}

function createMockProjectile(id: string, ownerId: string, x: number, y: number): Projectile {
  return {
    id,
    ownerId,
    position: { x, y },
    velocity: { x: 600, y: 0 },
    spawnTime: Date.now(),
    spawnPosition: { x: x - 50, y },
    damage: 25,
    isPredicted: true,
  }
}

// ============================================================================
// Scenario 1: Complete Combat Sequence with Death Replay
// ============================================================================

describe('E2E: Complete Combat Sequence with Death Replay', () => {
  let recorder: TelemetryRecorder
  let player: ReplayPlayer
  let renderer: ReplayRenderer

  beforeEach(() => {
    vi.useFakeTimers()
    recorder = new TelemetryRecorder({ maxFrames: 100, replayFrames: 50 })
    player = new ReplayPlayer()
    renderer = new ReplayRenderer()
    recorder.setLobbyId('test-lobby-123')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('captures full combat sequence and produces valid replay', () => {
    const player1 = createMockPlayer('player1', 200, 300)
    const player2 = createMockPlayer('player2', 800, 300)
    const events: TelemetryCombatEvent[] = []

    // Phase 1: Initial state - both players alive
    for (let i = 0; i < 30; i++) {
      const players = new Map([
        ['player1', player1],
        ['player2', player2],
      ])
      const healthStates = new Map<string, HealthState | null>([
        ['player1', createMockHealthState(100)],
        ['player2', createMockHealthState(100)],
      ])
      const aimDirections = new Map([
        ['player1', { x: 1, y: 0 }],
        ['player2', { x: -1, y: 0 }],
      ])

      recorder.captureFrame(players, healthStates, [], events, aimDirections, new Set())
      vi.advanceTimersByTime(16) // ~60fps
    }

    // Phase 2: Player1 fires at Player2
    const fireEvent: TelemetryCombatEvent = {
      type: 'fire',
      tick: recorder.getCurrentTick(),
      timestamp: Date.now(),
      data: {
        playerId: 'player1',
        position: { x: 200, y: 300 },
        direction: { x: 1, y: 0 },
      },
    }
    events.push(fireEvent)

    const projectile = createMockProjectile('proj1', 'player1', 250, 300)

    for (let i = 0; i < 20; i++) {
      projectile.position.x += 10 // Move projectile toward player2
      
      const players = new Map([
        ['player1', player1],
        ['player2', player2],
      ])
      const healthStates = new Map<string, HealthState | null>([
        ['player1', createMockHealthState(100)],
        ['player2', createMockHealthState(100 - i * 5)], // Taking damage
      ])
      const aimDirections = new Map([
        ['player1', { x: 1, y: 0 }],
        ['player2', { x: -1, y: 0 }],
      ])

      recorder.captureFrame(players, healthStates, [projectile], events.splice(0), aimDirections, new Set())
      vi.advanceTimersByTime(16)
    }

    // Phase 3: Player2 dies
    const deathEvent: TelemetryCombatEvent = {
      type: 'death',
      tick: recorder.getCurrentTick(),
      timestamp: Date.now(),
      data: {
        playerId: 'player2',
        killerId: 'player1',
        finalHitPosition: { x: 800, y: 300 },
        healthBeforeHit: 5,
        damageDealt: 25,
      },
    }
    events.push(deathEvent)

    const players = new Map([
      ['player1', player1],
      ['player2', player2],
    ])
    const healthStates = new Map<string, HealthState | null>([
      ['player1', createMockHealthState(100)],
      ['player2', createMockHealthState(0)],
    ])
    recorder.captureFrame(players, healthStates, [], events, new Map(), new Set(['player2']))

    // Extract death replay
    const replay = recorder.extractDeathReplay('player2', 'player1')

    // Verify replay structure
    expect(replay.lobbyId).toBe('test-lobby-123')
    expect(replay.victimId).toBe('player2')
    expect(replay.killerId).toBe('player1')
    expect(replay.frames.length).toBe(50) // replayFrames config
    expect(replay.flagged).toBe(false)

    // Verify frames contain valid data
    const firstFrame = replay.frames[0]
    expect(firstFrame.players.length).toBe(2)
    expect(firstFrame.networkStats).toBeDefined()

    const lastFrame = replay.frames[replay.frames.length - 1]
    const victimSnapshot = lastFrame.players.find(p => p.playerId === 'player2')
    expect(victimSnapshot?.state).toBe('respawning')
  })

  it('replay player correctly plays back captured frames', () => {
    // Capture some frames
    for (let i = 0; i < 60; i++) {
      const player1 = createMockPlayer('player1', 200 + i, 300)
      const player2 = createMockPlayer('player2', 800 - i, 300)
      
      const players = new Map([['player1', player1], ['player2', player2]])
      const healthStates = new Map<string, HealthState | null>([
        ['player1', createMockHealthState(100)],
        ['player2', createMockHealthState(100)],
      ])

      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    const replay = recorder.extractDeathReplay('player2', 'player1')
    
    // Load into player
    const frameChanges: number[] = []
    player.setCallbacks({
      onFrameChange: (_frame, index) => frameChanges.push(index),
    })
    player.load(replay)

    expect(player.getState()).toBe('stopped')
    expect(player.getCurrentFrameIndex()).toBe(0)
    expect(frameChanges).toContain(0) // Initial frame emitted on load

    // Play and verify progression
    player.play()
    expect(player.getState()).toBe('playing')

    // Simulate several update cycles
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(16)
      player.update()
    }

    expect(player.getCurrentFrameIndex()).toBeGreaterThan(0)

    // Seek to specific frame
    player.seekToFrame(25)
    expect(player.getCurrentFrameIndex()).toBe(25)

    // Step controls
    player.stepForward()
    expect(player.getCurrentFrameIndex()).toBe(26)

    player.stepBackward()
    expect(player.getCurrentFrameIndex()).toBe(25)
  })

  it('replay renderer produces valid output for frames', () => {
    // Create a mock canvas context
    const mockCtx = {
      canvas: { width: 800, height: 450 },
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: '',
      globalAlpha: 1,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    renderer.setContext(mockCtx)

    // Create a test frame
    const frame: TelemetryFrame = {
      tick: 100,
      timestamp: Date.now(),
      players: [
        {
          playerId: 'player1',
          position: { x: 200, y: 300 },
          velocity: { x: 100, y: 0 },
          health: 100,
          shield: 25,
          isInvulnerable: false,
          aimDirection: { x: 1, y: 0 },
          state: 'alive',
        },
        {
          playerId: 'player2',
          position: { x: 600, y: 300 },
          velocity: { x: -100, y: 0 },
          health: 50,
          shield: 0,
          isInvulnerable: false,
          aimDirection: { x: -1, y: 0 },
          state: 'alive',
        },
      ],
      projectiles: [
        {
          id: 'proj1',
          ownerId: 'player1',
          position: { x: 400, y: 300 },
          velocity: { x: 600, y: 0 },
          spawnTick: 95,
        },
      ],
      events: [],
      networkStats: {
        clientTick: 100,
        serverTick: 100,
        rttMs: 30,
        jitterMs: 5,
        packetLoss: 0,
      },
    }

    // Render frame
    renderer.renderFrame(frame, 'player2', 'player1')

    // Verify rendering calls were made
    expect(mockCtx.fillRect).toHaveBeenCalled()
    expect(mockCtx.arc).toHaveBeenCalled()
    expect(mockCtx.fill).toHaveBeenCalled()

    // Test with hitboxes enabled
    renderer.setOptions({ showHitboxes: true })
    renderer.renderFrame(frame, 'player2', 'player1')

    // Test with latency overlay
    renderer.setOptions({ showLatencyOverlay: true })
    renderer.renderFrame(frame, 'player2', 'player1')

    expect(mockCtx.fillText).toHaveBeenCalled()
  })
})


// ============================================================================
// Scenario 2: Network Stats Tracking
// ============================================================================

describe('E2E: Network Stats Tracking Through Replay', () => {
  let recorder: TelemetryRecorder

  beforeEach(() => {
    vi.useFakeTimers()
    recorder = new TelemetryRecorder({ maxFrames: 100, replayFrames: 50 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('captures network stats variations over time', () => {
    const player1 = createMockPlayer('player1', 200, 300)
    const players = new Map([['player1', player1]])
    const healthStates = new Map<string, HealthState | null>([
      ['player1', createMockHealthState(100)],
    ])

    // Simulate varying network conditions
    const rttValues = [30, 35, 40, 80, 120, 150, 100, 60, 40, 30]

    for (let i = 0; i < rttValues.length; i++) {
      recorder.updateNetworkStats({
        rttMs: rttValues[i],
        serverTick: i * 10,
        jitterMs: Math.abs(rttValues[i] - (rttValues[i - 1] ?? rttValues[i])),
      })

      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    const replay = recorder.extractDeathReplay('player1', 'env')

    // Verify network stats are captured in frames
    expect(replay.frames.length).toBe(10)

    // Check that RTT values are recorded
    const capturedRtts = replay.frames.map(f => f.networkStats.rttMs)
    expect(capturedRtts).toEqual(rttValues)

    // Verify high latency spike is captured
    const maxRtt = Math.max(...capturedRtts)
    expect(maxRtt).toBe(150)
  })

  it('tracks client/server tick alignment', () => {
    const player1 = createMockPlayer('player1', 200, 300)
    const players = new Map([['player1', player1]])
    const healthStates = new Map<string, HealthState | null>([
      ['player1', createMockHealthState(100)],
    ])

    // Simulate tick drift
    for (let i = 0; i < 20; i++) {
      recorder.updateNetworkStats({
        serverTick: i * 2, // Server running at different rate
      })

      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    const replay = recorder.extractDeathReplay('player1', 'env')

    // Verify tick alignment is tracked
    const lastFrame = replay.frames[replay.frames.length - 1]
    // Client tick is updated AFTER capture, so it's one less than total captures
    expect(lastFrame.networkStats.clientTick).toBe(19) // Client tick from recorder (0-indexed)
    expect(lastFrame.networkStats.serverTick).toBe(38) // Server tick from updates
  })
})

// ============================================================================
// Scenario 3: Projectile Tracking Through Combat
// ============================================================================

describe('E2E: Projectile Tracking Through Combat', () => {
  let recorder: TelemetryRecorder

  beforeEach(() => {
    vi.useFakeTimers()
    recorder = new TelemetryRecorder({ maxFrames: 100, replayFrames: 50 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('tracks multiple projectiles through their lifecycle', () => {
    const player1 = createMockPlayer('player1', 200, 300)
    const player2 = createMockPlayer('player2', 800, 300)
    const players = new Map([['player1', player1], ['player2', player2]])
    const healthStates = new Map<string, HealthState | null>([
      ['player1', createMockHealthState(100)],
      ['player2', createMockHealthState(100)],
    ])

    const projectiles: Projectile[] = []

    // Frame 1-5: No projectiles
    for (let i = 0; i < 5; i++) {
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    // Frame 6: Player1 fires
    projectiles.push(createMockProjectile('proj1', 'player1', 220, 300))
    recorder.captureFrame(players, healthStates, projectiles, [], new Map(), new Set())
    vi.advanceTimersByTime(16)

    // Frame 7-15: Projectile travels
    for (let i = 0; i < 9; i++) {
      projectiles[0].position.x += 60
      recorder.captureFrame(players, healthStates, projectiles, [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    // Frame 16: Player2 fires back
    projectiles.push(createMockProjectile('proj2', 'player2', 780, 300))
    projectiles[1].velocity = { x: -600, y: 0 }
    recorder.captureFrame(players, healthStates, projectiles, [], new Map(), new Set())
    vi.advanceTimersByTime(16)

    // Frame 17-20: Both projectiles travel
    for (let i = 0; i < 4; i++) {
      projectiles[0].position.x += 60
      projectiles[1].position.x -= 60
      recorder.captureFrame(players, healthStates, projectiles, [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    // Frame 21: proj1 hits, removed
    projectiles.shift()
    recorder.captureFrame(players, healthStates, projectiles, [], new Map(), new Set())

    const replay = recorder.extractDeathReplay('player2', 'player1')

    // Verify projectile tracking
    const frameWithBothProjectiles = replay.frames.find(f => f.projectiles.length === 2)
    expect(frameWithBothProjectiles).toBeDefined()
    expect(frameWithBothProjectiles!.projectiles.map(p => p.ownerId).sort()).toEqual(['player1', 'player2'])

    // Verify projectile positions change over time
    const proj1Positions = replay.frames
      .filter(f => f.projectiles.some(p => p.id === 'proj1'))
      .map(f => f.projectiles.find(p => p.id === 'proj1')!.position.x)

    expect(proj1Positions.length).toBeGreaterThan(5)
    expect(proj1Positions[proj1Positions.length - 1]).toBeGreaterThan(proj1Positions[0])
  })
})

// ============================================================================
// Scenario 4: Player State Transitions
// ============================================================================

describe('E2E: Player State Transitions', () => {
  let recorder: TelemetryRecorder

  beforeEach(() => {
    vi.useFakeTimers()
    recorder = new TelemetryRecorder({ maxFrames: 100, replayFrames: 50 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('tracks player through alive -> dead -> respawning -> alive', () => {
    const player1 = createMockPlayer('player1', 200, 300)
    const player2 = createMockPlayer('player2', 800, 300)
    const players = new Map([['player1', player1], ['player2', player2]])

    // Phase 1: Both alive
    for (let i = 0; i < 10; i++) {
      const healthStates = new Map<string, HealthState | null>([
        ['player1', createMockHealthState(100)],
        ['player2', createMockHealthState(100 - i * 10)],
      ])
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    // Phase 2: Player2 dies
    for (let i = 0; i < 5; i++) {
      const healthStates = new Map<string, HealthState | null>([
        ['player1', createMockHealthState(100)],
        ['player2', createMockHealthState(0)],
      ])
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set(['player2']))
      vi.advanceTimersByTime(16)
    }

    // Phase 3: Player2 respawns with invulnerability
    player2.position = { x: 100, y: 100 } // New spawn position
    for (let i = 0; i < 5; i++) {
      const healthStates = new Map<string, HealthState | null>([
        ['player1', createMockHealthState(100)],
        ['player2', { ...createMockHealthState(100), isInvulnerable: true, invulnerabilityEnd: Date.now() + 2000 }],
      ])
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    const replay = recorder.extractDeathReplay('player2', 'player1')

    // Verify state transitions
    const player2States = replay.frames.map(f => {
      const p2 = f.players.find(p => p.playerId === 'player2')
      return { state: p2?.state, health: p2?.health, invuln: p2?.isInvulnerable }
    })

    // Should have alive -> respawning -> alive (invulnerable) transitions
    const hasAlive = player2States.some(s => s.state === 'alive' && !s.invuln)
    const hasRespawning = player2States.some(s => s.state === 'respawning')
    const hasInvulnerable = player2States.some(s => s.state === 'alive' && s.invuln)

    expect(hasAlive).toBe(true)
    expect(hasRespawning).toBe(true)
    expect(hasInvulnerable).toBe(true)
  })

  it('tracks velocity changes during movement', () => {
    const player1 = createMockPlayer('player1', 200, 300)
    const players = new Map([['player1', player1]])
    const healthStates = new Map<string, HealthState | null>([
      ['player1', createMockHealthState(100)],
    ])

    // Stationary
    for (let i = 0; i < 5; i++) {
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    // Moving right
    for (let i = 0; i < 10; i++) {
      player1.position.x += 5
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    // Stop
    for (let i = 0; i < 5; i++) {
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    const replay = recorder.extractDeathReplay('player1', 'env')

    // Check velocity tracking
    const velocities = replay.frames.map(f => f.players[0].velocity.x)

    // Should have zero velocity at start
    expect(velocities[0]).toBe(0)

    // Should have positive velocity during movement
    const movingVelocities = velocities.slice(5, 15)
    expect(movingVelocities.every(v => v > 0)).toBe(true)

    // Should return to zero after stopping
    expect(velocities[velocities.length - 1]).toBe(0)
  })
})

// ============================================================================
// Scenario 5: Replay Player Edge Cases
// ============================================================================

describe('E2E: Replay Player Edge Cases', () => {
  let recorder: TelemetryRecorder
  let player: ReplayPlayer

  beforeEach(() => {
    vi.useFakeTimers()
    recorder = new TelemetryRecorder({ maxFrames: 100, replayFrames: 50 })
    player = new ReplayPlayer()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles playback speed changes correctly', () => {
    // Create replay with known frame count
    for (let i = 0; i < 60; i++) {
      const p1 = createMockPlayer('player1', 200 + i, 300)
      const players = new Map([['player1', p1]])
      const healthStates = new Map<string, HealthState | null>([
        ['player1', createMockHealthState(100)],
      ])
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    const replay = recorder.extractDeathReplay('player1', 'env')
    player.load(replay)

    // Test 2x speed
    player.setSpeed(2)
    player.play()

    vi.advanceTimersByTime(100)
    player.update()
    const fastIndex = player.getCurrentFrameIndex()

    // Reset and test 0.5x speed
    player.stop()
    player.setSpeed(0.5)
    player.play()

    vi.advanceTimersByTime(100)
    player.update()
    const slowIndex = player.getCurrentFrameIndex()

    // 2x should advance roughly 4x as far as 0.5x
    expect(fastIndex).toBeGreaterThan(slowIndex * 2)
  })

  it('handles seek to timestamp correctly', () => {
    const baseTime = Date.now()

    for (let i = 0; i < 60; i++) {
      vi.setSystemTime(baseTime + i * 16)
      const p1 = createMockPlayer('player1', 200, 300)
      const players = new Map([['player1', p1]])
      const healthStates = new Map<string, HealthState | null>([
        ['player1', createMockHealthState(100)],
      ])
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
    }

    const replay = recorder.extractDeathReplay('player1', 'env')
    player.load(replay)

    // Seek to middle timestamp
    const middleTimestamp = replay.frames[30].timestamp
    player.seekToTime(middleTimestamp)

    expect(player.getCurrentFrameIndex()).toBe(30)
  })

  it('emits correct callbacks during playback', () => {
    for (let i = 0; i < 30; i++) {
      const p1 = createMockPlayer('player1', 200, 300)
      const players = new Map([['player1', p1]])
      const healthStates = new Map<string, HealthState | null>([
        ['player1', createMockHealthState(100)],
      ])
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      vi.advanceTimersByTime(16)
    }

    const replay = recorder.extractDeathReplay('player1', 'env')

    const callbacks = {
      frameChanges: [] as number[],
      stateChanges: [] as string[],
      playbackEnded: false,
    }

    player.setCallbacks({
      onFrameChange: (_frame, index) => callbacks.frameChanges.push(index),
      onStateChange: (state) => callbacks.stateChanges.push(state),
      onPlaybackEnd: () => { callbacks.playbackEnded = true },
    })

    player.load(replay)
    expect(callbacks.stateChanges).toContain('stopped')

    player.play()
    expect(callbacks.stateChanges).toContain('playing')

    // Play to end
    for (let i = 0; i < 100; i++) {
      vi.advanceTimersByTime(16)
      player.update()
    }

    expect(callbacks.playbackEnded).toBe(true)
    expect(callbacks.frameChanges.length).toBeGreaterThan(0)
  })
})
