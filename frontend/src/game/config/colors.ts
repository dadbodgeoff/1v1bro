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
} as const

export type ColorKey = keyof typeof COLORS
