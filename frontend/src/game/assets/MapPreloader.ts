/**
 * MapPreloader - Enterprise-grade asset preloading with performance optimizations
 *
 * Features:
 * - Priority-based loading (critical tiles first, then props)
 * - Concurrent loading with configurable batch size
 * - Progressive loading with callbacks for UI feedback
 * - Browser cache optimization via Cache API
 * - Automatic retry with exponential backoff
 * - Memory-efficient image decoding
 * - Performance metrics tracking
 *
 * Call preloadMapAssets() early (e.g., on route navigation or lobby join)
 * to eliminate the loading delay when the game starts.
 */

// ============================================================================
// Asset URLs - Organized by priority
// ============================================================================

// Critical tiles (P0) - Must load before game can start
const SIMPLE_ARENA_TILES = [
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/grass%20(1).jpeg',
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/image2.jpeg',
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/image3.jpeg',
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/wallbarrier.jpg',
]

// Core props (P1) - Visible immediately, load right after tiles
const SIMPLE_ARENA_PROPS_CORE = [
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2011_12PM.jpeg', // box/wall
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/rockw.jpeg', // rock
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_35PM.jpeg', // waterPond
]

// Interactive props (P2) - Gameplay-critical but can load slightly later
const SIMPLE_ARENA_PROPS_INTERACTIVE = [
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_39PM.jpeg', // teleporter
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2011_40PM%20(1).jpeg', // bouncePad
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_46PM.jpeg', // minefield
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_47PM.jpeg', // empZone
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2010_59PM.jpeg', // pressureTrap
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2011_01PM.jpeg', // powerUpPedestal
]

// Decorative props (P3) - Can load in background, not blocking
const SIMPLE_ARENA_PROPS_DECORATIVE = [
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/Generated%20Image%20December%2011,%202025%20-%2011_20PM.png', // tallGrass
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2011,%202025%20-%2011_55PM.jpeg', // spawnPlatform
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2011,%202025%20-%2011_58PM%20(1).jpeg', // dirtPatch
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2012,%202025%20-%2012_02AM.jpeg', // wireDebris
]

// Combined prop arrays for backward compatibility
const SIMPLE_ARENA_PROPS = [
  ...SIMPLE_ARENA_PROPS_CORE,
  ...SIMPLE_ARENA_PROPS_INTERACTIVE,
  ...SIMPLE_ARENA_PROPS_DECORATIVE,
]

// All simple arena assets combined
const SIMPLE_ARENA_ASSETS = [...SIMPLE_ARENA_TILES, ...SIMPLE_ARENA_PROPS]

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Maximum concurrent image loads (browser typically limits to 6 per domain)
  MAX_CONCURRENT_LOADS: 6,
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY_MS: 500,
  // Cache configuration
  CACHE_NAME: 'map-assets-v1',
  // Timeout for individual image loads
  LOAD_TIMEOUT_MS: 10000,
}

// ============================================================================
// State
// ============================================================================

// Cache for preloaded images
const preloadedImages = new Map<string, HTMLImageElement>()
let preloadPromise: Promise<void> | null = null
let preloadStarted = false

// Performance metrics
interface PreloadMetrics {
  startTime: number
  tilesLoadedTime: number
  corePropsLoadedTime: number
  allAssetsLoadedTime: number
  totalAssets: number
  cachedAssets: number
  networkAssets: number
  failedAssets: number
}

let lastMetrics: PreloadMetrics | null = null

// Progress callback type
type ProgressCallback = (loaded: number, total: number, phase: 'tiles' | 'core' | 'interactive' | 'decorative') => void

// ============================================================================
// Cache API Integration
// ============================================================================

/**
 * Check if an asset is in the browser cache
 */
async function isInCache(url: string): Promise<boolean> {
  if (!('caches' in window)) return false
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME)
    const response = await cache.match(url)
    return !!response
  } catch {
    return false
  }
}

/**
 * Add an asset to the browser cache
 */
async function addToCache(url: string, blob: Blob): Promise<void> {
  if (!('caches' in window)) return
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME)
    const response = new Response(blob, {
      headers: {
        'Content-Type': blob.type,
        'Cache-Control': 'max-age=31536000', // 1 year
      },
    })
    await cache.put(url, response)
  } catch {
    // Cache API not available or quota exceeded - continue without caching
  }
}

/**
 * Get an asset from the browser cache
 */
async function getFromCache(url: string): Promise<Blob | null> {
  if (!('caches' in window)) return null
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME)
    const response = await cache.match(url)
    if (response) {
      return await response.blob()
    }
  } catch {
    // Cache miss or error
  }
  return null
}

// ============================================================================
// Image Loading with Optimizations
// ============================================================================

/**
 * Load an image with retry logic and cache integration
 */
async function loadImageWithRetry(
  url: string,
  retryCount = 0
): Promise<HTMLImageElement> {
  // Check memory cache first
  const cached = preloadedImages.get(url)
  if (cached) return cached

  // Check browser cache
  const cachedBlob = await getFromCache(url)
  if (cachedBlob) {
    const img = await createImageFromBlob(cachedBlob)
    preloadedImages.set(url, img)
    return img
  }

  // Load from network with timeout
  try {
    const img = await loadImageFromNetwork(url)
    preloadedImages.set(url, img)
    return img
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      // Exponential backoff
      const delay = CONFIG.RETRY_BASE_DELAY_MS * Math.pow(2, retryCount)
      await new Promise(resolve => setTimeout(resolve, delay))
      return loadImageWithRetry(url, retryCount + 1)
    }
    throw error
  }
}

/**
 * Load image from network with fetch for better caching control
 */
async function loadImageFromNetwork(url: string): Promise<HTMLImageElement> {
  // Use fetch for better control over caching and error handling
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.LOAD_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // Request caching
      cache: 'force-cache',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    
    // Cache the blob for future use
    addToCache(url, blob).catch(() => {}) // Fire and forget

    return createImageFromBlob(blob)
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Create an HTMLImageElement from a Blob with optimized decoding
 */
async function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    // Use decode() for non-blocking image decoding when available
    const objectUrl = URL.createObjectURL(blob)
    
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl)
      
      // Use decode() for smoother rendering (non-blocking)
      if ('decode' in img) {
        try {
          await img.decode()
        } catch {
          // decode() failed, but image is still usable
        }
      }
      
      resolve(img)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image: ${blob.type}`))
    }
    
    img.src = objectUrl
  })
}

/**
 * Load images in batches with concurrency control
 */
async function loadImageBatch(
  urls: string[],
  onProgress?: (loaded: number) => void
): Promise<{ loaded: number; failed: number; cached: number }> {
  let loaded = 0
  let failed = 0
  let cached = 0

  // Process in batches to respect browser connection limits
  for (let i = 0; i < urls.length; i += CONFIG.MAX_CONCURRENT_LOADS) {
    const batch = urls.slice(i, i + CONFIG.MAX_CONCURRENT_LOADS)
    
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const wasCached = preloadedImages.has(url) || await isInCache(url)
        await loadImageWithRetry(url)
        return wasCached
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        loaded++
        if (result.value) cached++
      } else {
        failed++
        console.warn('[MapPreloader] Failed to load asset:', result.reason)
      }
    }

    onProgress?.(loaded)
  }

  return { loaded, failed, cached }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Preload an image and cache it (legacy API)
 * @deprecated Use loadImageWithRetry directly
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return loadImageWithRetry(url)
}

/**
 * Preload all assets for a map theme with enterprise-grade optimizations
 * 
 * Features:
 * - Priority-based loading (tiles → core props → interactive → decorative)
 * - Progress callbacks for loading UI
 * - Performance metrics tracking
 * - Automatic retry with exponential backoff
 * - Browser cache integration
 *
 * @param theme - Map theme to preload assets for
 * @param onProgress - Optional callback for loading progress
 * @returns Promise that resolves when critical assets are loaded
 */
export function preloadMapAssets(
  theme: 'simple' | 'volcanic' | 'space' = 'simple',
  onProgress?: ProgressCallback
): Promise<void> {
  // Return existing promise if already preloading
  if (preloadPromise) return preloadPromise

  // Mark as started to prevent duplicate calls
  preloadStarted = true

  if (theme !== 'simple') {
    // Other themes don't have preloadable assets yet
    return Promise.resolve()
  }

  const metrics: PreloadMetrics = {
    startTime: performance.now(),
    tilesLoadedTime: 0,
    corePropsLoadedTime: 0,
    allAssetsLoadedTime: 0,
    totalAssets: SIMPLE_ARENA_ASSETS.length,
    cachedAssets: 0,
    networkAssets: 0,
    failedAssets: 0,
  }

  console.log(`[MapPreloader] Starting enterprise preload for ${theme} theme (${metrics.totalAssets} assets)...`)

  preloadPromise = (async () => {
    let totalLoaded = 0
    const totalAssets = SIMPLE_ARENA_ASSETS.length

    // Phase 1: Critical tiles (blocking)
    console.log('[MapPreloader] Phase 1: Loading critical tiles...')
    const tileResult = await loadImageBatch(SIMPLE_ARENA_TILES, (loaded) => {
      onProgress?.(loaded, totalAssets, 'tiles')
    })
    totalLoaded += tileResult.loaded
    metrics.tilesLoadedTime = performance.now() - metrics.startTime
    metrics.cachedAssets += tileResult.cached
    metrics.failedAssets += tileResult.failed
    console.log(`[MapPreloader] Tiles loaded in ${metrics.tilesLoadedTime.toFixed(0)}ms (${tileResult.cached} cached)`)

    // Phase 2: Core props (blocking)
    console.log('[MapPreloader] Phase 2: Loading core props...')
    const coreResult = await loadImageBatch(SIMPLE_ARENA_PROPS_CORE, (loaded) => {
      onProgress?.(totalLoaded + loaded, totalAssets, 'core')
    })
    totalLoaded += coreResult.loaded
    metrics.corePropsLoadedTime = performance.now() - metrics.startTime
    metrics.cachedAssets += coreResult.cached
    metrics.failedAssets += coreResult.failed
    console.log(`[MapPreloader] Core props loaded in ${metrics.corePropsLoadedTime.toFixed(0)}ms`)

    // Phase 3: Interactive props (non-blocking, but awaited)
    console.log('[MapPreloader] Phase 3: Loading interactive props...')
    const interactiveResult = await loadImageBatch(SIMPLE_ARENA_PROPS_INTERACTIVE, (loaded) => {
      onProgress?.(totalLoaded + loaded, totalAssets, 'interactive')
    })
    totalLoaded += interactiveResult.loaded
    metrics.cachedAssets += interactiveResult.cached
    metrics.failedAssets += interactiveResult.failed

    // Phase 4: Decorative props (background, non-blocking)
    console.log('[MapPreloader] Phase 4: Loading decorative props...')
    const decorativeResult = await loadImageBatch(SIMPLE_ARENA_PROPS_DECORATIVE, (loaded) => {
      onProgress?.(totalLoaded + loaded, totalAssets, 'decorative')
    })
    totalLoaded += decorativeResult.loaded
    metrics.cachedAssets += decorativeResult.cached
    metrics.failedAssets += decorativeResult.failed

    // Finalize metrics
    metrics.allAssetsLoadedTime = performance.now() - metrics.startTime
    metrics.networkAssets = totalLoaded - metrics.cachedAssets
    lastMetrics = metrics

    console.log(
      `[MapPreloader] ✓ All ${totalLoaded}/${metrics.totalAssets} assets loaded in ${metrics.allAssetsLoadedTime.toFixed(0)}ms ` +
      `(${metrics.cachedAssets} cached, ${metrics.networkAssets} network, ${metrics.failedAssets} failed)`
    )
  })().catch((err) => {
    console.warn('[MapPreloader] Preload error:', err)
    // Don't throw - game will load assets on demand
  })

  return preloadPromise
}

/**
 * Preload critical assets only (tiles + core props)
 * Use this for faster initial load when decorative assets can wait
 */
export async function preloadCriticalAssets(
  theme: 'simple' | 'volcanic' | 'space' = 'simple'
): Promise<void> {
  if (theme !== 'simple') return

  const criticalAssets = [...SIMPLE_ARENA_TILES, ...SIMPLE_ARENA_PROPS_CORE]
  
  console.log(`[MapPreloader] Preloading ${criticalAssets.length} critical assets...`)
  const startTime = performance.now()
  
  await loadImageBatch(criticalAssets)
  
  console.log(`[MapPreloader] Critical assets loaded in ${(performance.now() - startTime).toFixed(0)}ms`)
}

/**
 * Warm the cache by preloading assets in the background
 * Call this on app startup or idle time
 */
export function warmCache(theme: 'simple' | 'volcanic' | 'space' = 'simple'): void {
  if (preloadStarted) return
  
  // Use requestIdleCallback for non-blocking background loading
  const schedulePreload = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1))
  
  schedulePreload(() => {
    preloadMapAssets(theme).catch(() => {})
  })
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
 * Check if core assets (tiles + core props) are preloaded
 */
export function areCoreAssetsPreloaded(): boolean {
  const coreAssets = [...SIMPLE_ARENA_TILES, ...SIMPLE_ARENA_PROPS_CORE]
  return coreAssets.every((url) => preloadedImages.has(url))
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
 * Get preload progress (0-1)
 */
export function getPreloadProgress(): number {
  if (SIMPLE_ARENA_ASSETS.length === 0) return 1
  return preloadedImages.size / SIMPLE_ARENA_ASSETS.length
}

/**
 * Get last preload metrics for performance monitoring
 */
export function getPreloadMetrics(): PreloadMetrics | null {
  return lastMetrics
}

/**
 * Clear preloaded assets (for memory management)
 */
export function clearPreloadedAssets(): void {
  preloadedImages.clear()
  preloadPromise = null
  preloadStarted = false
  lastMetrics = null
}

/**
 * Get the number of preloaded assets
 */
export function getPreloadedCount(): number {
  return preloadedImages.size
}

/**
 * Get total asset count for a theme
 */
export function getTotalAssetCount(theme: 'simple' | 'volcanic' | 'space' = 'simple'): number {
  if (theme === 'simple') return SIMPLE_ARENA_ASSETS.length
  return 0
}
