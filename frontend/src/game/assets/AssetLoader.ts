/**
 * Asset Loader - Preloads all game images
 * Handles sprite sheets and removes checkered backgrounds for transparency
 */

import { processSpriteSheet } from './SpriteSheetProcessor'
import { loadImageWithTransparency, loadImageRaw } from './ImageProcessor'

// Sprite sheet imports
import greenSpriteSheet from '../../assets/game/sprites/green-spritesheet.png'
import pinkSpriteSheet from '../../assets/game/sprites/pink-spritesheet.png'

// Power-up imports
import shieldImg from '../../assets/game/powerups/shield.jpg'
import sosImg from '../../assets/game/powerups/sos.jpg'
import timeStealImg from '../../assets/game/powerups/time-steal.jpg'
import doublePointsImg from '../../assets/game/powerups/double-points.jpg'

// Tile imports
import floorTileImg from '../../assets/game/tiles/floor-tile.jpg'
import barrierImg from '../../assets/game/tiles/barrier.jpg'

export interface GameAssets {
  sprites: {
    green: HTMLCanvasElement[]
    pink: HTMLCanvasElement[]
  }
  powerups: {
    shield: HTMLCanvasElement
    sos: HTMLCanvasElement
    timeSteal: HTMLCanvasElement
    doublePoints: HTMLCanvasElement
  }
  tiles: {
    floor: HTMLImageElement
    barrier: HTMLCanvasElement
  }
}

// Sprite sheet config: 8 columns x 4 rows = 32 frames
const SPRITE_SHEET_CONFIG = {
  columns: 8,
  rows: 4,
}

let cachedAssets: GameAssets | null = null

export async function loadGameAssets(): Promise<GameAssets> {
  if (cachedAssets) return cachedAssets

  console.log('Loading game assets...')

  const [
    greenFrames,
    pinkFrames,
    shield,
    sos,
    timeSteal,
    doublePoints,
    floor,
    barrier,
  ] = await Promise.all([
    processSpriteSheet(greenSpriteSheet, SPRITE_SHEET_CONFIG),
    processSpriteSheet(pinkSpriteSheet, SPRITE_SHEET_CONFIG),
    loadImageWithTransparency(shieldImg),
    loadImageWithTransparency(sosImg),
    loadImageWithTransparency(timeStealImg),
    loadImageWithTransparency(doublePointsImg),
    loadImageRaw(floorTileImg), // Floor tile doesn't need transparency
    loadImageWithTransparency(barrierImg),
  ])

  console.log(`Loaded ${greenFrames.length} green frames, ${pinkFrames.length} pink frames`)

  cachedAssets = {
    sprites: { green: greenFrames, pink: pinkFrames },
    powerups: { shield, sos, timeSteal, doublePoints },
    tiles: { floor, barrier },
  }

  return cachedAssets
}

export function getAssets(): GameAssets | null {
  return cachedAssets
}
