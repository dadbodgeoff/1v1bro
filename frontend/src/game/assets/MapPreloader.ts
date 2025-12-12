/**
 * MapPreloader - Preloads map assets before game initialization
 *
 * Call preloadMapAssets() early (e.g., on route navigation or lobby join)
 * to eliminate the loading delay when the game starts.
 *
 * Preloads:
 * - Grass floor tiles (3 variants)
 * - Wall border tile
 * - All prop images used in the map
 */

// Simple arena tile URLs (floor + walls)
const SIMPLE_ARENA_TILES = [
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/grass%20(1).jpeg',
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/image2.jpeg',
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/image3.jpeg',
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/wallbarrier.jpg',
]

// Simple arena prop URLs (all props used in SIMPLE_ARENA_PROPS)
const SIMPLE_ARENA_PROPS = [
  // Core props (most visible)
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2011_12PM.jpeg', // box/wall
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/rockw.jpeg', // rock
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_35PM.jpeg', // waterPond
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_39PM.jpeg', // teleporter
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2011_40PM%20(1).jpeg', // bouncePad
  // Hazard props
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_46PM.jpeg', // minefield
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_47PM.jpeg', // empZone
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_59PM.jpeg', // pressureTrap
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2011_01PM.jpeg', // powerUpPedestal
  // Decorative props
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2011_20PM.png', // tallGrass
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2011,%202025%20-%2011_55PM.jpeg', // spawnPlatform
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2011,%202025%20-%2011_58PM%20(1).jpeg', // dirtPatch
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2012,%202025%20-%2012_02AM.jpeg', // wireDebris
]

// All simple arena assets combined
const SIMPLE_ARENA_ASSETS = [...SIMPLE_ARENA_TILES, ...SIMPLE_ARENA_PROPS]

// Cache for preloaded images
const preloadedImages = new Map<string, HTMLImageElement>()
let preloadPromise: Promise<void> | null = null
let preloadStarted = false

/**
 * Preload an image and cache it
 */
function preloadImage(url: string): Promise<HTMLImageElement> {
  // Return cached image if already loaded
  const cached = preloadedImages.get(url)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      preloadedImages.set(url, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to preload: ${url}`))
    img.src = url
  })
}

/**
 * Preload all assets for a map theme
 * Call this early (lobby, matchmaking) to eliminate loading delay
 *
 * Uses parallel loading with priority for critical assets (tiles first)
 */
export function preloadMapAssets(
  theme: 'simple' | 'volcanic' | 'space' = 'simple'
): Promise<void> {
  // Return existing promise if already preloading
  if (preloadPromise) return preloadPromise

  // Mark as started to prevent duplicate calls
  preloadStarted = true

  const assets = theme === 'simple' ? SIMPLE_ARENA_ASSETS : []

  if (assets.length === 0) {
    return Promise.resolve()
  }

  console.log(`[MapPreloader] Preloading ${assets.length} assets for ${theme} theme...`)
  const startTime = performance.now()

  // Load tiles first (critical path), then props in parallel
  const tileAssets = theme === 'simple' ? SIMPLE_ARENA_TILES : []
  const propAssets = theme === 'simple' ? SIMPLE_ARENA_PROPS : []

  preloadPromise = Promise.all(tileAssets.map(preloadImage))
    .then(() => {
      const tileTime = performance.now() - startTime
      console.log(`[MapPreloader] Tiles loaded in ${tileTime.toFixed(0)}ms, loading props...`)
      // Load props in parallel (non-blocking)
      return Promise.all(propAssets.map(preloadImage))
    })
    .then(() => {
      const elapsed = performance.now() - startTime
      console.log(
        `[MapPreloader] All ${assets.length} assets preloaded in ${elapsed.toFixed(0)}ms`
      )
    })
    .catch((err) => {
      console.warn('[MapPreloader] Some assets failed to preload:', err)
      // Don't throw - game will load them on demand
    })

  return preloadPromise
}

/**
 * Get a preloaded image (returns undefined if not preloaded)
 */
export function getPreloadedImage(url: string): HTMLImageElement | undefined {
  return preloadedImages.get(url)
}

/**
 * Check if critical assets (tiles) are preloaded
 */
export function areTilesPreloaded(): boolean {
  return SIMPLE_ARENA_TILES.every((url) => preloadedImages.has(url))
}

/**
 * Check if all assets are preloaded
 */
export function areAssetsPreloaded(): boolean {
  return preloadedImages.size >= SIMPLE_ARENA_ASSETS.length
}

/**
 * Check if preloading has started
 */
export function hasPreloadStarted(): boolean {
  return preloadStarted
}

/**
 * Clear preloaded assets (for memory management)
 */
export function clearPreloadedAssets(): void {
  preloadedImages.clear()
  preloadPromise = null
  preloadStarted = false
}
