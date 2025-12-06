/**
 * LayerEffects - Post-processing effects for render layers
 * 
 * @module rendering/LayerEffects
 */

import { RenderLayer } from '../arena/types'

// ============================================================================
// Types
// ============================================================================

export interface LayerEffectConfig {
  alpha?: number
  blendMode?: GlobalCompositeOperation
  filter?: string
}

// ============================================================================
// Layer Effect Configurations
// ============================================================================

/**
 * Default effect configurations per layer
 * Requirements: 7.5, 7.6
 */
export const LAYER_EFFECTS: Record<number, LayerEffectConfig> = {
  [RenderLayer.BACKGROUND]: {
    alpha: 1.0,
    blendMode: 'source-over'
  },
  [RenderLayer.FLOOR]: {
    alpha: 1.0,
    blendMode: 'source-over'
  },
  [RenderLayer.HAZARDS]: {
    alpha: 0.6,  // 60% opacity for hazard zones
    blendMode: 'screen'  // Screen blend mode
  },
  [RenderLayer.BARRIERS]: {
    alpha: 1.0,
    blendMode: 'source-over'
  },
  [RenderLayer.ENTITIES]: {
    alpha: 1.0,
    blendMode: 'source-over'
  },
  [RenderLayer.EFFECTS]: {
    alpha: 1.0,
    blendMode: 'lighter'  // Additive blending for effects
  },
  [RenderLayer.UI]: {
    alpha: 1.0,
    blendMode: 'source-over'
  }
}

// ============================================================================
// LayerEffects Class
// ============================================================================

/**
 * LayerEffects applies post-processing effects to render layers
 * Requirements: 7.5, 7.6
 */
export class LayerEffects {
  private customEffects: Map<number, LayerEffectConfig> = new Map()

  /**
   * Apply effects before rendering a layer
   * 
   * @param ctx - Canvas rendering context
   * @param layer - Layer being rendered
   */
  applyBefore(ctx: CanvasRenderingContext2D, layer: number): void {
    const config = this.getEffectConfig(layer)
    
    ctx.save()
    
    if (config.alpha !== undefined) {
      ctx.globalAlpha = config.alpha
    }
    
    if (config.blendMode) {
      ctx.globalCompositeOperation = config.blendMode
    }
    
    if (config.filter) {
      ctx.filter = config.filter
    }
  }

  /**
   * Restore context after rendering a layer
   * 
   * @param ctx - Canvas rendering context
   */
  applyAfter(ctx: CanvasRenderingContext2D): void {
    ctx.restore()
  }

  /**
   * Set custom effect for a layer
   * 
   * @param layer - Layer to set effect for
   * @param config - Effect configuration
   */
  setLayerEffect(layer: number, config: LayerEffectConfig): void {
    this.customEffects.set(layer, config)
  }

  /**
   * Clear custom effect for a layer
   * 
   * @param layer - Layer to clear effect for
   */
  clearLayerEffect(layer: number): void {
    this.customEffects.delete(layer)
  }

  /**
   * Get effect configuration for a layer
   * 
   * @param layer - Layer to get config for
   * @returns Effect configuration
   */
  getEffectConfig(layer: number): LayerEffectConfig {
    return this.customEffects.get(layer) || LAYER_EFFECTS[layer] || {}
  }

  /**
   * Apply hazard transparency effect
   * Requirements: 7.6
   * 
   * @param ctx - Canvas rendering context
   * @param alpha - Alpha value (default 0.6)
   */
  static applyHazardTransparency(ctx: CanvasRenderingContext2D, alpha: number = 0.6): void {
    ctx.globalAlpha = alpha
    ctx.globalCompositeOperation = 'screen'
  }

  /**
   * Apply additive blending for effects
   * Requirements: 7.5
   * 
   * @param ctx - Canvas rendering context
   */
  static applyAdditiveBlending(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = 'lighter'
  }

  /**
   * Reset context to default state
   * 
   * @param ctx - Canvas rendering context
   */
  static resetContext(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 1.0
    ctx.globalCompositeOperation = 'source-over'
    ctx.filter = 'none'
  }
}
