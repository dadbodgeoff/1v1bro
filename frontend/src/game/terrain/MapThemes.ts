/**
 * MapThemes - Theme-based color palettes for arena maps
 * Based on Arena Assets Cheatsheet recommendations
 * 
 * @module terrain/MapThemes
 */

// ============================================================================
// Types
// ============================================================================

export type MapTheme = 'default' | 'forest' | 'urban' | 'ice' | 'lava' | 'void' | 'neon'

export interface ThemePalette {
  /** Primary floor color */
  floor: string
  /** Floor variant colors (for visual variety) */
  floorVariants: string[]
  /** Wall color */
  wall: string
  /** Wall highlight color */
  wallHighlight: string
  /** Half wall color */
  halfWall: string
  /** Hazard damage zone color */
  hazardDamage: string
  /** Hazard slow zone color */
  hazardSlow: string
  /** Hazard EMP zone color */
  hazardEmp: string
  /** Trap color */
  trap: string
  /** Teleporter color */
  teleporter: string
  /** Jump pad color */
  jumpPad: string
  /** Grid line color */
  gridLine: string
  /** Background color */
  background: string
  /** Accent glow color */
  accentGlow: string
}


// ============================================================================
// Theme Palettes
// ============================================================================

export const THEME_PALETTES: Record<MapTheme, ThemePalette> = {
  default: {
    floor: '#1a1a2e',
    floorVariants: ['#1a1a2e', '#1e1e35', '#16162a', '#1c1c30', '#181830'],
    wall: '#2d2d44',
    wallHighlight: '#3d3d5c',
    halfWall: '#3d3d5c',
    hazardDamage: '#ff4444',
    hazardSlow: '#4444ff',
    hazardEmp: '#ffff44',
    trap: '#ff8844',
    teleporter: '#44ffff',
    jumpPad: '#44ff44',
    gridLine: 'rgba(255, 255, 255, 0.08)',
    background: '#0f0f1a',
    accentGlow: '#6366f1',
  },

  forest: {
    floor: '#1a2e1a',
    floorVariants: ['#1a2e1a', '#1e351e', '#162a16', '#1c301c', '#183018', '#223822'],
    wall: '#2d442d',
    wallHighlight: '#3d5c3d',
    halfWall: '#3d5c3d',
    hazardDamage: '#ff6644',
    hazardSlow: '#44aa88',
    hazardEmp: '#aaff44',
    trap: '#cc6633',
    teleporter: '#44ffaa',
    jumpPad: '#88ff44',
    gridLine: 'rgba(100, 200, 100, 0.08)',
    background: '#0a1a0a',
    accentGlow: '#22c55e',
  },

  urban: {
    floor: '#1e1e1e',
    floorVariants: ['#1e1e1e', '#222222', '#1a1a1a', '#252525', '#202020', '#282828'],
    wall: '#3a3a3a',
    wallHighlight: '#4a4a4a',
    halfWall: '#444444',
    hazardDamage: '#ff3333',
    hazardSlow: '#3366ff',
    hazardEmp: '#ffcc00',
    trap: '#ff6600',
    teleporter: '#00ccff',
    jumpPad: '#00ff66',
    gridLine: 'rgba(255, 255, 255, 0.06)',
    background: '#0a0a0a',
    accentGlow: '#f59e0b',
  },


  ice: {
    floor: '#1a2a3e',
    floorVariants: ['#1a2a3e', '#1e3045', '#162838', '#1c2e40', '#183040', '#2a4050'],
    wall: '#3a5a7a',
    wallHighlight: '#4a6a8a',
    halfWall: '#4a6a8a',
    hazardDamage: '#ff6688',
    hazardSlow: '#88ccff',
    hazardEmp: '#aaffff',
    trap: '#ff8899',
    teleporter: '#88ffff',
    jumpPad: '#aaffcc',
    gridLine: 'rgba(150, 200, 255, 0.1)',
    background: '#0a1520',
    accentGlow: '#38bdf8',
  },

  lava: {
    floor: '#2e1a1a',
    floorVariants: ['#2e1a1a', '#351e1e', '#2a1616', '#301c1c', '#301818', '#382020'],
    wall: '#442d2d',
    wallHighlight: '#5c3d3d',
    halfWall: '#5c3d3d',
    hazardDamage: '#ff4400',
    hazardSlow: '#ff8844',
    hazardEmp: '#ffaa00',
    trap: '#ff6600',
    teleporter: '#ffaa44',
    jumpPad: '#ffcc44',
    gridLine: 'rgba(255, 100, 50, 0.1)',
    background: '#1a0a0a',
    accentGlow: '#ef4444',
  },

  void: {
    floor: '#0a0a15',
    floorVariants: ['#0a0a15', '#0c0c18', '#080812', '#0e0e1a', '#0b0b16', '#101020'],
    wall: '#1a1a2a',
    wallHighlight: '#2a2a3a',
    halfWall: '#2a2a3a',
    hazardDamage: '#aa44ff',
    hazardSlow: '#6644ff',
    hazardEmp: '#60A5FA',
    trap: '#3B82F6',
    teleporter: '#6366F1',
    jumpPad: '#818CF8',
    gridLine: 'rgba(99, 102, 241, 0.08)',
    background: '#050508',
    accentGlow: '#6366F1',
  },

  neon: {
    floor: '#0a0a12',
    floorVariants: ['#0a0a12', '#0c0c15', '#080810', '#0e0e18', '#0b0b14', '#101018'],
    wall: '#1a1a25',
    wallHighlight: '#2a2a35',
    halfWall: '#2a2a35',
    hazardDamage: '#f43f5e',
    hazardSlow: '#3b82f6',
    hazardEmp: '#f59e0b',
    trap: '#ea580c',
    teleporter: '#10b981',
    jumpPad: '#84cc16',
    gridLine: 'rgba(59, 130, 246, 0.1)',
    background: '#050508',
    accentGlow: '#6366f1',
  },
}


// ============================================================================
// Current Theme State
// ============================================================================

let currentTheme: MapTheme = 'default'

/**
 * Get the current map theme
 */
export function getCurrentTheme(): MapTheme {
  return currentTheme
}

/**
 * Set the current map theme
 */
export function setCurrentTheme(theme: MapTheme): void {
  currentTheme = theme
}

/**
 * Get the palette for the current theme
 */
export function getCurrentPalette(): ThemePalette {
  return THEME_PALETTES[currentTheme]
}

/**
 * Get a palette by theme name
 */
export function getPalette(theme: MapTheme): ThemePalette {
  return THEME_PALETTES[theme]
}

/**
 * Get a random floor variant color for visual variety
 * Uses position-based seeding for consistent results
 */
export function getFloorVariant(gridX: number, gridY: number, theme?: MapTheme): string {
  const palette = theme ? THEME_PALETTES[theme] : getCurrentPalette()
  const variants = palette.floorVariants
  // Simple hash based on position for consistent variant selection
  const hash = (gridX * 31 + gridY * 17) % variants.length
  return variants[hash]
}

/**
 * Get tile color based on type and theme
 */
export function getTileColor(
  tileType: string,
  gridX: number,
  gridY: number,
  theme?: MapTheme
): string {
  const palette = theme ? THEME_PALETTES[theme] : getCurrentPalette()
  
  switch (tileType) {
    case 'floor':
      return getFloorVariant(gridX, gridY, theme)
    case 'wall':
      return palette.wall
    case 'half_wall':
      return palette.halfWall
    case 'hazard_damage':
      return palette.hazardDamage
    case 'hazard_slow':
      return palette.hazardSlow
    case 'hazard_emp':
      return palette.hazardEmp
    case 'trap_pressure':
    case 'trap_timed':
      return palette.trap
    case 'teleporter':
      return palette.teleporter
    case 'jump_pad':
      return palette.jumpPad
    default:
      return palette.floor
  }
}
