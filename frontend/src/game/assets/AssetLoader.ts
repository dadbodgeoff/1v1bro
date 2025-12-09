/**
 * Asset Loader - Preloads all game images
 * Handles sprite sheets and removes checkered backgrounds for transparency
 */

import { processSpriteSheet } from './SpriteSheetProcessor'
import { loadImageWithTransparency, loadImageRaw } from './ImageProcessor'

// Sprite sheet imports - Base skins
import greenSpriteSheet from '../../assets/game/sprites/green-spritesheet.png'
import pinkSpriteSheet from '../../assets/game/sprites/pink-spritesheet.png'

// Sprite sheet imports - Premium skins
import soldierPurpleSpriteSheet from '../../assets/game/sprites/soldier-purple-spritesheet.png'
import bananaTacticalSpriteSheet from '../../assets/game/sprites/banana-tactical-spritesheet.png'
import knightGoldSpriteSheet from '../../assets/game/sprites/knight-gold-spritesheet.png'
import ninjaCyberSpriteSheet from '../../assets/game/sprites/ninja-cyber-spritesheet.png'
import wraithMatrixSpriteSheet from '../../assets/game/sprites/wraith-matrix-spritesheet.png'

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
    // Premium skins
    soldierPurple: HTMLCanvasElement[]
    bananaTactical: HTMLCanvasElement[]
    knightGold: HTMLCanvasElement[]
    ninjaCyber: HTMLCanvasElement[]
    wraithMatrix: HTMLCanvasElement[]
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

// Skin ID to sprite key mapping
export type SkinId = keyof GameAssets['sprites']

export const SKIN_IDS: SkinId[] = [
  'green',
  'pink',
  'soldierPurple',
  'bananaTactical',
  'knightGold',
  'ninjaCyber',
  'wraithMatrix',
]

// Sprite sheet config: 8 columns x 4 rows = 32 frames
const SPRITE_SHEET_CONFIG = {
  columns: 8,
  rows: 4,
}

let cachedAssets: GameAssets | null = null

export async function loadGameAssets(): Promise<GameAssets> {
  if (cachedAssets) return cachedAssets

  const [
    greenFrames,
    pinkFrames,
    soldierPurpleFrames,
    bananaTacticalFrames,
    knightGoldFrames,
    ninjaCyberFrames,
    wraithMatrixFrames,
    shield,
    sos,
    timeSteal,
    doublePoints,
    floor,
    barrier,
  ] = await Promise.all([
    processSpriteSheet(greenSpriteSheet, SPRITE_SHEET_CONFIG),
    processSpriteSheet(pinkSpriteSheet, SPRITE_SHEET_CONFIG),
    processSpriteSheet(soldierPurpleSpriteSheet, SPRITE_SHEET_CONFIG),
    processSpriteSheet(bananaTacticalSpriteSheet, SPRITE_SHEET_CONFIG),
    processSpriteSheet(knightGoldSpriteSheet, SPRITE_SHEET_CONFIG),
    processSpriteSheet(ninjaCyberSpriteSheet, SPRITE_SHEET_CONFIG),
    processSpriteSheet(wraithMatrixSpriteSheet, SPRITE_SHEET_CONFIG),
    loadImageWithTransparency(shieldImg),
    loadImageWithTransparency(sosImg),
    loadImageWithTransparency(timeStealImg),
    loadImageWithTransparency(doublePointsImg),
    loadImageRaw(floorTileImg), // Floor tile doesn't need transparency
    loadImageWithTransparency(barrierImg),
  ])

  cachedAssets = {
    sprites: {
      green: greenFrames,
      pink: pinkFrames,
      soldierPurple: soldierPurpleFrames,
      bananaTactical: bananaTacticalFrames,
      knightGold: knightGoldFrames,
      ninjaCyber: ninjaCyberFrames,
      wraithMatrix: wraithMatrixFrames,
    },
    powerups: { shield, sos, timeSteal, doublePoints },
    tiles: { floor, barrier },
  }

  return cachedAssets
}

export function getAssets(): GameAssets | null {
  return cachedAssets
}

/**
 * Get a specific frame from a skin's sprite sheet for shop/preview display
 * Frame 0 is the first frame (facing down, idle)
 */
export function getSkinPreviewFrame(skinId: SkinId, frameIndex = 0): HTMLCanvasElement | null {
  if (!cachedAssets) return null
  const frames = cachedAssets.sprites[skinId]
  if (!frames || frameIndex >= frames.length) return null
  return frames[frameIndex]
}
