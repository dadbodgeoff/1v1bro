/**
 * GameLoop - Fixed timestep game loop with interpolation
 * Ensures consistent physics regardless of framerate
 */

export interface GameLoopStats {
  fps: number
  frameTime: number
  physicsTime: number
  renderTime: number
  lagSpikes: number
  interpolation: number
}

export interface GameLoopCallbacks {
  onFixedUpdate: (fixedDelta: number) => void  // Physics/logic at fixed rate
  onUpdate: (delta: number, interpolation: number) => void  // Render at variable rate
  onLagSpike: (missedFrames: number) => void
}

export class GameLoop {
  // Timing
  private readonly FIXED_TIMESTEP: number = 1 / 60  // 60 Hz physics
  private readonly MAX_FRAME_TIME: number = 0.25    // Cap to prevent spiral of death
  private readonly LAG_SPIKE_THRESHOLD: number = 0.1 // 100ms = lag spike
  
  private accumulator: number = 0
  private lastTime: number = 0
  private interpolation: number = 0
  
  // Stats
  private frameCount: number = 0
  private fpsTimer: number = 0
  private currentFps: number = 60
  private lagSpikes: number = 0
  private physicsTime: number = 0
  private renderTime: number = 0
  
  // State
  private running: boolean = false
  private animationId: number | null = null
  private callbacks: GameLoopCallbacks

  // AAA Feature: Hitstop - freeze frames on impact
  private hitstopTimer: number = 0
  private hitstopDuration: number = 0
  private hitstopIntensity: number = 0 // 0-1, affects time scale during hitstop
  
  // AAA Feature: External time scale (for slow-mo death, etc.)
  private externalTimeScale: number = 1.0
  
  constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * AAA Feature: Trigger hitstop (screen freeze on impact)
   * @param frames Number of frames to freeze (at 60fps, 3 frames = 50ms)
   * @param intensity 0-1, how much to slow time (0 = full freeze, 1 = normal speed)
   */
  triggerHitstop(frames: number = 3, intensity: number = 0.1): void {
    this.hitstopDuration = frames * this.FIXED_TIMESTEP
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
    this.externalTimeScale = Math.max(0, Math.min(1, scale))
  }

  /**
   * Get current external time scale
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
      const missedFrames = Math.floor(frameTime / this.FIXED_TIMESTEP)
      this.lagSpikes++
      this.callbacks.onLagSpike(missedFrames)
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
    
    // AAA Feature: Apply external time scale (slow-mo death, etc.)
    let effectiveFrameTime = frameTime * this.externalTimeScale
    
    // AAA Feature: Hitstop - slow/freeze time on impact (stacks with time scale)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= frameTime  // Hitstop timer uses real time
      // Scale time during hitstop (intensity 0 = full freeze, 1 = normal)
      effectiveFrameTime = effectiveFrameTime * this.hitstopIntensity
    }
    
    // Accumulate time for fixed updates
    this.accumulator += effectiveFrameTime
    
    // Run fixed updates (physics)
    const physicsStart = performance.now()
    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.callbacks.onFixedUpdate(this.FIXED_TIMESTEP)
      this.accumulator -= this.FIXED_TIMESTEP
    }
    this.physicsTime = performance.now() - physicsStart
    
    // Calculate interpolation for smooth rendering
    this.interpolation = this.accumulator / this.FIXED_TIMESTEP
    
    // Render update (variable rate)
    const renderStart = performance.now()
    this.callbacks.onUpdate(frameTime, this.interpolation)
    this.renderTime = performance.now() - renderStart
  }

  /**
   * Get current stats
   */
  getStats(): GameLoopStats {
    return {
      fps: this.currentFps,
      frameTime: 1000 / Math.max(1, this.currentFps),
      physicsTime: this.physicsTime,
      renderTime: this.renderTime,
      lagSpikes: this.lagSpikes,
      interpolation: this.interpolation,
    }
  }

  /**
   * Get fixed timestep value
   */
  getFixedTimestep(): number {
    return this.FIXED_TIMESTEP
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running
  }
}
