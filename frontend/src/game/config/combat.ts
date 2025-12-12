/**
 * Combat system configuration
 * All combat-related constants and default values
 */

import type { WeaponConfig, Vector2 } from '../types'

// ============================================================================
// Weapon Configuration
// ============================================================================

export const WEAPON_CONFIG: WeaponConfig = {
  fireRate: 3, // 3 shots per second (333ms cooldown)
  projectileSpeed: 600, // 600 units/sec - dodgeable at range
  maxRange: 400, // ~1/3 arena width, encourages positioning
  damage: 25, // 4 shots to kill (100 health)
  spread: 2, // ±2 degrees random deviation
  knockback: 50, // Slight pushback on hit
}

// ============================================================================
// Health Configuration
// ============================================================================

export const HEALTH_CONFIG = {
  maxHealth: 100,
  maxShield: 35, // From shield power-up (5 shots to kill with shield vs 4 without)
  shieldDecayRate: 0, // Shield doesn't decay over time
  invulnerabilityDuration: 2000, // 2 seconds after respawn
  damageFlashDuration: 100, // 0.1 second red flash
}

// ============================================================================
// Respawn Configuration
// ============================================================================

export const RESPAWN_CONFIG = {
  respawnDelay: 3000, // 3 seconds
  minSpawnDistance: 300, // Minimum distance from enemy
  spawnPoints: [
    { x: 160, y: 360 } as Vector2, // Player 1 default spawn
    { x: 1120, y: 360 } as Vector2, // Player 2 default spawn
    { x: 640, y: 100 } as Vector2, // Top center
    { x: 640, y: 620 } as Vector2, // Bottom center
  ],
}


// ============================================================================
// Projectile Configuration
// ============================================================================

export const PROJECTILE_CONFIG = {
  hitboxRadius: 4, // Small hitbox for skill-based gameplay
  trailLength: 8, // Number of trail points
  trailFadeSpeed: 0.15, // Alpha reduction per frame
}

// ============================================================================
// Player Hurtbox Configuration
// ============================================================================

export const PLAYER_HURTBOX = {
  radius: 12, // Slightly smaller than visual sprite
}

// ============================================================================
// Server Validation Configuration (Anti-Cheat)
// ============================================================================

export const SERVER_VALIDATION_CONFIG = {
  /** Tolerance for fire rate validation (ms) - accounts for network jitter */
  fireRateTolerance: 50,
  /** Maximum allowed spread deviation from server-calculated spread */
  maxSpreadDeviation: 5,
  /** Enable server-side spread calculation */
  serverSideSpread: true,
  /** Lag compensation window (ms) - how far back server can rewind for hit detection */
  lagCompensationWindow: 200,
  /** Maximum position extrapolation (ms) */
  maxExtrapolation: 100,
}

// ============================================================================
// Interpolation Configuration
// ============================================================================

export const INTERPOLATION_CONFIG = {
  /** Buffer size for position history (for lag compensation) */
  positionHistorySize: 20,
  /** Interpolation delay (ms) - trades latency for smoothness */
  interpolationDelay: 100,
  /** Extrapolation limit (ms) - max time to predict forward */
  extrapolationLimit: 150,
}

// ============================================================================
// Derived Constants
// ============================================================================

export const FIRE_COOLDOWN_MS = 1000 / WEAPON_CONFIG.fireRate
export const HIT_RADIUS = PROJECTILE_CONFIG.hitboxRadius + PLAYER_HURTBOX.radius
