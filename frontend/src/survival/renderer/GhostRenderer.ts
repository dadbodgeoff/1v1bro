/**
 * GhostRenderer - Renders a transparent ghost of the player's best run
 * 
 * Features:
 * - Transparent cyan-tinted character mesh
 * - Syncs position with GhostReplay system
 * - Fades out when ghost run ends
 * - Supports all animation states (run, jump, slide)
 */

import * as THREE from 'three'
import type { GhostState } from '../types/survival'
import { GhostReplay } from '../systems/GhostReplay'
import { getSurvivalConfig } from '../config/constants'

export class GhostRenderer {
  private scene: THREE.Scene
  private ghostMeshes: Map<string, THREE.Group> = new Map()
  private activeMesh: THREE.Group | null = null
  private currentState: 'run' | 'jump' | 'down' = 'run'
  private isInitialized: boolean = false
  
  // Ghost visual settings
  private readonly GHOST_COLOR = new THREE.Color(GhostReplay.GHOST_TINT)
  private readonly GHOST_EMISSIVE = new THREE.Color(0x004444)
  
  // Dynamic config
  private readonly laneWidth: number
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
    
    // Load dynamic config
    const config = getSurvivalConfig()
    this.laneWidth = config.laneWidth
  }
  
  /**
   * Initialize ghost meshes from player character assets
   * Clones the meshes and applies ghost material
   */
  initialize(characterMeshes: { run: THREE.Group; jump: THREE.Group; down: THREE.Group }): void {
    // Clone and setup each animation state mesh
    const states: Array<{ key: string; mesh: THREE.Group }> = [
      { key: 'run', mesh: characterMeshes.run },
      { key: 'jump', mesh: characterMeshes.jump },
      { key: 'down', mesh: characterMeshes.down },
    ]
    
    for (const { key, mesh } of states) {
      const ghostMesh = this.createGhostMesh(mesh)
      ghostMesh.visible = false
      this.scene.add(ghostMesh)
      this.ghostMeshes.set(key, ghostMesh)
    }
    
    this.isInitialized = true
    console.log('[GhostRenderer] Initialized with 3 animation states')
  }
  
  /**
   * Create a ghost version of a mesh with transparent material
   */
  private createGhostMesh(originalMesh: THREE.Group): THREE.Group {
    const ghostGroup = originalMesh.clone()
    
    // Apply ghost material to all mesh children
    ghostGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Create ghost material
        const ghostMaterial = new THREE.MeshStandardMaterial({
          color: this.GHOST_COLOR,
          emissive: this.GHOST_EMISSIVE,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: GhostReplay.GHOST_OPACITY,
          side: THREE.DoubleSide,
          depthWrite: false, // Prevents z-fighting with player
        })
        
        child.material = ghostMaterial
        child.renderOrder = -1 // Render behind player
      }
    })
    
    // Copy scale and rotation from original
    ghostGroup.scale.copy(originalMesh.scale)
    ghostGroup.rotation.copy(originalMesh.rotation)
    
    return ghostGroup
  }
  
  /**
   * Update ghost visual state based on GhostReplay state
   */
  update(ghostState: GhostState, _playerZ: number): void {
    if (!this.isInitialized || !ghostState.active) {
      this.hide()
      return
    }
    
    // Determine which animation state to show
    let targetState: 'run' | 'jump' | 'down' = 'run'
    if (ghostState.isJumping) {
      targetState = 'jump'
    } else if (ghostState.isSliding) {
      targetState = 'down'
    }
    
    // Switch mesh if state changed
    if (targetState !== this.currentState || !this.activeMesh) {
      this.switchState(targetState)
    }
    
    if (!this.activeMesh) return
    
    // Update position - use lane for X, recorded Y for height, recorded Z for position
    const ghostX = this.laneToX(ghostState.position.x)
    const ghostY = this.getGhostY(ghostState)
    const ghostZ = ghostState.position.z
    
    this.activeMesh.position.set(ghostX, ghostY, ghostZ)
    
    // Update opacity (handles fade out at end)
    this.updateOpacity(ghostState.opacity)
    
    // Make visible
    this.activeMesh.visible = true
  }
  
  /**
   * Convert lane position to X coordinate
   */
  private laneToX(lane: number): number {
    return lane * this.laneWidth
  }
  
  /**
   * Calculate ghost Y position based on state
   * Uses recorded Y position if available, otherwise estimates
   */
  private getGhostY(ghostState: GhostState): number {
    // Use recorded Y position if available (from position snapshots)
    if (ghostState.y !== undefined && ghostState.y > 0) {
      return ghostState.y
    }
    
    // Fallback to estimated positions
    if (ghostState.isJumping) {
      return 2.5
    }
    if (ghostState.isSliding) {
      return 0.5
    }
    return 1.0 // Running height
  }
  
  /**
   * Switch to a different animation state mesh
   */
  private switchState(newState: 'run' | 'jump' | 'down'): void {
    // Hide current mesh
    if (this.activeMesh) {
      this.activeMesh.visible = false
    }
    
    // Get new mesh
    const newMesh = this.ghostMeshes.get(newState)
    if (newMesh) {
      // Copy position from old mesh if exists
      if (this.activeMesh) {
        newMesh.position.copy(this.activeMesh.position)
      }
      this.activeMesh = newMesh
      this.currentState = newState
    }
  }
  
  /**
   * Update opacity on all materials in active mesh
   */
  private updateOpacity(opacity: number): void {
    if (!this.activeMesh) return
    
    this.activeMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.opacity = opacity
      }
    })
  }
  
  /**
   * Hide all ghost meshes
   */
  hide(): void {
    this.ghostMeshes.forEach((mesh) => {
      mesh.visible = false
    })
    this.activeMesh = null
  }
  
  /**
   * Check if ghost renderer is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }
  
  /**
   * Reset ghost renderer state
   */
  reset(): void {
    this.hide()
    this.currentState = 'run'
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    this.ghostMeshes.forEach((mesh) => {
      this.scene.remove(mesh)
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
    })
    this.ghostMeshes.clear()
    this.activeMesh = null
    this.isInitialized = false
  }
}
