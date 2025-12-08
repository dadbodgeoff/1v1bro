/**
 * ProceduralGenerator - Procedural map generation
 * Based on Arena Assets Cheatsheet adjacency rules
 * 
 * @module arena/ProceduralGenerator
 */

import type { TileType } from './types'
import type { TileDefinition } from '../config/maps/map-schema'

// ============================================================================
// Types
// ============================================================================

export interface GeneratorConfig {
  width: number
  height: number
  wallDensity: number      // 0-1, percentage of walls
  hazardDensity: number    // 0-1, percentage of hazards
  symmetry: 'none' | 'horizontal' | 'vertical' | 'radial'
  spawnProtectionRadius: number  // Tiles around spawn to keep clear
}

interface AdjacencyRules {
  [key: string]: TileType[]
}

// ============================================================================
// Adjacency Rules (Wave Function Collapse style)
// ============================================================================

const ADJACENCY_RULES: AdjacencyRules = {
  floor: ['floor', 'wall', 'half_wall', 'hazard_damage', 'hazard_slow', 'teleporter', 'jump_pad'],
  wall: ['floor', 'wall', 'half_wall'],
  half_wall: ['floor', 'wall', 'half_wall'],
  hazard_damage: ['floor', 'hazard_damage'],
  hazard_slow: ['floor', 'hazard_slow'],
  hazard_emp: ['floor', 'hazard_emp'],
  teleporter: ['floor'],
  jump_pad: ['floor'],
  trap_pressure: ['floor'],
  trap_timed: ['floor'],
}

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: GeneratorConfig = {
  width: 16,
  height: 9,
  wallDensity: 0.15,
  hazardDensity: 0.05,
  symmetry: 'horizontal',
  spawnProtectionRadius: 2,
}


// ============================================================================
// ProceduralGenerator Class
// ============================================================================

export class ProceduralGenerator {
  private config: GeneratorConfig
  private rng: () => number

  constructor(config: Partial<GeneratorConfig> = {}, seed?: number) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    // Simple seeded random for reproducible maps
    this.rng = seed !== undefined ? this.seededRandom(seed) : Math.random
  }

  /**
   * Create a seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      return s / 0x7fffffff
    }
  }

  /**
   * Generate a complete map
   */
  generate(): TileDefinition[][] {
    const { width, height } = this.config
    
    // Initialize with floor tiles
    const tiles: TileDefinition[][] = []
    for (let y = 0; y < height; y++) {
      const row: TileDefinition[] = []
      for (let x = 0; x < width; x++) {
        row.push({ type: 'floor' })
      }
      tiles.push(row)
    }

    // Place walls
    this.placeWalls(tiles)

    // Place hazards
    this.placeHazards(tiles)

    // Place transport (teleporters, jump pads)
    this.placeTransport(tiles)

    // Apply symmetry
    this.applySymmetry(tiles)

    // Ensure spawn areas are clear
    this.clearSpawnAreas(tiles)

    return tiles
  }

  /**
   * Place wall tiles based on density
   */
  private placeWalls(tiles: TileDefinition[][]): void {
    const { width, height, wallDensity } = this.config
    const wallCount = Math.floor(width * height * wallDensity)

    for (let i = 0; i < wallCount; i++) {
      const x = Math.floor(this.rng() * width)
      const y = Math.floor(this.rng() * height)

      // Don't place on edges (leave border)
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) continue

      // Check adjacency rules
      if (this.canPlace('wall', x, y, tiles)) {
        tiles[y][x] = { type: this.rng() > 0.7 ? 'half_wall' : 'wall' }
      }
    }
  }

  /**
   * Place hazard tiles based on density
   */
  private placeHazards(tiles: TileDefinition[][]): void {
    const { width, height, hazardDensity } = this.config
    const hazardCount = Math.floor(width * height * hazardDensity)
    const hazardTypes: TileType[] = ['hazard_damage', 'hazard_slow', 'hazard_emp']

    for (let i = 0; i < hazardCount; i++) {
      const x = Math.floor(this.rng() * width)
      const y = Math.floor(this.rng() * height)
      const hazardType = hazardTypes[Math.floor(this.rng() * hazardTypes.length)]

      if (tiles[y][x].type === 'floor' && this.canPlace(hazardType, x, y, tiles)) {
        tiles[y][x] = { type: hazardType }
      }
    }
  }


  /**
   * Place transport elements (teleporters, jump pads)
   */
  private placeTransport(tiles: TileDefinition[][]): void {
    // Config available via this.config if needed

    // Place 1-2 teleporter pairs
    const teleporterCount = Math.floor(this.rng() * 2) + 1
    for (let i = 0; i < teleporterCount; i++) {
      // Find two valid positions
      const pos1 = this.findEmptyPosition(tiles)
      const pos2 = this.findEmptyPosition(tiles)
      if (pos1 && pos2) {
        tiles[pos1.y][pos1.x] = { type: 'teleporter', metadata: { pairId: `tp_${i}` } }
        tiles[pos2.y][pos2.x] = { type: 'teleporter', metadata: { pairId: `tp_${i}` } }
      }
    }

    // Place 2-4 jump pads
    const jumpPadCount = Math.floor(this.rng() * 3) + 2
    const directions = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW']
    for (let i = 0; i < jumpPadCount; i++) {
      const pos = this.findEmptyPosition(tiles)
      if (pos) {
        const dir = directions[Math.floor(this.rng() * directions.length)]
        tiles[pos.y][pos.x] = { type: 'jump_pad', metadata: { direction: dir } }
      }
    }
  }

  /**
   * Find an empty floor position
   */
  private findEmptyPosition(tiles: TileDefinition[][]): { x: number; y: number } | null {
    const { width, height } = this.config
    const maxAttempts = 50

    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(this.rng() * (width - 2)) + 1
      const y = Math.floor(this.rng() * (height - 2)) + 1
      if (tiles[y][x].type === 'floor') {
        return { x, y }
      }
    }
    return null
  }

  /**
   * Check if a tile type can be placed at position based on adjacency rules
   */
  private canPlace(type: TileType, x: number, y: number, tiles: TileDefinition[][]): boolean {
    const { width, height } = this.config
    const allowed = ADJACENCY_RULES[type] || ['floor']

    // Check all 4 neighbors
    const neighbors = [
      { dx: 0, dy: -1 }, // North
      { dx: 0, dy: 1 },  // South
      { dx: -1, dy: 0 }, // West
      { dx: 1, dy: 0 },  // East
    ]

    for (const { dx, dy } of neighbors) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborType = tiles[ny][nx].type
        if (!allowed.includes(neighborType)) {
          return false
        }
      }
    }
    return true
  }


  /**
   * Apply symmetry to the map
   */
  private applySymmetry(tiles: TileDefinition[][]): void {
    const { width, height, symmetry } = this.config

    switch (symmetry) {
      case 'horizontal':
        // Mirror left half to right half
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < Math.floor(width / 2); x++) {
            tiles[y][width - 1 - x] = { ...tiles[y][x] }
          }
        }
        break

      case 'vertical':
        // Mirror top half to bottom half
        for (let y = 0; y < Math.floor(height / 2); y++) {
          for (let x = 0; x < width; x++) {
            tiles[height - 1 - y][x] = { ...tiles[y][x] }
          }
        }
        break

      case 'radial':
        // 180-degree rotational symmetry
        for (let y = 0; y < Math.floor(height / 2); y++) {
          for (let x = 0; x < width; x++) {
            tiles[height - 1 - y][width - 1 - x] = { ...tiles[y][x] }
          }
        }
        break
    }
  }

  /**
   * Clear spawn areas to ensure players have room
   */
  private clearSpawnAreas(tiles: TileDefinition[][]): void {
    const { width, height, spawnProtectionRadius } = this.config

    // Spawn 1: Top-left area
    this.clearArea(tiles, 1, 1, spawnProtectionRadius)

    // Spawn 2: Bottom-right area
    this.clearArea(tiles, width - 2, height - 2, spawnProtectionRadius)
  }

  /**
   * Clear an area around a point
   */
  private clearArea(tiles: TileDefinition[][], cx: number, cy: number, radius: number): void {
    const { width, height } = this.config

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x >= 0 && x < width && y >= 0 && y < height) {
          // Only clear blocking tiles, keep floor
          const type = tiles[y][x].type
          if (type === 'wall' || type === 'half_wall' || type.startsWith('hazard')) {
            tiles[y][x] = { type: 'floor' }
          }
        }
      }
    }
  }

  /**
   * Generate a map with a specific seed for reproducibility
   */
  static generateWithSeed(seed: number, config?: Partial<GeneratorConfig>): TileDefinition[][] {
    const generator = new ProceduralGenerator(config, seed)
    return generator.generate()
  }
}
