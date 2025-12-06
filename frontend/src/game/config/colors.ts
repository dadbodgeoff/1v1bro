/**
 * Color palette for the arena
 * Neon cyberpunk theme
 */

export const COLORS = {
  // Background
  background: '#0a0e27',
  grid: '#1a2456',
  
  // Players
  player1: '#00ff88',  // Lime green
  player2: '#ff006e',  // Hot pink
  
  // Arena elements
  hub: '#00d4ff',           // Cyan
  barrier: '#4d0099',       // Deep purple
  barrierGlow: '#b300ff',   // Neon purple
  boundary: '#4d0099',
  
  // Power-ups
  powerUpInactive: '#ffb700',  // Gold
  powerUpActive: '#ff1493',    // Magenta
  
  // UI
  white: '#ffffff',
  black: '#000000',

  // Combat
  projectile: '#00ffff', // Cyan blaster shots
  healthHigh: '#00ff88', // Green - healthy
  healthMed: '#ffb700', // Yellow/gold - damaged
  healthLow: '#ff3333', // Red - critical
  shield: '#00d4ff', // Cyan shield bar
  invulnerable: '#ffffff', // White pulse for invulnerability

  // Combat Effects
  hitMarker: '#ff3333', // Red hit marker
  damageNumber: '#ff6666', // Light red damage numbers
  muzzleFlash: '#ffff00', // Yellow muzzle flash
  deathParticle: '#ff006e', // Pink death particles
  respawnRing: '#00ff88', // Green respawn ring
  playerDamageFlash: '#ff0000', // Red damage flash overlay
} as const

export type ColorKey = keyof typeof COLORS
