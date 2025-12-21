/**
 * ArenaGameLoop - Fixed timestep game loop with interpolation
 * Ported from survival runner for consistent physics
 * 
 * Features:
 * - Fixed timestep physics (60Hz default)
 * - Visual interpolation for smooth rendering
 * - Hitstop for impact feel
 * - Time scale for slow-mo effects
 * - Lag spike detection
 */

export interface ArenaGameLoopStats {
  fps: number
  frameTime: number
  physicsTime: number
  renderTime: number
  lagSpikes: number
  interpolation: number
  timeScale: number
  isInHitstop: boolean
}

export interface ArenaGameLoopCallbacks {
  onFixedUpdate: (fixedDelta: number, now: number) => void
  onRenderUpdate: (delta: number, interpolation: number, now: number) => void
  onLagSpike?: (missedFrames: number) => void
}

export class ArenaGameLoop {
  private fixedTimestep: number
  private readonly MAX_FRAME_TIME = 0.25
  private readonly LAG_SPIKE_THRESHOLD = 0.1
  
  private accumulator = 0
  private lastTime = 0
  private interpolation = 0
  
  // Stats
  private frameCount = 0
  private fpsTimer = 0
  private currentFps = 60
  private lagSpikes = 0
  private physicsTime = 0
  private renderTime = 0
  
  // State
  private running = false
  private animationId: number | null = null
  private callbacks: ArenaGameLoopCallbacks

  // Hitstop - freeze frames on impact
  private hitstopTimer = 0
  private hitstopDuration = 0
  private hitstopIntensity = 0
  
  // External time scale (slow-mo death, etc.)
  private externalTimeScale = 1.0
  
  constructor(callbacks: ArenaGameLoopCallbacks, fixedTimestep = 1 / 60) {
    this.callbacks = callbacks
    this.fixedTimestep = fixedTimestep
  }

  /**
   * Set the fixed timestep (for quality adjustment)
   */
  setFixedTimestep(timestep: number): void {
    this.fixedTimestep = timestep
  }

  /**
   * Trigger hitstop (screen freeze on impact)
   * @param frames Number of frames to freeze (at 60fps, 3 frames = 50ms)
   * @param intensity 0-1, how much to slow time (0 = full freeze, 1 = normal speed)
   */
  triggerHitstop(frames = 3, intensity = 0.1): void {
    this.hitstopDuration = frames * this.fixedTimestep
    this.hitstopTimer = this.hitstopDuration
    this.hitstopIntensity = intensity
  }

  /**
   * Check if currently in hitstop
   */
  isInHitstop(): boolean {
    return this.hitstopTimer > 0
  }

  /**
   * Get hitstop progress (0-1, 1 = just started, 0 = ending)
   */
  getHitstopProgress(): number {
    if (this.hitstopDuration <= 0) return 0
    return this.hitstopTimer / this.hitstopDuration
  }

  /**
   * Set external time scale (for slow-mo death, etc.)
   * @param scale Time scale multiplier (0.2 = 20% speed, 1.0 = normal)
   */
  setTimeScale(scale: number): void {
    this.externalTimeScale = Math.max(0, Math.min(2, scale))
  }

  /**
   * Get current time scale
   */
  getTimeScale(): number {
    return this.externalTimeScale
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return
    
    this.running = true
    this.lastTime = performance.now() / 1000
    this.accumulator = 0
    this.frameCount = 0
    this.fpsTimer = 0
    this.lagSpikes = 0
    
    this.tick()
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.running = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running
  }

  /**
   * Get current stats
   */
  getStats(): ArenaGameLoopStats {
    return {
      fps: this.currentFps,
      frameTime: 1000 / Math.max(1, this.currentFps),
      physicsTime: this.physicsTime,
      renderTime: this.renderTime,
      lagSpikes: this.lagSpikes,
      interpolation: this.interpolation,
      timeScale: this.externalTimeScale,
      isInHitstop: this.hitstopTimer > 0,
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.currentFps
  }

  /**
   * Main loop tick
   */
  private tick = (): void => {
    if (!this.running) return
    
    this.animationId = requestAnimationFrame(this.tick)
    
    const currentTime = performance.now() / 1000
    let frameTime = currentTime - this.lastTime
    this.lastTime = currentTime
    
    // Detect lag spikes
    if (frameTime > this.LAG_SPIKE_THRESHOLD) {
      const missedFrames = Math.floor(frameTime / this.fixedTimestep)
      this.lagSpikes++
      this.callbacks.onLagSpike?.(missedFrames)
    }
    
    // Cap frame time to prevent spiral of death
    if (frameTime > this.MAX_FRAME_TIME) {
      frameTime = this.MAX_FRAME_TIME
    }
    
    // Update FPS counter
    this.frameCount++
    this.fpsTimer += frameTime
    if (this.fpsTimer >= 1.0) {
      this.currentFps = this.frameCount
      this.frameCount = 0
      this.fpsTimer -= 1.0
    }
    
    // Apply external time scale
    let effectiveFrameTime = frameTime * this.externalTimeScale
    
    // Hitstop - slow/freeze time on impact
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= frameTime // Hitstop timer uses real time
      effectiveFrameTime = effectiveFrameTime * this.hitstopIntensity
    }
    
    // Accumulate time for fixed updates
    this.accumulator += effectiveFrameTime
    
    // Run fixed updates (physics)
    const physicsStart = performance.now()
    const now = performance.now()
    while (this.accumulator >= this.fixedTimestep) {
      this.callbacks.onFixedUpdate(this.fixedTimestep, now)
      this.accumulator -= this.fixedTimestep
    }
    this.physicsTime = performance.now() - physicsStart
    
    // Calculate interpolation for smooth rendering
    this.interpolation = this.accumulator / this.fixedTimestep
    
    // Render update (variable rate)
    const renderStart = performance.now()
    this.callbacks.onRenderUpdate(frameTime, this.interpolation, now)
    this.renderTime = performance.now() - renderStart
  }
}
