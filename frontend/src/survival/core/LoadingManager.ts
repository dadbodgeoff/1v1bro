/**
 * LoadingManager - Coordinates asset loading with UI feedback
 * Provides loading states, progress, and error handling
 */

import { SURVIVAL_ASSETS } from '../config/constants'
import { ResourceManager, type LoadingProgress } from './ResourceManager'

export type LoadingPhase = 
  | 'idle'
  | 'initializing'
  | 'loading-core'
  | 'loading-obstacles'
  | 'loading-character'
  | 'finalizing'
  | 'ready'
  | 'error'

export interface LoadingState {
  phase: LoadingPhase
  progress: number  // 0-100
  currentAsset: string
  error: string | null
  startTime: number
  elapsedTime: number
}

export interface LoadingCallbacks {
  onPhaseChange?: (phase: LoadingPhase) => void
  onProgress?: (progress: LoadingProgress) => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

export class LoadingManager {
  private resourceManager: ResourceManager
  private state: LoadingState
  private callbacks: LoadingCallbacks
  private abortController: AbortController | null = null

  constructor(callbacks: LoadingCallbacks = {}) {
    this.resourceManager = ResourceManager.getInstance()
    this.callbacks = callbacks
    this.state = this.createInitialState()
  }

  /**
   * Create initial loading state
   */
  private createInitialState(): LoadingState {
    return {
      phase: 'idle',
      progress: 0,
      currentAsset: '',
      error: null,
      startTime: 0,
      elapsedTime: 0,
    }
  }

  /**
   * Start loading all game assets
   */
  async loadAll(): Promise<boolean> {
    this.state = this.createInitialState()
    this.state.phase = 'initializing'
    this.state.startTime = performance.now()
    this.abortController = new AbortController()

    try {
      // Phase 1: Core assets (track)
      await this.loadPhase('loading-core', [
        SURVIVAL_ASSETS.track.longTile,
      ])

      // Phase 2: Obstacles (highBarrier is now procedural - not loaded)
      await this.loadPhase('loading-obstacles', [
        SURVIVAL_ASSETS.obstacles.lowBarrier,
        SURVIVAL_ASSETS.obstacles.laneBarrier,
        SURVIVAL_ASSETS.obstacles.knowledgeGate,
      ])

      // Phase 3: Character (animated runner with run/jump/down poses)
      await this.loadPhase('loading-character', [
        SURVIVAL_ASSETS.character.runner.run,
        SURVIVAL_ASSETS.character.runner.jump,
        SURVIVAL_ASSETS.character.runner.down,
      ])

      // Finalize
      this.setPhase('finalizing')
      await this.delay(100) // Brief pause for UI

      this.setPhase('ready')
      this.state.progress = 100
      this.state.elapsedTime = performance.now() - this.state.startTime

      this.callbacks.onComplete?.()
      
      return true
    } catch (error) {
      this.state.phase = 'error'
      this.state.error = error instanceof Error ? error.message : 'Unknown error'
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  /**
   * Load a phase of assets
   */
  private async loadPhase(phase: LoadingPhase, urls: string[]): Promise<void> {
    this.setPhase(phase)

    await this.resourceManager.preloadAssets(urls, (progress) => {
      this.state.currentAsset = progress.currentAsset
      this.state.progress = this.calculateOverallProgress(phase, progress.percentage)
      this.callbacks.onProgress?.(progress)
    })
  }

  /**
   * Calculate overall progress based on phase
   */
  private calculateOverallProgress(phase: LoadingPhase, phaseProgress: number): number {
    const phaseWeights: Record<LoadingPhase, { start: number; weight: number }> = {
      'idle': { start: 0, weight: 0 },
      'initializing': { start: 0, weight: 5 },
      'loading-core': { start: 5, weight: 30 },
      'loading-obstacles': { start: 35, weight: 40 },
      'loading-character': { start: 75, weight: 20 },
      'finalizing': { start: 95, weight: 5 },
      'ready': { start: 100, weight: 0 },
      'error': { start: 0, weight: 0 },
    }

    const { start, weight } = phaseWeights[phase]
    return start + (phaseProgress / 100) * weight
  }

  /**
   * Set current phase
   */
  private setPhase(phase: LoadingPhase): void {
    this.state.phase = phase
    this.callbacks.onPhaseChange?.(phase)
  }

  /**
   * Get current loading state
   */
  getState(): LoadingState {
    return { ...this.state }
  }

  /**
   * Check if loading is complete
   */
  isReady(): boolean {
    return this.state.phase === 'ready'
  }

  /**
   * Check if loading failed
   */
  hasError(): boolean {
    return this.state.phase === 'error'
  }

  /**
   * Abort loading
   */
  abort(): void {
    this.abortController?.abort()
    this.state.phase = 'idle'
  }

  /**
   * Retry loading after error
   */
  async retry(): Promise<boolean> {
    if (this.state.phase !== 'error') return false
    return this.loadAll()
  }

  /**
   * Get human-readable phase description
   */
  getPhaseDescription(): string {
    switch (this.state.phase) {
      case 'idle': return 'Waiting to start...'
      case 'initializing': return 'Initializing...'
      case 'loading-core': return 'Loading track...'
      case 'loading-obstacles': return 'Loading obstacles...'
      case 'loading-character': return 'Loading character...'
      case 'finalizing': return 'Finalizing...'
      case 'ready': return 'Ready!'
      case 'error': return `Error: ${this.state.error}`
    }
  }

  /**
   * Utility delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
