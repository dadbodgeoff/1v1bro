/**
 * Replay Player
 * Controls playback of death replays with scrubbing and speed control
 */

import type { TelemetryFrame, DeathReplay } from './types'

export type PlaybackState = 'stopped' | 'playing' | 'paused'

export interface ReplayPlayerCallbacks {
  onFrameChange?: (frame: TelemetryFrame, index: number, total: number) => void
  onPlaybackEnd?: () => void
  onStateChange?: (state: PlaybackState) => void
}

export class ReplayPlayer {
  private replay: DeathReplay | null = null
  private currentFrameIndex = 0
  private playbackState: PlaybackState = 'stopped'
  private playbackSpeed = 1.0
  private lastUpdateTime = 0
  private frameAccumulator = 0

  private callbacks: ReplayPlayerCallbacks = {}

  /**
   * Set playback callbacks
   */
  setCallbacks(callbacks: ReplayPlayerCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Load a replay for playback
   */
  load(replay: DeathReplay): void {
    this.replay = replay
    this.currentFrameIndex = 0
    this.playbackState = 'stopped'
    this.frameAccumulator = 0
    this.callbacks.onStateChange?.('stopped')
    this.emitFrame()
  }

  /**
   * Start or resume playback
   */
  play(): void {
    if (!this.replay) return
    if (this.currentFrameIndex >= this.replay.frames.length - 1) {
      this.currentFrameIndex = 0
    }
    this.playbackState = 'playing'
    this.lastUpdateTime = Date.now()
    this.callbacks.onStateChange?.('playing')
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.playbackState = 'paused'
    this.callbacks.onStateChange?.('paused')
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    this.playbackState = 'stopped'
    this.currentFrameIndex = 0
    this.frameAccumulator = 0
    this.callbacks.onStateChange?.('stopped')
    this.emitFrame()
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    if (this.playbackState === 'playing') {
      this.pause()
    } else {
      this.play()
    }
  }

  /**
   * Set playback speed (0.25x to 2x)
   */
  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(2.0, speed))
  }

  /**
   * Get current playback speed
   */
  getSpeed(): number {
    return this.playbackSpeed
  }

  /**
   * Seek to a specific frame index
   */
  seekToFrame(index: number): void {
    if (!this.replay) return
    this.currentFrameIndex = Math.max(0, Math.min(index, this.replay.frames.length - 1))
    this.frameAccumulator = 0
    this.emitFrame()
  }

  /**
   * Seek to a specific timestamp
   */
  seekToTime(timestamp: number): void {
    if (!this.replay) return
    
    // Find the frame closest to the timestamp
    let closestIndex = 0
    let closestDiff = Infinity
    
    for (let i = 0; i < this.replay.frames.length; i++) {
      const diff = Math.abs(this.replay.frames[i].timestamp - timestamp)
      if (diff < closestDiff) {
        closestDiff = diff
        closestIndex = i
      }
    }
    
    this.seekToFrame(closestIndex)
  }

  /**
   * Step forward one frame
   */
  stepForward(): void {
    if (!this.replay) return
    if (this.currentFrameIndex < this.replay.frames.length - 1) {
      this.currentFrameIndex++
      this.emitFrame()
    }
  }

  /**
   * Step backward one frame
   */
  stepBackward(): void {
    if (this.currentFrameIndex > 0) {
      this.currentFrameIndex--
      this.emitFrame()
    }
  }

  /**
   * Update playback - call every frame
   */
  update(): void {
    if (this.playbackState !== 'playing' || !this.replay) return

    const now = Date.now()
    const elapsed = (now - this.lastUpdateTime) * this.playbackSpeed
    this.lastUpdateTime = now

    // Accumulate time and advance frames
    const frameTime = 1000 / 60 // 60fps
    this.frameAccumulator += elapsed

    while (this.frameAccumulator >= frameTime) {
      this.frameAccumulator -= frameTime
      this.currentFrameIndex++

      if (this.currentFrameIndex >= this.replay.frames.length) {
        this.currentFrameIndex = this.replay.frames.length - 1
        this.playbackState = 'paused'
        this.callbacks.onStateChange?.('paused')
        this.callbacks.onPlaybackEnd?.()
        break
      }
    }

    this.emitFrame()
  }

  /**
   * Get current frame
   */
  getCurrentFrame(): TelemetryFrame | null {
    return this.replay?.frames[this.currentFrameIndex] ?? null
  }

  /**
   * Get current frame index
   */
  getCurrentFrameIndex(): number {
    return this.currentFrameIndex
  }

  /**
   * Get total frame count
   */
  getTotalFrames(): number {
    return this.replay?.frames.length ?? 0
  }

  /**
   * Get playback state
   */
  getState(): PlaybackState {
    return this.playbackState
  }

  /**
   * Get loaded replay
   */
  getReplay(): DeathReplay | null {
    return this.replay
  }

  /**
   * Get time offset from death (negative = before death)
   */
  getTimeFromDeath(): number {
    if (!this.replay) return 0
    const currentFrame = this.replay.frames[this.currentFrameIndex]
    if (!currentFrame) return 0
    return (currentFrame.timestamp - this.replay.deathTimestamp) / 1000
  }

  /**
   * Get progress as percentage (0-1)
   */
  getProgress(): number {
    if (!this.replay || this.replay.frames.length === 0) return 0
    return this.currentFrameIndex / (this.replay.frames.length - 1)
  }

  /**
   * Emit current frame to callback
   */
  private emitFrame(): void {
    if (!this.replay) return
    const frame = this.replay.frames[this.currentFrameIndex]
    if (frame) {
      this.callbacks.onFrameChange?.(frame, this.currentFrameIndex, this.replay.frames.length)
    }
  }

  /**
   * Unload replay and reset state
   */
  unload(): void {
    this.replay = null
    this.currentFrameIndex = 0
    this.playbackState = 'stopped'
    this.frameAccumulator = 0
  }
}
