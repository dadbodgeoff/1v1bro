/**
 * GhostManager - Handles ghost replay functionality
 * Extracted from SurvivalEngine for modularity
 * 
 * Responsibilities:
 * - Loading ghost data from server
 * - Managing ghost replay state
 * - Coordinating ghost renderer updates
 * - Respecting theme-based enable/disable
 */

import * as THREE from 'three'
import type { GhostReplay } from '../systems/GhostReplay'
import type { GhostRenderer } from '../renderer/GhostRenderer'
import { survivalApi } from '../services/SurvivalApiService'
import { isGhostEnabled } from '../config/themes'

export interface GhostManagerDeps {
  ghostReplay: GhostReplay
  ghostRenderer: GhostRenderer
}

export class GhostManager {
  private deps: GhostManagerDeps
  private enabled: boolean = true

  constructor(deps: GhostManagerDeps) {
    this.deps = deps
    // Check theme setting
    this.enabled = isGhostEnabled()
    if (!this.enabled) {
      console.log('[GhostManager] Ghost replay disabled by theme')
    }
  }

  /**
   * Load ghost data from serialized string
   */
  loadGhost(data: string): void {
    if (!this.enabled) return
    this.deps.ghostReplay.load(data)
  }

  /**
   * Start ghost replay if data is loaded
   */
  startGhost(): void {
    if (!this.enabled) return
    if (this.deps.ghostReplay.getDuration() > 0) {
      this.deps.ghostReplay.start()
    }
  }

  /**
   * Update ghost state for current game time
   */
  getGhostState(gameTimeMs: number) {
    if (!this.enabled) return null
    return this.deps.ghostReplay.update(gameTimeMs)
  }

  /**
   * Check if ghost replay is active
   */
  isGhostActive(): boolean {
    if (!this.enabled) return false
    return this.deps.ghostReplay.isActive()
  }

  /**
   * Get ghost duration
   */
  getDuration(): number {
    return this.deps.ghostReplay.getDuration()
  }

  /**
   * Reset ghost state
   */
  reset(): void {
    this.deps.ghostReplay.reset()
    this.deps.ghostRenderer.reset()
  }

  /**
   * Reload personal best ghost from server
   */
  async reloadPersonalBestGhost(): Promise<void> {
    if (!this.enabled) return
    try {
      const pbData = await survivalApi.getPersonalBest()
      if (pbData?.ghost_data) {
        this.deps.ghostReplay.load(pbData.ghost_data)
      }
    } catch {
      // Ghost reload failed silently - not critical
    }
  }

  /**
   * Update ghost renderer visibility
   */
  updateRenderer(gameTimeMs: number, playerZ: number, isRunning: boolean): void {
    if (!this.enabled) {
      this.deps.ghostRenderer.hide()
      return
    }
    if (isRunning && this.deps.ghostReplay.isActive()) {
      const ghostState = this.deps.ghostReplay.update(gameTimeMs)
      this.deps.ghostRenderer.update(ghostState, playerZ)
    } else if (!isRunning) {
      this.deps.ghostRenderer.hide()
    }
  }

  /**
   * Initialize ghost renderer with character meshes
   */
  initializeRenderer(meshes: { run: THREE.Group; jump: THREE.Group; down: THREE.Group }): void {
    if (!this.enabled) return
    this.deps.ghostRenderer.initialize(meshes)
  }

  /**
   * Dispose ghost renderer resources
   */
  dispose(): void {
    this.deps.ghostRenderer.dispose()
  }
}
