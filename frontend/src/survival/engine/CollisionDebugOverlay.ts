/**
 * CollisionDebugOverlay - Real-time collision debugging visualization
 * 
 * Tracks and displays:
 * - Player feet position (Y coordinate)
 * - Player collision box bounds
 * - Obstacle spawn positions and collision boxes
 * - Jump height and clearance calculations
 * - Near-miss and collision events
 */

import { WorldConfig } from '../config/WorldConfig'

export interface CollisionDebugData {
  // Player state
  playerFeetY: number
  playerHeadY: number
  playerX: number
  playerZ: number
  playerLane: number
  isJumping: boolean
  isSliding: boolean
  jumpHeight: number  // Height above ground
  
  // World reference
  trackSurfaceHeight: number
  trackGeometryOffset: number
  effectiveGroundY: number  // trackSurfaceHeight + offset
  
  // Collision box
  playerBoxMinY: number
  playerBoxMaxY: number
  playerBoxMinX: number
  playerBoxMaxX: number
  
  // Jump analysis
  maxJumpHeight: number  // Theoretical max jump height
  canClearLowBarrier: boolean  // Can current jump clear a lowBarrier?
}

export interface ObstacleDebugData {
  id: string
  type: string
  lane: number
  z: number
  visualY: number
  // Collision box
  boxMinY: number
  boxMaxY: number
  boxMinX: number
  boxMaxX: number
  boxMinZ: number
  boxMaxZ: number
  // Clearance info
  distanceToPlayer: number
  playerClearance: number  // How much player feet are above obstacle top (negative = collision)
}

export interface CollisionEvent {
  timestamp: number
  type: 'collision' | 'near-miss' | 'cleared'
  obstacleType: string
  obstacleId: string
  playerFeetY: number
  obstacleTopY: number
  clearance: number
  playerX: number
  obstacleX: number
  jumpHeight: number
}

class CollisionDebugOverlay {
  private enabled: boolean = false
  private overlayElement: HTMLDivElement | null = null
  
  private playerData: CollisionDebugData | null = null
  private nearbyObstacles: ObstacleDebugData[] = []
  private recentEvents: CollisionEvent[] = []
  private maxEvents: number = 20
  
  // Track geometry offset (must match ObstacleManager)
  private readonly TRACK_GEOMETRY_OFFSET = 2.05

  /**
   * Enable debug overlay
   */
  enable(): void {
    if (this.enabled) return
    this.enabled = true
    this.createOverlay()
    console.log('[CollisionDebug] Overlay enabled')
  }

  /**
   * Disable debug overlay
   */
  disable(): void {
    if (!this.enabled) return
    this.enabled = false
    this.removeOverlay()
    console.log('[CollisionDebug] Overlay disabled')
  }

  /**
   * Toggle debug overlay
   */
  toggle(): void {
    if (this.enabled) {
      this.disable()
    } else {
      this.enable()
    }
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Update player debug data
   */
  updatePlayer(
    x: number,
    y: number,
    z: number,
    lane: number,
    isJumping: boolean,
    isSliding: boolean,
    playerBox: { minY: number; maxY: number; minX: number; maxX: number }
  ): void {
    if (!this.enabled) return

    const worldConfig = WorldConfig.getInstance()
    const trackSurfaceHeight = worldConfig.getTrackSurfaceHeight()
    const effectiveGroundY = trackSurfaceHeight + this.TRACK_GEOMETRY_OFFSET
    const jumpHeight = y - effectiveGroundY
    
    // lowBarrier maxY = baseY + 1.2 = effectiveGroundY + 1.2
    const lowBarrierTop = effectiveGroundY + 1.2
    // Player needs feet above lowBarrierTop to clear
    const canClearLowBarrier = y >= lowBarrierTop

    this.playerData = {
      playerFeetY: y,
      playerHeadY: playerBox.maxY,
      playerX: x,
      playerZ: z,
      playerLane: lane,
      isJumping,
      isSliding,
      jumpHeight,
      trackSurfaceHeight,
      trackGeometryOffset: this.TRACK_GEOMETRY_OFFSET,
      effectiveGroundY,
      playerBoxMinY: playerBox.minY,
      playerBoxMaxY: playerBox.maxY,
      playerBoxMinX: playerBox.minX,
      playerBoxMaxX: playerBox.maxX,
      maxJumpHeight: 0, // Will be updated when we see max jump
      canClearLowBarrier,
    }
    
    // Track max jump height
    if (isJumping && jumpHeight > (this.playerData.maxJumpHeight || 0)) {
      this.playerData.maxJumpHeight = jumpHeight
    }
  }

  /**
   * Update nearby obstacles
   */
  updateObstacles(obstacles: Array<{
    id: string
    type: string
    lane: number
    z: number
    getCollisionBox: () => { minY: number; maxY: number; minX: number; maxX: number; minZ: number; maxZ: number }
  }>, playerZ: number, playerFeetY: number): void {
    if (!this.enabled) return

    this.nearbyObstacles = obstacles
      .filter(o => Math.abs(o.z - playerZ) < 30)
      .map(o => {
        const box = o.getCollisionBox()
        return {
          id: o.id,
          type: o.type,
          lane: o.lane,
          z: o.z,
          visualY: box.minY,
          boxMinY: box.minY,
          boxMaxY: box.maxY,
          boxMinX: box.minX,
          boxMaxX: box.maxX,
          boxMinZ: box.minZ,
          boxMaxZ: box.maxZ,
          distanceToPlayer: o.z - playerZ,
          playerClearance: playerFeetY - box.maxY,
        }
      })
      .sort((a, b) => Math.abs(a.distanceToPlayer) - Math.abs(b.distanceToPlayer))
      .slice(0, 5)
  }

  /**
   * Record a collision event
   */
  recordCollision(
    obstacleType: string,
    obstacleId: string,
    playerFeetY: number,
    obstacleTopY: number,
    playerX: number,
    obstacleX: number,
    jumpHeight: number
  ): void {
    const event: CollisionEvent = {
      timestamp: Date.now(),
      type: 'collision',
      obstacleType,
      obstacleId,
      playerFeetY,
      obstacleTopY,
      clearance: playerFeetY - obstacleTopY,
      playerX,
      obstacleX,
      jumpHeight,
    }
    
    this.recentEvents.unshift(event)
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents.pop()
    }

    // Always log collisions to console
    console.log(`[CollisionDebug] COLLISION with ${obstacleType}:`, {
      playerFeetY: playerFeetY.toFixed(2),
      obstacleTopY: obstacleTopY.toFixed(2),
      clearance: (playerFeetY - obstacleTopY).toFixed(2),
      jumpHeight: jumpHeight.toFixed(2),
      playerX: playerX.toFixed(2),
      obstacleX: obstacleX.toFixed(2),
    })
  }

  /**
   * Record a near-miss event
   */
  recordNearMiss(
    obstacleType: string,
    obstacleId: string,
    playerFeetY: number,
    obstacleTopY: number,
    playerX: number,
    obstacleX: number,
    jumpHeight: number
  ): void {
    const event: CollisionEvent = {
      timestamp: Date.now(),
      type: 'near-miss',
      obstacleType,
      obstacleId,
      playerFeetY,
      obstacleTopY,
      clearance: playerFeetY - obstacleTopY,
      playerX,
      obstacleX,
      jumpHeight,
    }
    
    this.recentEvents.unshift(event)
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents.pop()
    }

    console.log(`[CollisionDebug] NEAR-MISS with ${obstacleType}:`, {
      playerFeetY: playerFeetY.toFixed(2),
      obstacleTopY: obstacleTopY.toFixed(2),
      clearance: (playerFeetY - obstacleTopY).toFixed(2),
      jumpHeight: jumpHeight.toFixed(2),
    })
  }

  /**
   * Record a successful clear
   */
  recordCleared(
    obstacleType: string,
    obstacleId: string,
    playerFeetY: number,
    obstacleTopY: number,
    jumpHeight: number
  ): void {
    const event: CollisionEvent = {
      timestamp: Date.now(),
      type: 'cleared',
      obstacleType,
      obstacleId,
      playerFeetY,
      obstacleTopY,
      clearance: playerFeetY - obstacleTopY,
      playerX: 0,
      obstacleX: 0,
      jumpHeight,
    }
    
    this.recentEvents.unshift(event)
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents.pop()
    }
  }

  /**
   * Render the overlay
   */
  render(): void {
    if (!this.enabled || !this.overlayElement || !this.playerData) return

    const p = this.playerData
    const lowBarrierTop = p.effectiveGroundY + 1.2
    
    let html = `
      <div style="margin-bottom: 10px; border-bottom: 1px solid #666; padding-bottom: 5px;">
        <strong>PLAYER</strong><br>
        Feet Y: <span style="color: #0f0">${p.playerFeetY.toFixed(2)}</span> | 
        Head Y: <span style="color: #0f0">${p.playerHeadY.toFixed(2)}</span><br>
        X: ${p.playerX.toFixed(2)} | Z: ${p.playerZ.toFixed(2)} | Lane: ${p.playerLane}<br>
        Jump Height: <span style="color: ${p.jumpHeight > 0 ? '#ff0' : '#fff'}">${p.jumpHeight.toFixed(2)}</span>
        ${p.maxJumpHeight > 0 ? `(max: ${p.maxJumpHeight.toFixed(2)})` : ''}<br>
        State: ${p.isJumping ? '🦘 JUMPING' : p.isSliding ? '🏃 SLIDING' : '🚶 RUNNING'}
      </div>
      
      <div style="margin-bottom: 10px; border-bottom: 1px solid #666; padding-bottom: 5px;">
        <strong>WORLD</strong><br>
        Track Surface: ${p.trackSurfaceHeight.toFixed(2)}<br>
        Geometry Offset: ${p.trackGeometryOffset.toFixed(2)}<br>
        Effective Ground: <span style="color: #0ff">${p.effectiveGroundY.toFixed(2)}</span><br>
        LowBarrier Top: <span style="color: #f80">${lowBarrierTop.toFixed(2)}</span>
      </div>
      
      <div style="margin-bottom: 10px; border-bottom: 1px solid #666; padding-bottom: 5px;">
        <strong>JUMP ANALYSIS</strong><br>
        Need feet Y >= ${lowBarrierTop.toFixed(2)} to clear lowBarrier<br>
        Current: ${p.playerFeetY.toFixed(2)} - 
        <span style="color: ${p.canClearLowBarrier ? '#0f0' : '#f00'}">
          ${p.canClearLowBarrier ? '✓ CAN CLEAR' : '✗ WILL HIT'}
        </span>
      </div>
      
      <div style="margin-bottom: 10px; border-bottom: 1px solid #666; padding-bottom: 5px;">
        <strong>NEARBY OBSTACLES</strong><br>
    `

    for (const o of this.nearbyObstacles) {
      const clearanceColor = o.playerClearance > 0 ? '#0f0' : o.playerClearance > -0.5 ? '#ff0' : '#f00'
      html += `
        <div style="margin: 3px 0; padding: 2px; background: rgba(0,0,0,0.3);">
          <strong>${o.type}</strong> (${o.id})<br>
          Dist: ${o.distanceToPlayer.toFixed(1)} | Lane: ${o.lane}<br>
          Box Y: [${o.boxMinY.toFixed(2)} - ${o.boxMaxY.toFixed(2)}]<br>
          Clearance: <span style="color: ${clearanceColor}">${o.playerClearance.toFixed(2)}</span>
        </div>
      `
    }

    html += `</div>`

    // Recent events
    html += `<div><strong>RECENT EVENTS</strong><br>`
    for (const e of this.recentEvents.slice(0, 8)) {
      const age = ((Date.now() - e.timestamp) / 1000).toFixed(1)
      const color = e.type === 'collision' ? '#f00' : e.type === 'near-miss' ? '#ff0' : '#0f0'
      html += `
        <div style="color: ${color}; font-size: 10px;">
          [${age}s] ${e.type.toUpperCase()} ${e.obstacleType} | Clear: ${e.clearance.toFixed(2)} | Jump: ${e.jumpHeight.toFixed(2)}
        </div>
      `
    }
    html += `</div>`

    this.overlayElement.innerHTML = html
  }

  /**
   * Create the overlay DOM element
   */
  private createOverlay(): void {
    this.overlayElement = document.createElement('div')
    this.overlayElement.id = 'collision-debug-overlay'
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 280px;
      max-height: 90vh;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      font-family: monospace;
      font-size: 11px;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      pointer-events: none;
    `
    document.body.appendChild(this.overlayElement)
  }

  /**
   * Remove the overlay DOM element
   */
  private removeOverlay(): void {
    if (this.overlayElement) {
      this.overlayElement.remove()
      this.overlayElement = null
    }
  }

  /**
   * Clear all data
   */
  reset(): void {
    this.playerData = null
    this.nearbyObstacles = []
    this.recentEvents = []
  }
}

// Singleton instance
export const collisionDebugOverlay = new CollisionDebugOverlay()

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as unknown as { collisionDebug: CollisionDebugOverlay }).collisionDebug = collisionDebugOverlay
  
  // Add keyboard shortcut: Ctrl+Shift+D to toggle debug overlay
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault()
      collisionDebugOverlay.toggle()
      console.log(`[CollisionDebug] Overlay ${collisionDebugOverlay.isEnabled() ? 'ENABLED' : 'DISABLED'}`)
      console.log('[CollisionDebug] You can also use: window.collisionDebug.enable() / .disable() / .toggle()')
    }
  })
  
  console.log('[CollisionDebug] Press Ctrl+Shift+D to toggle collision debug overlay')
  console.log('[CollisionDebug] Or use: window.collisionDebug.enable()')
}
