/**
 * Cornfield Arena - Spooky farm-themed map with corn maze
 * @module config/maps/cornfield-arena
 * 
 * Map Layout (16x9 grid):
 * [B] = Dense Corn Block (Border)
 * [C] = Corn Edge (Maze walls)
 * .   = Dirt Floor (Walkable Path)
 * X   = Center Hub (Spawn Point)
 * [F] = Fence (Chokepoints)
 * [H] = Hay Bale (Cover)
 * 1   = Ruined Barn Area
 * 2   = Well Area
 * 3   = Scarecrow Area
 * 4   = Graveyard Area
 */

import type { MapConfig, TileDefinition } from './map-schema'
import type { PropPlacement } from '../../props/PropRegistry'

// Tile types for the cornfield
const B: TileDefinition = { type: 'wall' }     // Dense corn border (impassable)
const C: TileDefinition = { type: 'wall' }     // Corn edge (maze walls)
const D: TileDefinition = { type: 'floor' }    // Dirt floor (walkable)
const X: TileDefinition = { type: 'floor' }    // Spawn point (walkable)
const F: TileDefinition = { type: 'wall' }     // Fence (chokepoint)
const H: TileDefinition = { type: 'wall' }     // Hay bale (cover)

const TILE = 80
const gx = (col: number) => col * TILE + TILE / 2
const gy = (row: number) => row * TILE + TILE / 2

/**
 * Tile grid layout (16 cols x 9 rows)
 * Based on the provided map layout
 */
const tiles: TileDefinition[][] = [
  // Row 0: All border corn
  [B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B],
  // Row 1: Border, Barn(1), Corn edges, Well(2), Border
  [B, D, D, C, C, C, C, C, C, C, C, D, D, B, B, B],
  // Row 2: Border, Barn, dirt path, Fence, dirt, Well, Border
  [B, D, D, D, D, D, F, D, D, D, D, D, B, B, B, B],
  // Row 3: Border, Corn, dirt, Hay, dirt, Hay, dirt, Corn, Border
  [B, C, D, D, H, D, D, D, H, D, D, C, B, B, B, B],
  // Row 4: Border, Corn, dirt path with spawn X in center
  [B, C, D, D, D, D, X, D, D, D, D, C, B, B, B, B],
  // Row 5: Border, Corn, dirt, Hay, dirt, Hay, dirt, Corn, Border
  [B, C, D, D, H, D, D, D, H, D, D, C, B, B, B, B],
  // Row 6: Border, Graveyard(4), dirt, Fence, dirt, Scarecrow(3), Border
  [B, D, D, D, D, D, F, D, D, D, D, D, B, B, B, B],
  // Row 7: Border, Graveyard, Corn edges, Scarecrow, Border
  [B, D, D, C, C, C, C, C, C, C, C, D, D, B, B, B],
  // Row 8: All border corn
  [B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B],
]

// Asset URLs from Supabase
export const CORNFIELD_ASSETS = {
  // Tile textures
  dirtTile: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%201_08PM.jpeg',
  halfDirtGrass: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%201_08PM.jpeg',
  graveyard: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%2012_58PM.jpeg',
  scarecrow: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%2012_57PM.jpeg',
  rockWallWater: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%2012_56PM%20(1).jpeg',
  barn: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%2012_56PM.jpeg',
  thickCorn: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%2012_54PM.jpeg',
  lShapeCorn: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%2011_59AM%20(1).jpeg',
  dirtSouth: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%2011_58AM.jpeg',
  smallCornPatch: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/new%20map/Generated%20Image%20December%2012,%202025%20-%2011_57AM.jpeg',
}

export const CORNFIELD_ARENA: MapConfig = {
  metadata: {
    name: 'Haunted Cornfield',
    author: 'Arena Systems Team',
    version: '1.0.0',
    description: 'A spooky farm with corn maze, barn ruins, and mysterious scarecrows',
    theme: 'cornfield',
  },
  tiles,
  barriers: [
    // Corn border barriers (outer ring)
    // Top row
    ...Array.from({ length: 16 }, (_, i) => ({
      id: `corn_top_${i}`,
      type: 'full' as const,
      position: { x: i * TILE, y: 0 },
      size: { x: TILE, y: TILE },
    })),
    // Bottom row
    ...Array.from({ length: 16 }, (_, i) => ({
      id: `corn_bot_${i}`,
      type: 'full' as const,
      position: { x: i * TILE, y: 8 * TILE },
      size: { x: TILE, y: TILE },
    })),
    // Left column (rows 1-7)
    ...Array.from({ length: 7 }, (_, i) => ({
      id: `corn_left_${i}`,
      type: 'full' as const,
      position: { x: 0, y: (i + 1) * TILE },
      size: { x: TILE, y: TILE },
    })),
    // Right side dense corn (cols 12-15, rows 1-7)
    ...Array.from({ length: 7 }, (_, row) =>
      Array.from({ length: 4 }, (_, col) => ({
        id: `corn_right_${row}_${col}`,
        type: 'full' as const,
        position: { x: (12 + col) * TILE, y: (row + 1) * TILE },
        size: { x: TILE, y: TILE },
      }))
    ).flat(),
    // Corn edge walls (row 1 and 7, cols 3-10)
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `corn_edge_top_${i}`,
      type: 'full' as const,
      position: { x: (3 + i) * TILE, y: 1 * TILE },
      size: { x: TILE, y: TILE },
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `corn_edge_bot_${i}`,
      type: 'full' as const,
      position: { x: (3 + i) * TILE, y: 7 * TILE },
      size: { x: TILE, y: TILE },
    })),
    // Side corn walls (col 1 and 11, rows 3-5)
    { id: 'corn_side_left_3', type: 'full', position: { x: 1 * TILE, y: 3 * TILE }, size: { x: TILE, y: TILE } },
    { id: 'corn_side_left_4', type: 'full', position: { x: 1 * TILE, y: 4 * TILE }, size: { x: TILE, y: TILE } },
    { id: 'corn_side_left_5', type: 'full', position: { x: 1 * TILE, y: 5 * TILE }, size: { x: TILE, y: TILE } },
    { id: 'corn_side_right_3', type: 'full', position: { x: 11 * TILE, y: 3 * TILE }, size: { x: TILE, y: TILE } },
    { id: 'corn_side_right_4', type: 'full', position: { x: 11 * TILE, y: 4 * TILE }, size: { x: TILE, y: TILE } },
    { id: 'corn_side_right_5', type: 'full', position: { x: 11 * TILE, y: 5 * TILE }, size: { x: TILE, y: TILE } },
    // Hay bales (cover)
    { id: 'hay_tl', type: 'full', position: { x: gx(4) - 30, y: gy(3) - 30 }, size: { x: 60, y: 60 } },
    { id: 'hay_tr', type: 'full', position: { x: gx(8) - 30, y: gy(3) - 30 }, size: { x: 60, y: 60 } },
    { id: 'hay_bl', type: 'full', position: { x: gx(4) - 30, y: gy(5) - 30 }, size: { x: 60, y: 60 } },
    { id: 'hay_br', type: 'full', position: { x: gx(8) - 30, y: gy(5) - 30 }, size: { x: 60, y: 60 } },
    // Fences (chokepoints)
    { id: 'fence_top', type: 'full', position: { x: gx(6) - 20, y: gy(2) - 30 }, size: { x: 40, y: 60 } },
    { id: 'fence_bot', type: 'full', position: { x: gx(6) - 20, y: gy(6) - 30 }, size: { x: 40, y: 60 } },
  ],
  hazards: [],
  traps: [],
  teleporters: [],
  jumpPads: [],
  spawnPoints: [
    { id: 'player1', position: { x: gx(6), y: gy(4) } }, // Center spawn
  ],
  powerUpSpawns: [
    { x: gx(3), y: gy(4) },   // Left mid
    { x: gx(9), y: gy(4) },   // Right mid
    { x: gx(6), y: gy(2) },   // Top center
    { x: gx(6), y: gy(6) },   // Bottom center
  ],
}

export const CORNFIELD_TILE_SIZE = 80
export const CORNFIELD_ARENA_SIZE = { width: 1280, height: 720 }

/**
 * Prop placements for the cornfield map
 * These define where each visual element goes
 */
export const CORNFIELD_PROPS: PropPlacement[] = [
  // Barn area (top-left, cols 1-2, rows 1-2)
  { propId: 'barn', x: gx(1.5), y: gy(1.5) },
  
  // Well area (top-right, cols 10-11, rows 1-2)
  { propId: 'well', x: gx(10.5), y: gy(1.5) },
  
  // Graveyard area (bottom-left, cols 1-2, rows 6-7)
  { propId: 'graveyard', x: gx(1.5), y: gy(6.5) },
  
  // Scarecrow area (bottom-right, cols 10-11, rows 6-7)
  { propId: 'scarecrow', x: gx(10.5), y: gy(6.5) },
  
  // Hay bales (cover positions)
  { propId: 'hayBale', x: gx(4), y: gy(3) },
  { propId: 'hayBale', x: gx(8), y: gy(3) },
  { propId: 'hayBale', x: gx(4), y: gy(5) },
  { propId: 'hayBale', x: gx(8), y: gy(5) },
  
  // Fences (chokepoints)
  { propId: 'fence', x: gx(6), y: gy(2) },
  { propId: 'fence', x: gx(6), y: gy(6) },
]

/**
 * Tile type mapping for the renderer
 * Maps grid positions to specific tile assets
 */
export type CornfieldTileType = 
  | 'denseCorn'      // [B] - Border corn (impassable)
  | 'cornEdge'       // [C] - Corn maze walls
  | 'dirt'           // .   - Walkable dirt path
  | 'spawn'          // X   - Spawn point
  | 'barn'           // 1   - Barn area
  | 'well'           // 2   - Well area
  | 'scarecrow'      // 3   - Scarecrow area
  | 'graveyard'      // 4   - Graveyard area
  | 'fence'          // [F] - Fence chokepoint
  | 'hayBale'        // [H] - Hay bale cover

/**
 * Grid cell info for the map builder
 */
export interface CornfieldGridCell {
  col: number
  row: number
  type: CornfieldTileType
  asset?: string
  walkable: boolean
}

/**
 * Generate the grid cell data for the map builder
 * 
 * Original layout (16 cols x 9 rows):
 * [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B]
 * [B]  1   1  [C] [C] [C] [C] [C] [C] [C] [C]  2   2  [B] [B] [B]
 * [B]  1   1   .   .   .  [F]  .   .   .   2   2  [B] [B] [B]
 * [B] [C]  .   .  [H]  .   .   .  [H]  .   .  [C] [B] [B] [B]
 * [B] [C]  .   .   .   .   X   .   .   .   .  [C] [B] [B] [B]
 * [B] [C]  .   .  [H]  .   .   .  [H]  .   .  [C] [B] [B] [B]
 * [B]  4   4   .   .   .  [F]  .   .   .   3   3  [B] [B] [B]
 * [B]  4   4  [C] [C] [C] [C] [C] [C] [C] [C]  3   3  [B] [B] [B]
 * [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B] [B]
 */
export function generateCornfieldGrid(): CornfieldGridCell[][] {
  const grid: CornfieldGridCell[][] = []
  
  // Map layout string representation matching the original design
  // B=denseCorn, C=cornEdge, .=dirt, X=spawn, F=fence, H=hayBale
  // 1=barn, 2=well, 3=scarecrow, 4=graveyard
  const layout = [
    'BBBBBBBBBBBBBBBB',  // Row 0: All border
    'B11CCCCCCCC22BBB',  // Row 1: Barn(1), corn edges, Well(2), border
    'B11...F....22BBB',  // Row 2: Barn, dirt, fence, dirt, Well, border  
    'BC..H....H..CBBB',  // Row 3: Corn edge, dirt, hay, dirt, hay, dirt, corn edge, border
    'BC....X.....CBBB',  // Row 4: Corn edge, dirt path with spawn, corn edge, border
    'BC..H....H..CBBB',  // Row 5: Corn edge, dirt, hay, dirt, hay, dirt, corn edge, border
    'B44...F....33BBB',  // Row 6: Graveyard(4), dirt, fence, dirt, Scarecrow(3), border
    'B44CCCCCCCC33BBB',  // Row 7: Graveyard, corn edges, Scarecrow, border
    'BBBBBBBBBBBBBBBB',  // Row 8: All border
  ]
  
  for (let row = 0; row < 9; row++) {
    const rowCells: CornfieldGridCell[] = []
    for (let col = 0; col < 16; col++) {
      const char = layout[row]?.[col] || 'B'
      let type: CornfieldTileType = 'dirt'
      let walkable = true
      let asset: string | undefined
      
      switch (char) {
        case 'B':
          type = 'denseCorn'
          walkable = false
          asset = CORNFIELD_ASSETS.thickCorn
          break
        case 'C':
          type = 'cornEdge'
          walkable = false
          asset = CORNFIELD_ASSETS.lShapeCorn
          break
        case '.':
          type = 'dirt'
          walkable = true
          asset = CORNFIELD_ASSETS.dirtTile
          break
        case 'X':
          type = 'spawn'
          walkable = true
          asset = CORNFIELD_ASSETS.dirtTile
          break
        case 'F':
          type = 'fence'
          walkable = false
          asset = CORNFIELD_ASSETS.rockWallWater
          break
        case 'H':
          type = 'hayBale'
          walkable = false
          asset = CORNFIELD_ASSETS.smallCornPatch
          break
        case '1':
          type = 'barn'
          walkable = true
          asset = CORNFIELD_ASSETS.barn
          break
        case '2':
          type = 'well'
          walkable = true
          asset = CORNFIELD_ASSETS.rockWallWater
          break
        case '3':
          type = 'scarecrow'
          walkable = true
          asset = CORNFIELD_ASSETS.scarecrow
          break
        case '4':
          type = 'graveyard'
          walkable = true
          asset = CORNFIELD_ASSETS.graveyard
          break
      }
      
      rowCells.push({ col, row, type, asset, walkable })
    }
    grid.push(rowCells)
  }
  
  return grid
}
