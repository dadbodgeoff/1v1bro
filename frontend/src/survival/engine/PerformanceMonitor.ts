/**
 * PerformanceMonitor - Tracks game performance and detects issues
 * Provides metrics for debugging and optimization
 */

export interface PerformanceMetrics {
  fps: number
  avgFrameTime: number
  minFrameTime: number
  maxFrameTime: number
  physicsTime: number
  renderTime: number
  memoryUsage: number | null
  lagSpikes: number
  droppedFrames: number
}

export interface PerformanceThresholds {
  minFps: number
  maxFrameTime: number
  maxPhysicsTime: number
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFps: 30,
  maxFrameTime: 50,    // 50ms = 20fps
  maxPhysicsTime: 10,  // 10ms max for physics
}

export class PerformanceMonitor {
  private thresholds: PerformanceThresholds
  
  // Frame time tracking
  private frameTimes: number[] = []
  private readonly SAMPLE_SIZE: number = 60
  
  // Counters
  private lagSpikes: number = 0
  private droppedFrames: number = 0
  private lastFrameTime: number = 0
  
  // Physics/render timing
  private physicsTime: number = 0
  private renderTime: number = 0
  
  // Callbacks
  private onPerformanceIssue?: (issue: string) => void

  constructor(
    thresholds: Partial<PerformanceThresholds> = {},
    onPerformanceIssue?: (issue: string) => void
  ) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
    this.onPerformanceIssue = onPerformanceIssue
  }

  /**
   * Record a frame
   */
  recordFrame(frameTime: number, physicsTime: number, renderTime: number): void {
    this.frameTimes.push(frameTime)
    if (this.frameTimes.length > this.SAMPLE_SIZE) {
      this.frameTimes.shift()
    }
    
    this.physicsTime = physicsTime
    this.renderTime = renderTime
    
    // Detect issues
    if (frameTime > this.thresholds.maxFrameTime) {
      this.lagSpikes++
      this.onPerformanceIssue?.(`Lag spike: ${frameTime.toFixed(1)}ms`)
    }
    
    if (physicsTime > this.thresholds.maxPhysicsTime) {
      this.onPerformanceIssue?.(`Physics slow: ${physicsTime.toFixed(1)}ms`)
    }
    
    // Detect dropped frames (frame time > 2x expected)
    if (this.lastFrameTime > 0 && frameTime > this.lastFrameTime * 2) {
      this.droppedFrames++
    }
    
    this.lastFrameTime = frameTime
  }

  // Cached metrics to avoid recalculating every call
  private cachedMetrics: PerformanceMetrics | null = null
  private lastMetricsUpdate: number = 0
  private readonly METRICS_CACHE_MS: number = 100 // Update metrics every 100ms max

  /**
   * Get current metrics (cached for performance)
   */
  getMetrics(): PerformanceMetrics {
    const now = performance.now()
    
    // Return cached metrics if recent enough
    if (this.cachedMetrics && now - this.lastMetricsUpdate < this.METRICS_CACHE_MS) {
      return this.cachedMetrics
    }
    
    // Calculate new metrics
    let avgFrameTime = 0
    let minFrameTime = Infinity
    let maxFrameTime = 0
    
    if (this.frameTimes.length > 0) {
      let sum = 0
      for (let i = 0; i < this.frameTimes.length; i++) {
        const t = this.frameTimes[i]
        sum += t
        if (t < minFrameTime) minFrameTime = t
        if (t > maxFrameTime) maxFrameTime = t
      }
      avgFrameTime = sum / this.frameTimes.length
    } else {
      minFrameTime = 0
    }

    // Try to get memory usage (Chrome only)
    let memoryUsage: number | null = null
    if ('memory' in performance) {
      const memory = (
        performance as unknown as { memory: { usedJSHeapSize: number } }
      ).memory
      memoryUsage = memory.usedJSHeapSize / (1024 * 1024) // MB
    }

    this.cachedMetrics = {
      fps: avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0,
      avgFrameTime,
      minFrameTime,
      maxFrameTime,
      physicsTime: this.physicsTime,
      renderTime: this.renderTime,
      memoryUsage,
      lagSpikes: this.lagSpikes,
      droppedFrames: this.droppedFrames,
    }
    this.lastMetricsUpdate = now

    return this.cachedMetrics
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceOk(): boolean {
    const metrics = this.getMetrics()
    return metrics.fps >= this.thresholds.minFps
  }

  /**
   * Get performance grade (A-F)
   */
  getGrade(): string {
    const metrics = this.getMetrics()
    
    if (metrics.fps >= 55) return 'A'
    if (metrics.fps >= 45) return 'B'
    if (metrics.fps >= 35) return 'C'
    if (metrics.fps >= 25) return 'D'
    return 'F'
  }

  /**
   * Reset counters
   */
  reset(): void {
    this.frameTimes = []
    this.lagSpikes = 0
    this.droppedFrames = 0
    this.lastFrameTime = 0
    this.cachedMetrics = null
    this.lastMetricsUpdate = 0
  }

  /**
   * Get summary string for debugging
   */
  getSummary(): string {
    const m = this.getMetrics()
    return `FPS: ${m.fps} | Frame: ${m.avgFrameTime.toFixed(1)}ms | Physics: ${m.physicsTime.toFixed(1)}ms | Lag: ${m.lagSpikes}`
  }
}
