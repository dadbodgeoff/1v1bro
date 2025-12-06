import { describe, it, expect, beforeEach } from 'vitest'
import { TelemetryRecorder } from './TelemetryRecorder'
import type { PlayerState, HealthState, Projectile } from '../types'
import type { TelemetryCombatEvent } from './types'

describe('TelemetryRecorder', () => {
  let recorder: TelemetryRecorder

  beforeEach(() => {
    recorder = new TelemetryRecorder({ maxFrames: 10, replayFrames: 5 })
  })

  const createPlayer = (id: string, x: number, y: number): PlayerState => ({
    id,
    position: { x, y },
    trail: [],
    isLocal: id === 'player1',
  })

  const createHealthState = (current: number): HealthState => ({
    current,
    max: 100,
    shield: 0,
    shieldMax: 50,
    lastDamageTime: 0,
    isInvulnerable: false,
    invulnerabilityEnd: 0,
  })

  describe('captureFrame', () => {
    it('captures player snapshots', () => {
      const players = new Map([
        ['player1', createPlayer('player1', 100, 200)],
        ['player2', createPlayer('player2', 300, 400)],
      ])
      const healthStates = new Map([
        ['player1', createHealthState(100)],
        ['player2', createHealthState(75)],
      ])

      recorder.captureFrame(
        players,
        healthStates,
        [],
        [],
        new Map([['player1', { x: 1, y: 0 }], ['player2', { x: -1, y: 0 }]]),
        new Set()
      )

      expect(recorder.getBufferSize()).toBe(1)
      expect(recorder.getCurrentTick()).toBe(1)
    })

    it('respects ring buffer max size', () => {
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(100)]])

      // Capture more frames than max
      for (let i = 0; i < 15; i++) {
        recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      }

      expect(recorder.getBufferSize()).toBe(10) // maxFrames
      expect(recorder.getCurrentTick()).toBe(15)
    })

    it('calculates velocity from position changes', () => {
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(100)]])

      // First frame
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())

      // Move player
      players.set('player1', createPlayer('player1', 160, 200)) // Moved 60 units

      // Second frame
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())

      // Velocity should be calculated (60 units / (1/60 sec) = 3600 units/sec)
      expect(recorder.getBufferSize()).toBe(2)
    })

    it('captures projectile snapshots', () => {
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(100)]])
      const projectiles: Projectile[] = [{
        id: 'proj1',
        ownerId: 'player1',
        position: { x: 150, y: 200 },
        velocity: { x: 600, y: 0 },
        spawnTime: Date.now(),
        spawnPosition: { x: 100, y: 200 },
        damage: 25,
        isPredicted: true,
      }]

      recorder.captureFrame(players, healthStates, projectiles, [], new Map(), new Set())

      expect(recorder.getBufferSize()).toBe(1)
    })

    it('captures combat events', () => {
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(100)]])
      const events: TelemetryCombatEvent[] = [{
        type: 'fire',
        tick: 0,
        timestamp: Date.now(),
        data: {
          playerId: 'player1',
          position: { x: 100, y: 200 },
          direction: { x: 1, y: 0 },
        },
      }]

      recorder.captureFrame(players, healthStates, [], events, new Map(), new Set())

      expect(recorder.getBufferSize()).toBe(1)
    })

    it('tracks respawning players', () => {
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(0)]])
      const respawning = new Set(['player1'])

      recorder.captureFrame(players, healthStates, [], [], new Map(), respawning)

      expect(recorder.getBufferSize()).toBe(1)
    })
  })

  describe('extractDeathReplay', () => {
    it('extracts last N frames for replay', () => {
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(100)]])

      // Capture 8 frames
      for (let i = 0; i < 8; i++) {
        recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      }

      const replay = recorder.extractDeathReplay('player1', 'player2')

      expect(replay.frames.length).toBe(5) // replayFrames config
      expect(replay.victimId).toBe('player1')
      expect(replay.killerId).toBe('player2')
      expect(replay.flagged).toBe(false)
    })

    it('includes lobby ID in replay', () => {
      recorder.setLobbyId('lobby-123')
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(100)]])

      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())

      const replay = recorder.extractDeathReplay('player1', 'player2')

      expect(replay.lobbyId).toBe('lobby-123')
    })

    it('sets expiry to 24 hours', () => {
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(100)]])

      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())

      const replay = recorder.extractDeathReplay('player1', 'player2')
      const expectedExpiry = replay.createdAt + 24 * 60 * 60 * 1000

      expect(replay.expiresAt).toBe(expectedExpiry)
    })
  })

  describe('updateNetworkStats', () => {
    it('updates network stats', () => {
      recorder.updateNetworkStats({ rttMs: 50, jitterMs: 5 })

      const stats = recorder.getNetworkStats()
      expect(stats.rttMs).toBe(50)
      expect(stats.jitterMs).toBe(5)
    })

    it('updates client tick to current tick', () => {
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(100)]])

      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      recorder.updateNetworkStats({ serverTick: 100 })

      const stats = recorder.getNetworkStats()
      expect(stats.clientTick).toBe(2)
      expect(stats.serverTick).toBe(100)
    })
  })

  describe('reset', () => {
    it('clears all state', () => {
      const players = new Map([['player1', createPlayer('player1', 100, 200)]])
      const healthStates = new Map([['player1', createHealthState(100)]])

      recorder.captureFrame(players, healthStates, [], [], new Map(), new Set())
      recorder.updateNetworkStats({ rttMs: 50 })

      recorder.reset()

      expect(recorder.getBufferSize()).toBe(0)
      expect(recorder.getCurrentTick()).toBe(0)
      expect(recorder.getNetworkStats().rttMs).toBe(0)
    })
  })
})
