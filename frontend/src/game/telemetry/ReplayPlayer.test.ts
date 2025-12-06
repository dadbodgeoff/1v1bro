import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ReplayPlayer } from './ReplayPlayer'
import type { DeathReplay, TelemetryFrame } from './types'

describe('ReplayPlayer', () => {
  let player: ReplayPlayer

  const createFrame = (tick: number, timestamp: number): TelemetryFrame => ({
    tick,
    timestamp,
    players: [],
    projectiles: [],
    events: [],
    networkStats: {
      clientTick: tick,
      serverTick: tick,
      rttMs: 30,
      jitterMs: 5,
      packetLoss: 0,
    },
  })

  const createReplay = (frameCount: number): DeathReplay => {
    const baseTime = Date.now()
    const frames = Array.from({ length: frameCount }, (_, i) =>
      createFrame(i, baseTime + i * 16) // ~60fps
    )
    return {
      id: 'replay-1',
      lobbyId: 'lobby-1',
      victimId: 'player1',
      killerId: 'player2',
      deathTick: frameCount - 1,
      deathTimestamp: baseTime + (frameCount - 1) * 16,
      frames,
      flagged: false,
      createdAt: baseTime,
      expiresAt: baseTime + 24 * 60 * 60 * 1000,
    }
  }

  beforeEach(() => {
    player = new ReplayPlayer()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('load', () => {
    it('loads a replay and resets state', () => {
      const replay = createReplay(10)
      player.load(replay)

      expect(player.getReplay()).toBe(replay)
      expect(player.getCurrentFrameIndex()).toBe(0)
      expect(player.getState()).toBe('stopped')
    })

    it('emits frame change on load', () => {
      const onFrameChange = vi.fn()
      player.setCallbacks({ onFrameChange })

      const replay = createReplay(10)
      player.load(replay)

      expect(onFrameChange).toHaveBeenCalledWith(replay.frames[0], 0, 10)
    })
  })

  describe('play/pause', () => {
    it('starts playback', () => {
      const onStateChange = vi.fn()
      player.setCallbacks({ onStateChange })

      player.load(createReplay(10))
      player.play()

      expect(player.getState()).toBe('playing')
      expect(onStateChange).toHaveBeenCalledWith('playing')
    })

    it('pauses playback', () => {
      const onStateChange = vi.fn()
      player.setCallbacks({ onStateChange })

      player.load(createReplay(10))
      player.play()
      player.pause()

      expect(player.getState()).toBe('paused')
      expect(onStateChange).toHaveBeenCalledWith('paused')
    })

    it('toggles play/pause', () => {
      player.load(createReplay(10))

      player.togglePlayPause()
      expect(player.getState()).toBe('playing')

      player.togglePlayPause()
      expect(player.getState()).toBe('paused')
    })

    it('restarts from beginning if at end', () => {
      player.load(createReplay(10))
      player.seekToFrame(9) // Go to last frame
      player.play()

      expect(player.getCurrentFrameIndex()).toBe(0)
    })
  })

  describe('stop', () => {
    it('stops and resets to beginning', () => {
      player.load(createReplay(10))
      player.play()
      player.seekToFrame(5)
      player.stop()

      expect(player.getState()).toBe('stopped')
      expect(player.getCurrentFrameIndex()).toBe(0)
    })
  })

  describe('setSpeed', () => {
    it('clamps speed to valid range', () => {
      player.setSpeed(0.1)
      expect(player.getSpeed()).toBe(0.25)

      player.setSpeed(5)
      expect(player.getSpeed()).toBe(2)

      player.setSpeed(1)
      expect(player.getSpeed()).toBe(1)
    })
  })

  describe('seekToFrame', () => {
    it('seeks to specific frame', () => {
      const onFrameChange = vi.fn()
      player.setCallbacks({ onFrameChange })

      player.load(createReplay(10))
      player.seekToFrame(5)

      expect(player.getCurrentFrameIndex()).toBe(5)
      expect(onFrameChange).toHaveBeenLastCalledWith(expect.anything(), 5, 10)
    })

    it('clamps to valid range', () => {
      player.load(createReplay(10))

      player.seekToFrame(-5)
      expect(player.getCurrentFrameIndex()).toBe(0)

      player.seekToFrame(100)
      expect(player.getCurrentFrameIndex()).toBe(9)
    })
  })

  describe('stepForward/stepBackward', () => {
    it('steps forward one frame', () => {
      player.load(createReplay(10))
      player.stepForward()

      expect(player.getCurrentFrameIndex()).toBe(1)
    })

    it('steps backward one frame', () => {
      player.load(createReplay(10))
      player.seekToFrame(5)
      player.stepBackward()

      expect(player.getCurrentFrameIndex()).toBe(4)
    })

    it('does not step past boundaries', () => {
      player.load(createReplay(10))

      player.stepBackward()
      expect(player.getCurrentFrameIndex()).toBe(0)

      player.seekToFrame(9)
      player.stepForward()
      expect(player.getCurrentFrameIndex()).toBe(9)
    })
  })

  describe('update', () => {
    it('advances frames during playback', () => {
      player.load(createReplay(10))
      player.play()

      // Advance time by ~2 frames worth
      vi.advanceTimersByTime(32)
      player.update()

      expect(player.getCurrentFrameIndex()).toBeGreaterThan(0)
    })

    it('does not advance when paused', () => {
      player.load(createReplay(10))
      player.play()
      player.pause()

      vi.advanceTimersByTime(100)
      player.update()

      expect(player.getCurrentFrameIndex()).toBe(0)
    })

    it('emits playback end at last frame', () => {
      const onPlaybackEnd = vi.fn()
      player.setCallbacks({ onPlaybackEnd })

      player.load(createReplay(3))
      player.play()

      // Advance past all frames
      vi.advanceTimersByTime(100)
      player.update()

      expect(onPlaybackEnd).toHaveBeenCalled()
      expect(player.getState()).toBe('paused')
    })

    it('respects playback speed', () => {
      player.load(createReplay(100))
      player.setSpeed(2)
      player.play()

      vi.advanceTimersByTime(50)
      player.update()

      const fastIndex = player.getCurrentFrameIndex()

      // Reset and try at normal speed
      player.stop()
      player.setSpeed(1)
      player.play()

      vi.advanceTimersByTime(50)
      player.update()

      const normalIndex = player.getCurrentFrameIndex()

      // 2x speed should advance roughly twice as far
      expect(fastIndex).toBeGreaterThan(normalIndex)
    })
  })

  describe('getTimeFromDeath', () => {
    it('returns negative time before death', () => {
      const replay = createReplay(10)
      player.load(replay)
      player.seekToFrame(0)

      const time = player.getTimeFromDeath()
      expect(time).toBeLessThan(0)
    })

    it('returns zero at death frame', () => {
      const replay = createReplay(10)
      player.load(replay)
      player.seekToFrame(9) // Last frame = death

      const time = player.getTimeFromDeath()
      expect(time).toBeCloseTo(0, 1)
    })
  })

  describe('getProgress', () => {
    it('returns 0 at start', () => {
      player.load(createReplay(10))
      expect(player.getProgress()).toBe(0)
    })

    it('returns 1 at end', () => {
      player.load(createReplay(10))
      player.seekToFrame(9)
      expect(player.getProgress()).toBe(1)
    })

    it('returns 0.5 at middle', () => {
      player.load(createReplay(11)) // 11 frames: 0-10
      player.seekToFrame(5)
      expect(player.getProgress()).toBe(0.5)
    })
  })

  describe('unload', () => {
    it('clears replay and resets state', () => {
      player.load(createReplay(10))
      player.play()
      player.seekToFrame(5)

      player.unload()

      expect(player.getReplay()).toBeNull()
      expect(player.getCurrentFrameIndex()).toBe(0)
      expect(player.getState()).toBe('stopped')
    })
  })
})
