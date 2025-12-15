/**
 * LoadingOrchestrator - Enterprise-grade parallel asset loading and initialization
 * 
 * Features:
 * - Parallel loading of independent assets
 * - Prioritized loading (critical assets first)
 * - Readiness tracking for all subsystems
 * - Smart countdown that waits for everything to be ready
 * - Detailed progress reporting
 */

export type LoadingStage = 
  | 'idle'
  | 'initializing'
  | 'loading-critical'    // Track, obstacles, character (parallel)
  | 'loading-secondary'   // Celestials, city (parallel, non-blocking)
  | 'initializing-systems' // Physics, audio, etc.
  | 'warming-up'          // First frame render, shader compilation
  | 'ready'
  | 'countdown'
  | 'running'
  | 'error'

export interface SubsystemStatus {
  name: string
  ready: boolean
  error?: string
  loadTimeMs?: number
}

export interface LoadingProgress {
  stage: LoadingStage
  overallProgress: number  // 0-100
  currentTask: string
  subsystems: SubsystemStatus[]
  criticalReady: boolean
  secondaryReady: boolean
  totalLoadTimeMs: number
  error?: string
}

export interface LoadingOrchestratorCallbacks {
  onProgress?: (progress: LoadingProgress) => void
  onStageChange?: (stage: LoadingStage) => void
  onReady?: () => void
  onError?: (error: Error) => void
}

// Subsystem names for tracking
const CRITICAL_SUBSYSTEMS = [
  'renderer',
  'track',
  'obstacles', 
  'character',
  'physics',
  'audio',
] as const

const SECONDARY_SUBSYSTEMS = [
  'celestials',
  'city',
  'particles',
] as const

type CriticalSubsystem = typeof CRITICAL_SUBSYSTEMS[number]
type SecondarySubsystem = typeof SECONDARY_SUBSYSTEMS[number]
type Subsystem = CriticalSubsystem | SecondarySubsystem

export class LoadingOrchestrator {
  private stage: LoadingStage = 'idle'
  private callbacks: LoadingOrchestratorCallbacks = {}
  private subsystemStatus: Map<Subsystem, SubsystemStatus> = new Map()
  private startTime: number = 0
  private currentTask: string = ''
  private error?: string
  
  // Readiness flags
  private criticalReady: boolean = false
  private secondaryReady: boolean = false
  private warmupComplete: boolean = false
  
  // Abort controller for cancellation
  private abortController: AbortController | null = null

  constructor(callbacks?: LoadingOrchestratorCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks
    }
    this.initializeSubsystems()
  }

  /**
   * Initialize subsystem tracking
   */
  private initializeSubsystems(): void {
    for (const name of CRITICAL_SUBSYSTEMS) {
      this.subsystemStatus.set(name, { name, ready: false })
    }
    for (const name of SECONDARY_SUBSYSTEMS) {
      this.subsystemStatus.set(name, { name, ready: false })
    }
  }

  /**
   * Mark a subsystem as ready
   */
  markReady(subsystem: Subsystem, loadTimeMs?: number): void {
    const status = this.subsystemStatus.get(subsystem)
    if (status) {
      status.ready = true
      status.loadTimeMs = loadTimeMs
      this.checkReadiness()
      this.emitProgress()
    }
  }

  /**
   * Mark a subsystem as failed
   */
  markFailed(subsystem: Subsystem, error: string): void {
    const status = this.subsystemStatus.get(subsystem)
    if (status) {
      status.ready = false
      status.error = error
      
      // Critical failures stop loading
      if (CRITICAL_SUBSYSTEMS.includes(subsystem as CriticalSubsystem)) {
        this.setStage('error')
        this.error = `Critical subsystem failed: ${subsystem} - ${error}`
        this.callbacks.onError?.(new Error(this.error))
      }
      
      this.emitProgress()
    }
  }

  /**
   * Check if all critical/secondary subsystems are ready
   */
  private checkReadiness(): void {
    this.criticalReady = CRITICAL_SUBSYSTEMS.every(
      name => this.subsystemStatus.get(name)?.ready
    )
    
    this.secondaryReady = SECONDARY_SUBSYSTEMS.every(
      name => this.subsystemStatus.get(name)?.ready
    )
    
    // If all critical systems ready and we're still loading, advance
    if (this.criticalReady && this.stage === 'loading-critical') {
      this.setStage('loading-secondary')
    }
  }

  /**
   * Set current loading stage
   */
  private setStage(stage: LoadingStage): void {
    this.stage = stage
    this.callbacks.onStageChange?.(stage)
    this.emitProgress()
  }

  /**
   * Set current task description
   */
  setTask(task: string): void {
    this.currentTask = task
    this.emitProgress()
  }

  /**
   * Calculate overall progress percentage
   */
  private calculateProgress(): number {
    const stageWeights: Record<LoadingStage, { base: number; weight: number }> = {
      'idle': { base: 0, weight: 0 },
      'initializing': { base: 0, weight: 5 },
      'loading-critical': { base: 5, weight: 50 },
      'loading-secondary': { base: 55, weight: 20 },
      'initializing-systems': { base: 75, weight: 15 },
      'warming-up': { base: 90, weight: 8 },
      'ready': { base: 98, weight: 2 },
      'countdown': { base: 100, weight: 0 },
      'running': { base: 100, weight: 0 },
      'error': { base: 0, weight: 0 },
    }

    const { base, weight } = stageWeights[this.stage]
    
    // Calculate progress within current stage
    let stageProgress = 0
    if (this.stage === 'loading-critical') {
      const readyCount = CRITICAL_SUBSYSTEMS.filter(
        name => this.subsystemStatus.get(name)?.ready
      ).length
      stageProgress = readyCount / CRITICAL_SUBSYSTEMS.length
    } else if (this.stage === 'loading-secondary') {
      const readyCount = SECONDARY_SUBSYSTEMS.filter(
        name => this.subsystemStatus.get(name)?.ready
      ).length
      stageProgress = readyCount / SECONDARY_SUBSYSTEMS.length
    } else if (this.stage === 'ready' || this.stage === 'countdown' || this.stage === 'running') {
      stageProgress = 1
    }

    return Math.min(100, base + weight * stageProgress)
  }

  /**
   * Emit progress update
   */
  private emitProgress(): void {
    const progress: LoadingProgress = {
      stage: this.stage,
      overallProgress: this.calculateProgress(),
      currentTask: this.currentTask,
      subsystems: Array.from(this.subsystemStatus.values()),
      criticalReady: this.criticalReady,
      secondaryReady: this.secondaryReady,
      totalLoadTimeMs: performance.now() - this.startTime,
      error: this.error,
    }
    
    this.callbacks.onProgress?.(progress)
  }

  /**
   * Get current progress
   */
  getProgress(): LoadingProgress {
    return {
      stage: this.stage,
      overallProgress: this.calculateProgress(),
      currentTask: this.currentTask,
      subsystems: Array.from(this.subsystemStatus.values()),
      criticalReady: this.criticalReady,
      secondaryReady: this.secondaryReady,
      totalLoadTimeMs: performance.now() - this.startTime,
      error: this.error,
    }
  }

  /**
   * Start the loading process
   */
  start(): void {
    this.startTime = performance.now()
    this.abortController = new AbortController()
    this.setStage('initializing')
    this.setTask('Preparing game engine...')
  }

  /**
   * Transition to critical loading phase
   */
  startCriticalLoading(): void {
    this.setStage('loading-critical')
    this.setTask('Loading core assets...')
  }

  /**
   * Transition to secondary loading phase
   */
  startSecondaryLoading(): void {
    this.setStage('loading-secondary')
    this.setTask('Loading environment...')
  }

  /**
   * Transition to system initialization phase
   */
  startSystemInit(): void {
    this.setStage('initializing-systems')
    this.setTask('Initializing game systems...')
  }

  /**
   * Start warmup phase (first render, shader compilation)
   */
  startWarmup(): void {
    this.setStage('warming-up')
    this.setTask('Warming up renderer...')
  }

  /**
   * Mark warmup complete
   */
  completeWarmup(): void {
    this.warmupComplete = true
    this.setStage('ready')
    this.setTask('Ready to play!')
    this.callbacks.onReady?.()
  }

  /**
   * Check if ready to start countdown
   */
  isReadyForCountdown(): boolean {
    return this.criticalReady && this.warmupComplete
  }

  /**
   * Check if all systems (including secondary) are ready
   */
  isFullyReady(): boolean {
    return this.criticalReady && this.secondaryReady && this.warmupComplete
  }

  /**
   * Start countdown phase
   */
  startCountdown(): void {
    if (!this.isReadyForCountdown()) {
      console.warn('[LoadingOrchestrator] Cannot start countdown - not ready')
      return
    }
    this.setStage('countdown')
    this.setTask('Starting...')
  }

  /**
   * Transition to running state
   */
  startRunning(): void {
    this.setStage('running')
    this.setTask('')
  }

  /**
   * Get current stage
   */
  getStage(): LoadingStage {
    return this.stage
  }

  /**
   * Check if in error state
   */
  hasError(): boolean {
    return this.stage === 'error'
  }

  /**
   * Abort loading
   */
  abort(): void {
    this.abortController?.abort()
    this.setStage('idle')
  }

  /**
   * Reset for retry
   */
  reset(): void {
    this.stage = 'idle'
    this.error = undefined
    this.criticalReady = false
    this.secondaryReady = false
    this.warmupComplete = false
    this.currentTask = ''
    this.initializeSubsystems()
  }

  /**
   * Get loading statistics
   */
  getStats(): { totalTimeMs: number; subsystemTimes: Record<string, number> } {
    const subsystemTimes: Record<string, number> = {}
    for (const [name, status] of this.subsystemStatus) {
      if (status.loadTimeMs !== undefined) {
        subsystemTimes[name] = status.loadTimeMs
      }
    }
    return {
      totalTimeMs: performance.now() - this.startTime,
      subsystemTimes,
    }
  }
}

// Singleton instance
let orchestratorInstance: LoadingOrchestrator | null = null

export function getLoadingOrchestrator(): LoadingOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new LoadingOrchestrator()
  }
  return orchestratorInstance
}

export function resetLoadingOrchestrator(): void {
  orchestratorInstance?.reset()
  orchestratorInstance = null
}
