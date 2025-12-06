/**
 * ZoneTypes - Zone effect type constants and utilities
 * 
 * @module zones/ZoneTypes
 */

import type { ZoneEffectType, HazardType } from '../arena/types'

// ============================================================================
// Effect Type Constants
// ============================================================================

/**
 * Zone effect type constants
 * Requirements: 8.1
 */
export const ZONE_EFFECT_TYPES = {
  SPEED_MODIFIER: 'speed_modifier' as ZoneEffectType,
  DAMAGE_OVER_TIME: 'damage_over_time' as ZoneEffectType,
  POWER_UP_DISABLE: 'power_up_disable' as ZoneEffectType
} as const

// ============================================================================
// Aggregation Rules
// ============================================================================

/**
 * Effect aggregation rules
 * Requirements: 8.4
 */
export const AGGREGATION_RULES = {
  speed_modifier: 'multiplicative',      // Multiply all values
  damage_over_time: 'additive',          // Sum all values
  power_up_disable: 'boolean_or'         // True if any is true
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert hazard type to zone effect type
 * 
 * @param hazardType - Hazard type
 * @returns Zone effect type
 */
export function hazardTypeToEffectType(hazardType: HazardType): ZoneEffectType {
  switch (hazardType) {
    case 'damage':
      return ZONE_EFFECT_TYPES.DAMAGE_OVER_TIME
    case 'slow':
      return ZONE_EFFECT_TYPES.SPEED_MODIFIER
    case 'emp':
      return ZONE_EFFECT_TYPES.POWER_UP_DISABLE
  }
}

/**
 * Get default value for an effect type
 * 
 * @param effectType - Effect type
 * @returns Default value
 */
export function getDefaultEffectValue(effectType: ZoneEffectType): number {
  switch (effectType) {
    case 'speed_modifier':
      return 1.0  // No speed change
    case 'damage_over_time':
      return 0    // No damage
    case 'power_up_disable':
      return 0    // Not disabled
  }
}

/**
 * Check if an effect type uses multiplicative aggregation
 * 
 * @param effectType - Effect type
 * @returns true if multiplicative
 */
export function isMultiplicative(effectType: ZoneEffectType): boolean {
  return AGGREGATION_RULES[effectType] === 'multiplicative'
}

/**
 * Check if an effect type uses additive aggregation
 * 
 * @param effectType - Effect type
 * @returns true if additive
 */
export function isAdditive(effectType: ZoneEffectType): boolean {
  return AGGREGATION_RULES[effectType] === 'additive'
}

/**
 * Check if an effect type uses boolean OR aggregation
 * 
 * @param effectType - Effect type
 * @returns true if boolean OR
 */
export function isBooleanOr(effectType: ZoneEffectType): boolean {
  return AGGREGATION_RULES[effectType] === 'boolean_or'
}
