/**
 * RenderLayer - Individual render layer implementation
 * 
 * @module rendering/RenderLayer
 */

import type { RenderLayerType } from '../arena/types'

// ============================================================================
// Types
// ============================================================================

type RenderCallback = (ctx: CanvasRenderingContext2D) => void

interface RenderEntry {
  id: string
  subLayer: number
  render: RenderCallback
}

// ============================================================================
// RenderLayer Class
// ============================================================================

/**
 * RenderLayer manages renderables within a single layer
 * Requirements: 7.2, 7.3, 7.4
 */
export class RenderLayer {
  private layer: RenderLayerType
  private entries: Map<string, RenderEntry> = new Map()
  private sortedEntries: RenderEntry[] = []
  private needsSort: boolean = false
  private visible: boolean = true
  private nextId: number = 0

  /**
   * Create a new render layer
   * 
   * @param layer - Layer enum value
   */
  constructor(layer: RenderLayerType) {
    this.layer = layer
  }

  /**
   * Get layer enum value
   */
  getLayer(): RenderLayerType {
    return this.layer
  }

  /**
   * Register a renderable
   * Requirements: 7.8
   * 
   * @param subLayer - Sub-layer for Y-sorting (0-99)
   * @param renderFn - Render callback function
   * @returns Unique ID for this registration
   */
  register(subLayer: number, renderFn: RenderCallback): string {
    const id = `${this.layer}_${this.nextId++}`
    
    const entry: RenderEntry = {
      id,
      subLayer: Math.max(0, Math.min(99, subLayer)),
      render: renderFn
    }
    
    this.entries.set(id, entry)
    this.needsSort = true
    
    return id
  }

  /**
   * Unregister a renderable
   * 
   * @param id - ID returned from register
   */
  unregister(id: string): void {
    if (this.entries.delete(id)) {
      this.needsSort = true
    }
  }

  /**
   * Update sub-layer for a renderable (for Y-sorting)
   * Requirements: 7.4
   * 
   * @param id - Renderable ID
   * @param subLayer - New sub-layer value
   */
  updateSubLayer(id: string, subLayer: number): void {
    const entry = this.entries.get(id)
    if (entry) {
      entry.subLayer = Math.max(0, Math.min(99, subLayer))
      this.needsSort = true
    }
  }

  /**
   * Set layer visibility
   * Requirements: 7.10
   * 
   * @param visible - Whether layer is visible
   */
  setVisible(visible: boolean): void {
    this.visible = visible
  }

  /**
   * Check if layer is visible
   * 
   * @returns true if visible
   */
  isVisible(): boolean {
    return this.visible
  }

  /**
   * Render all entries in sorted order
   * Requirements: 7.3
   * 
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return

    // Sort if needed
    if (this.needsSort) {
      this.sortEntries()
    }

    // Render in sorted order
    for (const entry of this.sortedEntries) {
      entry.render(ctx)
    }
  }

  /**
   * Sort entries by sub-layer
   */
  private sortEntries(): void {
    this.sortedEntries = Array.from(this.entries.values())
    this.sortedEntries.sort((a, b) => a.subLayer - b.subLayer)
    this.needsSort = false
  }

  /**
   * Get number of registered renderables
   * 
   * @returns Entry count
   */
  size(): number {
    return this.entries.size
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear()
    this.sortedEntries = []
    this.needsSort = false
  }
}
