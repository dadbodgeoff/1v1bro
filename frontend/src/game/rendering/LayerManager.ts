/**
 * LayerManager - Orchestrates all render layers
 * 
 * @module rendering/LayerManager
 */

import { RenderLayer as RenderLayerEnum, type RenderLayerType } from '../arena/types'
import { RenderLayer } from './RenderLayer'

// ============================================================================
// Types
// ============================================================================

type RenderCallback = (ctx: CanvasRenderingContext2D) => void

// ============================================================================
// LayerManager Class
// ============================================================================

/**
 * LayerManager orchestrates all render layers
 * Requirements: 7.1, 7.2, 7.3, 7.10
 */
export class LayerManager {
  private layers: Map<RenderLayerType, RenderLayer> = new Map()
  private layerOrder: RenderLayerType[] = []

  /**
   * Create a new layer manager with all 7 layers
   */
  constructor() {
    // Initialize layers in order (0-6)
    this.layerOrder = [
      RenderLayerEnum.BACKGROUND,
      RenderLayerEnum.FLOOR,
      RenderLayerEnum.HAZARDS,
      RenderLayerEnum.BARRIERS,
      RenderLayerEnum.ENTITIES,
      RenderLayerEnum.EFFECTS,
      RenderLayerEnum.UI
    ]

    for (const layer of this.layerOrder) {
      this.layers.set(layer, new RenderLayer(layer))
    }
  }

  /**
   * Register a renderable on a specific layer
   * Requirements: 7.8
   * 
   * @param layer - Layer to register on
   * @param subLayer - Sub-layer for Y-sorting (0-99)
   * @param renderFn - Render callback function
   * @returns Unique ID for this registration
   */
  register(layer: RenderLayerType, subLayer: number, renderFn: RenderCallback): string {
    const renderLayer = this.layers.get(layer)
    if (!renderLayer) {
      throw new Error(`Invalid layer: ${layer}`)
    }
    return renderLayer.register(subLayer, renderFn)
  }

  /**
   * Unregister a renderable
   * 
   * @param layer - Layer the renderable is on
   * @param id - ID returned from register
   */
  unregister(layer: RenderLayerType, id: string): void {
    const renderLayer = this.layers.get(layer)
    if (renderLayer) {
      renderLayer.unregister(id)
    }
  }

  /**
   * Update sub-layer for a renderable
   * Requirements: 7.4
   * 
   * @param layer - Layer the renderable is on
   * @param id - Renderable ID
   * @param subLayer - New sub-layer value
   */
  updateSubLayer(layer: RenderLayerType, id: string, subLayer: number): void {
    const renderLayer = this.layers.get(layer)
    if (renderLayer) {
      renderLayer.updateSubLayer(id, subLayer)
    }
  }

  /**
   * Set layer visibility
   * Requirements: 7.10
   * 
   * @param layer - Layer to set visibility for
   * @param visible - Whether layer is visible
   */
  setLayerVisible(layer: RenderLayerType, visible: boolean): void {
    const renderLayer = this.layers.get(layer)
    if (renderLayer) {
      renderLayer.setVisible(visible)
    }
  }

  /**
   * Check if a layer is visible
   * 
   * @param layer - Layer to check
   * @returns true if visible
   */
  isLayerVisible(layer: RenderLayerType): boolean {
    const renderLayer = this.layers.get(layer)
    return renderLayer?.isVisible() ?? false
  }

  /**
   * Render all layers in order (0-6)
   * Requirements: 7.1, 7.2
   * 
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.layerOrder) {
      const renderLayer = this.layers.get(layer)
      if (renderLayer) {
        renderLayer.render(ctx)
      }
    }
  }

  /**
   * Get a specific layer
   * 
   * @param layer - Layer to get
   * @returns RenderLayer or undefined
   */
  getLayer(layer: RenderLayerType): RenderLayer | undefined {
    return this.layers.get(layer)
  }

  /**
   * Get total number of registered renderables across all layers
   * 
   * @returns Total count
   */
  totalRenderables(): number {
    let total = 0
    for (const layer of this.layers.values()) {
      total += layer.size()
    }
    return total
  }

  /**
   * Clear all layers
   */
  clearAll(): void {
    for (const layer of this.layers.values()) {
      layer.clear()
    }
  }

  /**
   * Clear a specific layer
   * 
   * @param layer - Layer to clear
   */
  clearLayer(layer: RenderLayerType): void {
    const renderLayer = this.layers.get(layer)
    if (renderLayer) {
      renderLayer.clear()
    }
  }
}
