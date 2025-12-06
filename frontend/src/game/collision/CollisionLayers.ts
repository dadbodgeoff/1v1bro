/**
 * CollisionLayers - Collision layer definitions and interaction matrix
 * 
 * @module collision/CollisionLayers
 */

// ============================================================================
// Collision Layer Constants
// ============================================================================

/**
 * Collision layer constants
 * Requirements: 10.7
 */
export const CollisionLayer = {
  NONE: 0,
  PLAYER: 1 << 0,      // 1
  PROJECTILE: 1 << 1,  // 2
  BARRIER: 1 << 2,     // 4
  ZONE: 1 << 3,        // 8
  TRAP: 1 << 4,        // 16
  TRANSPORT: 1 << 5    // 32
} as const

export type CollisionLayerType = typeof CollisionLayer[keyof typeof CollisionLayer]

// ============================================================================
// Collision Interaction Matrix
// ============================================================================

/**
 * Collision interaction matrix
 * Defines which layers collide with which
 * Requirements: 10.7
 */
const COLLISION_MATRIX: Record<number, number> = {
  [CollisionLayer.PLAYER]: 
    CollisionLayer.BARRIER | CollisionLayer.ZONE | CollisionLayer.TRAP | CollisionLayer.TRANSPORT,
  
  [CollisionLayer.PROJECTILE]: 
    CollisionLayer.BARRIER | CollisionLayer.TRAP,
  
  [CollisionLayer.BARRIER]: 
    CollisionLayer.PLAYER | CollisionLayer.PROJECTILE,
  
  [CollisionLayer.ZONE]: 
    CollisionLayer.PLAYER,
  
  [CollisionLayer.TRAP]: 
    CollisionLayer.PLAYER | CollisionLayer.PROJECTILE,
  
  [CollisionLayer.TRANSPORT]: 
    CollisionLayer.PLAYER
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if two layers should collide
 * Requirements: 10.7
 * 
 * @param layerA - First layer
 * @param layerB - Second layer
 * @returns true if layers should collide
 */
export function shouldCollide(layerA: CollisionLayerType, layerB: CollisionLayerType): boolean {
  const maskA = COLLISION_MATRIX[layerA] || 0
  const maskB = COLLISION_MATRIX[layerB] || 0
  
  // Check if either layer includes the other in its collision mask
  return (maskA & layerB) !== 0 || (maskB & layerA) !== 0
}

/**
 * Get collision mask for a layer
 * 
 * @param layer - Layer to get mask for
 * @returns Collision mask
 */
export function getCollisionMask(layer: CollisionLayerType): number {
  return COLLISION_MATRIX[layer] || 0
}

/**
 * Check if a layer collides with a mask
 * 
 * @param layer - Layer to check
 * @param mask - Collision mask
 * @returns true if layer collides with mask
 */
export function layerCollidesWithMask(layer: CollisionLayerType, mask: number): boolean {
  return (layer & mask) !== 0
}

/**
 * Combine multiple layers into a mask
 * 
 * @param layers - Layers to combine
 * @returns Combined mask
 */
export function combineLayers(...layers: CollisionLayerType[]): number {
  return layers.reduce((mask, layer) => mask | layer, 0)
}

/**
 * Check if a mask includes a layer
 * 
 * @param mask - Mask to check
 * @param layer - Layer to look for
 * @returns true if mask includes layer
 */
export function maskIncludesLayer(mask: number, layer: CollisionLayerType): boolean {
  return (mask & layer) !== 0
}
