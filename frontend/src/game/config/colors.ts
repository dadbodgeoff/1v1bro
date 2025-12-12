/**
 * Color palette for the arena
 * Enterprise game theme - professional blues and greens
 */

export const COLORS = {
  // Background
  background: '#0a0e27',
  grid: '#1a2456',
  
  // Players
  player1: '#10b981',  // Emerald green
  player2: '#f43f5e',  // Rose red
  
  // Arena elements
  hub: '#3b82f6',           // Blue-500
  barrier: '#4f46e5',       // Indigo-600
  barrierGlow: '#6366f1',   // Indigo-500
  boundary: '#4f46e5',
  
  // Power-ups
  powerUpInactive: '#f59e0b',  // Amber
  powerUpActive: '#ec4899',    // Pink-500
  
  // UI
  white: '#ffffff',
  black: '#000000',

  // Combat
  projectile: '#60a5fa', // Blue-400 blaster shots
  healthHigh: '#10b981', // Emerald - healthy
  healthMed: '#f59e0b', // Amber - damaged
  healthLow: '#ef4444', // Red-500 - critical
  shield: '#3b82f6', // Blue-500 shield bar
  invulnerable: '#ffffff', // White pulse for invulnerability

  // Combat Effects
  hitMarker: '#ef4444', // Red-500 hit marker
  damageNumber: '#f87171', // Red-400 damage numbers
  muzzleFlash: '#fbbf24', // Amber-400 muzzle flash
  deathParticle: '#f43f5e', // Rose death particles
  respawnRing: '#10b981', // Emerald respawn ring
  playerDamageFlash: '#dc2626', // Red-600 damage flash overlay
} as const

export type ColorKey = keyof typeof COLORS
