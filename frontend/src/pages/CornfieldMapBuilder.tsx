/**
 * CornfieldMapBuilder - Map builder page for the Cornfield Arena
 * 
 * Displays the 16x9 grid with all tile assets loaded,
 * grid overlay for building, and labeled spawn point.
 * NOT wired into game mechanics - just for visual building.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { ARENA_SIZE } from '@/game/config'
import { 
  CORNFIELD_ASSETS, 
  CORNFIELD_TILE_SIZE,
  generateCornfieldGrid,
  type CornfieldGridCell,
  type CornfieldTileType 
} from '@/game/config/maps/cornfield-arena'
import { removeBackground, type BackgroundType } from '@/game/assets/ImageProcessor'

const TILE = CORNFIELD_TILE_SIZE
const COLS = 16
const ROWS = 9

// Tile type to color mapping for grid overlay (reduced opacity to see assets better)
const TILE_COLORS: Record<CornfieldTileType, string> = {
  denseCorn: 'rgba(34, 139, 34, 0.3)',    // Forest green
  cornEdge: 'rgba(154, 205, 50, 0.3)',    // Yellow green
  dirt: 'rgba(139, 90, 43, 0.15)',        // Brown (very light)
  spawn: 'rgba(255, 215, 0, 0.5)',        // Gold
  barn: 'rgba(139, 69, 19, 0.35)',        // Saddle brown
  well: 'rgba(70, 130, 180, 0.35)',       // Steel blue
  scarecrow: 'rgba(255, 140, 0, 0.35)',   // Dark orange
  graveyard: 'rgba(105, 105, 105, 0.35)', // Dim gray
  fence: 'rgba(160, 82, 45, 0.4)',        // Sienna
  hayBale: 'rgba(218, 165, 32, 0.35)',    // Goldenrod
}

// Asset to background type mapping
// 'none' = no background removal (for assets that fill their space)
// 'white' = remove white/light gray backgrounds
const ASSET_BG_TYPES: Record<string, BackgroundType> = {
  dirtTile: 'none',        // Dirt fills the tile - no removal needed
  halfDirtGrass: 'none',   // Fills the tile
  graveyard: 'white',      // POI - remove white bg
  scarecrow: 'white',      // POI - remove white bg
  rockWallWater: 'white',  // POI (well) - remove white bg
  barn: 'white',           // POI - remove white bg
  thickCorn: 'white',      // Corn - remove white, we'll add green base behind
  lShapeCorn: 'white',     // Corn - remove white, we'll add green base behind
  dirtSouth: 'none',       // Fills the tile
  smallCornPatch: 'white', // Remove white, add base behind
}

// Base fill colors for tiles that need background replacement (after white removal)
const TILE_BASE_FILLS: Record<string, string> = {
  thickCorn: '#2d4a1c',    // Dark forest green for dense corn
  lShapeCorn: '#3d5a2c',   // Slightly lighter green for corn edges
  smallCornPatch: '#5a4a32', // Brown for hay/small corn on dirt
}

interface LoadedAsset {
  key: string
  canvas: HTMLCanvasElement
  url: string
  // Pre-scaled versions for different render sizes
  scaled80?: HTMLCanvasElement   // 1 tile (80x80)
  scaled200?: HTMLCanvasElement  // POI size (200x200)
}

export function CornfieldMapBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showTileTypes, setShowTileTypes] = useState(true)
  const [showCoords, setShowCoords] = useState(false)
  const [loadedAssets, setLoadedAssets] = useState<Record<string, LoadedAsset>>({})
  const [loadCount, setLoadCount] = useState(0)
  const [grid] = useState<CornfieldGridCell[][]>(() => generateCornfieldGrid())
  const [selectedTile, setSelectedTile] = useState<CornfieldGridCell | null>(null)

  // Load all assets and pre-scale to render dimensions for 60fps
  useEffect(() => {
    const loadAssets = async () => {
      console.log('[CornfieldMapBuilder] Loading and pre-scaling assets for 60fps rendering...')
      const assets: Record<string, LoadedAsset> = {}

      // POI assets that need 200x200 pre-scaling
      const POI_ASSETS = ['barn', 'graveyard', 'scarecrow', 'rockWallWater']
      const POI_SIZE = 200 // 2.5 tiles
      const TILE_SIZE = 80

      const entries = Object.entries(CORNFIELD_ASSETS) as [string, string][]
      
      const results = await Promise.allSettled(
        entries.map(async ([key, url]) => {
          const img = await loadImage(url)
          const bgType = ASSET_BG_TYPES[key] || 'none'
          
          // Process with background removal
          const processed = removeBackground(img, bgType)
          
          // Pre-scale to 80x80 for tile rendering (high quality)
          const scaled80 = scaleCanvasHQ(processed, TILE_SIZE, TILE_SIZE)
          
          // Pre-scale POI assets to 200x200 for large prop rendering
          const scaled200 = POI_ASSETS.includes(key) 
            ? scaleCanvasHQ(processed, POI_SIZE, POI_SIZE)
            : undefined
          
          console.log(`[CornfieldMapBuilder] Loaded: ${key} → 80x80${scaled200 ? ' + 200x200' : ''}`)
          return { key, canvas: processed, url, scaled80, scaled200 }
        })
      )

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          assets[result.value.key] = result.value
        } else {
          console.error(`[CornfieldMapBuilder] Failed to load asset:`, result.reason)
        }
      })

      console.log(`[CornfieldMapBuilder] ${Object.keys(assets).length} assets pre-scaled for 60fps`)
      setLoadedAssets(assets)
      setLoadCount(Object.keys(assets).length)
      setLoaded(true)
    }

    loadAssets()
  }, [])

  // Render the map
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Enable high-quality image scaling
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Clear with dark background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw base dirt floor for walkable areas
    const dirtAsset = loadedAssets['dirtTile']
    
    // Track which large props we've already drawn (to avoid duplicates)
    const drawnLargeProps = new Set<string>()
    
    // Large props (POIs) - define their anchor positions and size
    // These are the 4 answer zones players need to reach
    const POI_SIZE = 2.5 // 2.5 tiles = 200px (bigger for visibility as answer zones)
    const LARGE_PROPS: Record<string, { col: number; row: number; assetKey: string; size: number }> = {
      barn: { col: 1, row: 1, assetKey: 'barn', size: POI_SIZE },
      well: { col: 10, row: 1, assetKey: 'rockWallWater', size: POI_SIZE },
      graveyard: { col: 1, row: 6, assetKey: 'graveyard', size: POI_SIZE },
      scarecrow: { col: 10, row: 6, assetKey: 'scarecrow', size: POI_SIZE },
    }
    
    // Render each tile (base layer)
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = grid[row]?.[col]
        if (!cell) continue

        const x = col * TILE
        const y = row * TILE

        // Draw dirt floor for walkable tiles (use pre-scaled 80x80)
        if (cell.walkable && dirtAsset?.scaled80) {
          ctx.drawImage(dirtAsset.scaled80, x, y)
        }

        // Skip large prop tiles - they'll be drawn separately
        if (isLargePropType(cell.type)) {
          continue
        }

        // Draw specific assets for regular tiles (use pre-scaled 80x80)
        const assetKey = getAssetKeyForType(cell.type)
        if (assetKey) {
          // Draw base fill color first (for tiles with transparent backgrounds)
          const baseFill = TILE_BASE_FILLS[assetKey]
          if (baseFill) {
            ctx.fillStyle = baseFill
            ctx.fillRect(x, y, TILE, TILE)
          }
          
          const asset = loadedAssets[assetKey]
          if (asset?.scaled80) {
            ctx.drawImage(asset.scaled80, x, y)
          }
        }
      }
    }
    
    // Draw large props (POIs) using pre-scaled 200x200 canvases
    for (const [propType, config] of Object.entries(LARGE_PROPS)) {
      const asset = loadedAssets[config.assetKey]
      if (asset?.scaled200 && !drawnLargeProps.has(propType)) {
        const x = config.col * TILE
        const y = config.row * TILE
        // Draw pre-scaled 200x200 - no scaling at render time!
        ctx.drawImage(asset.scaled200, x, y)
        drawnLargeProps.add(propType)
      }
    }
    
    // Draw tile type overlay on top
    if (showTileTypes) {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cell = grid[row]?.[col]
          if (!cell) continue
          
          const x = col * TILE
          const y = row * TILE
          ctx.fillStyle = TILE_COLORS[cell.type] || 'rgba(128, 128, 128, 0.3)'
          ctx.fillRect(x, y, TILE, TILE)
        }
      }
    }

    // Draw spawn point marker
    const spawnX = 6 * TILE + TILE / 2
    const spawnY = 4 * TILE + TILE / 2
    
    // Spawn circle
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'
    ctx.beginPath()
    ctx.arc(spawnX, spawnY, 20, 0, Math.PI * 2)
    ctx.fill()
    
    // Spawn label
    ctx.fillStyle = '#000'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SPAWN', spawnX, spawnY)

    // Draw grid lines
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1

      // Vertical lines
      for (let x = 0; x <= ARENA_SIZE.width; x += TILE) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, ARENA_SIZE.height)
        ctx.stroke()
      }

      // Horizontal lines
      for (let y = 0; y <= ARENA_SIZE.height; y += TILE) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(ARENA_SIZE.width, y)
        ctx.stroke()
      }
    }

    // Draw coordinates
    if (showCoords) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = col * TILE + TILE / 2
          const y = row * TILE + 2
          ctx.fillText(`${col},${row}`, x, y)
        }
      }
    }

    // Highlight selected tile
    if (selectedTile) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 3
      ctx.strokeRect(
        selectedTile.col * TILE,
        selectedTile.row * TILE,
        TILE,
        TILE
      )
    }
  }, [grid, loadedAssets, loadCount, showGrid, showTileTypes, showCoords, selectedTile])

  // Initial render on mount
  useEffect(() => {
    render()
  }, [])

  // Re-render when state changes
  useEffect(() => {
    render()
  }, [loaded, loadCount, showGrid, showTileTypes, showCoords, selectedTile, render])

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    const col = Math.floor(x / TILE)
    const row = Math.floor(y / TILE)
    
    const cell = grid[row]?.[col]
    if (cell) {
      setSelectedTile(cell)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4">
      {/* Controls */}
      <div className="flex gap-3 mb-4 flex-wrap justify-center">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            showGrid 
              ? 'bg-indigo-600 text-white' 
              : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
          }`}
        >
          {showGrid ? '✓ Grid' : 'Grid'}
        </button>
        <button
          onClick={() => setShowTileTypes(!showTileTypes)}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            showTileTypes 
              ? 'bg-green-600 text-white' 
              : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
          }`}
        >
          {showTileTypes ? '✓ Tile Types' : 'Tile Types'}
        </button>
        <button
          onClick={() => setShowCoords(!showCoords)}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            showCoords 
              ? 'bg-amber-600 text-white' 
              : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
          }`}
        >
          {showCoords ? '✓ Coords' : 'Coords'}
        </button>
        <span className="text-neutral-400 self-center px-2">
          {loaded ? `✓ ${loadCount} assets loaded` : 'Loading...'}
        </span>
      </div>

      {/* Canvas */}
      <div className="relative border-2 border-neutral-700 rounded shadow-2xl">
        <canvas
          ref={canvasRef}
          width={ARENA_SIZE.width}
          height={ARENA_SIZE.height}
          onClick={handleCanvasClick}
          className="block cursor-crosshair"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Selected tile info */}
      {selectedTile && (
        <div className="mt-4 bg-neutral-800 rounded p-4 text-sm">
          <div className="text-neutral-300">
            <span className="text-neutral-500">Position:</span>{' '}
            <span className="font-mono">({selectedTile.col}, {selectedTile.row})</span>
          </div>
          <div className="text-neutral-300">
            <span className="text-neutral-500">Type:</span>{' '}
            <span className="font-mono text-amber-400">{selectedTile.type}</span>
          </div>
          <div className="text-neutral-300">
            <span className="text-neutral-500">Walkable:</span>{' '}
            <span className={selectedTile.walkable ? 'text-green-400' : 'text-red-400'}>
              {selectedTile.walkable ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 bg-neutral-800 rounded p-4">
        <div className="text-neutral-400 text-xs mb-2 font-medium">LEGEND</div>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {Object.entries(TILE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: color }}
              />
              <span className="text-neutral-400">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Asset preview */}
      <div className="mt-4 bg-neutral-800 rounded p-4">
        <div className="text-neutral-400 text-xs mb-2 font-medium">LOADED ASSETS</div>
        <div className="flex gap-2 flex-wrap">
          {Object.values(loadedAssets).map((asset) => (
            <div 
              key={asset.key} 
              className="flex flex-col items-center bg-neutral-700 rounded p-2"
              title={asset.key}
            >
              <canvas
                ref={(el) => {
                  if (el) {
                    const ctx = el.getContext('2d')
                    if (ctx) {
                      ctx.clearRect(0, 0, 48, 48)
                      ctx.drawImage(asset.canvas, 0, 0, 48, 48)
                    }
                  }
                }}
                width={48}
                height={48}
                className="rounded"
                style={{ background: 'repeating-conic-gradient(#333 0% 25%, #444 0% 50%) 50% / 8px 8px' }}
              />
              <span className="text-neutral-400 text-[10px] mt-1 max-w-[60px] truncate">
                {asset.key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper: Load image from URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load: ${src}`))
    img.src = src
  })
}

// Helper: High-quality canvas scaling (for pre-scaling assets)
function scaleCanvasHQ(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  
  // Enable high-quality scaling
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // Draw scaled
  ctx.drawImage(source, 0, 0, width, height)
  
  return canvas
}

// Helper: Check if tile type is a large prop (2x2)
function isLargePropType(type: CornfieldTileType): boolean {
  return type === 'barn' || type === 'well' || type === 'scarecrow' || type === 'graveyard'
}

// Helper: Get asset key for tile type (1x1 tiles only)
function getAssetKeyForType(type: CornfieldTileType): string | null {
  switch (type) {
    case 'denseCorn':
      return 'thickCorn'
    case 'cornEdge':
      return 'lShapeCorn'
    case 'fence':
      return 'rockWallWater'
    case 'hayBale':
      return 'smallCornPatch'
    // Large props handled separately
    case 'barn':
    case 'well':
    case 'scarecrow':
    case 'graveyard':
      return null
    default:
      return null
  }
}

export default CornfieldMapBuilder
