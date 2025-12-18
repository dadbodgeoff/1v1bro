/**
 * WallMaterialLoader - Loads and applies wall texture from Supabase CDN
 *
 * Applies grungy concrete texture to arena walls
 */

import * as THREE from 'three'

// @deprecated Use MapLoader to load textures instead
const WALL_TEXTURE_URL =
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/wall-texture.jpg'

// Texture tiling config
const WALL_TEXTURE_CONFIG = {
  repeatX: 4, // Tiles across wall width
  repeatY: 2, // Tiles up wall height
}

let wallTexture: THREE.Texture | null = null
let wallMaterial: THREE.MeshStandardMaterial | null = null

/**
 * Load wall texture from CDN
 */
async function loadWallTexture(): Promise<THREE.Texture> {
  if (wallTexture) return wallTexture

  const loader = new THREE.TextureLoader()
  const texture = await loader.loadAsync(WALL_TEXTURE_URL)

  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(WALL_TEXTURE_CONFIG.repeatX, WALL_TEXTURE_CONFIG.repeatY)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  wallTexture = texture
  return texture
}

/**
 * Apply wall texture to all wall meshes in scene
 */
export async function applyWallMaterial(scene: THREE.Scene): Promise<void> {
  try {
    const texture = await loadWallTexture()

    wallMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.1,
    })

    // Find and apply to wall meshes
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name.startsWith('wall-')) {
        child.material = wallMaterial
        console.log(`[WallMaterialLoader] Applied texture to ${child.name}`)
      }
    })

    console.log('[WallMaterialLoader] Wall textures applied')
  } catch (error) {
    console.error('[WallMaterialLoader] Failed to load wall texture:', error)
  }
}

/**
 * Cleanup
 */
export function disposeWallMaterial(): void {
  if (wallTexture) {
    wallTexture.dispose()
    wallTexture = null
  }
  if (wallMaterial) {
    wallMaterial.dispose()
    wallMaterial = null
  }
}


/**
 * Apply pre-loaded wall texture to wall meshes
 * 
 * This is the preferred method when using MapLoader to pre-load assets.
 * 
 * @param scene - The scene containing wall meshes
 * @param preloadedTexture - The wall texture from LoadedMap.textures.wall
 */
export function applyPreloadedWallMaterial(
  scene: THREE.Scene,
  preloadedTexture: THREE.Texture | undefined
): void {
  if (!preloadedTexture) {
    console.warn('[WallMaterialLoader] No pre-loaded wall texture provided')
    return
  }

  // Configure texture
  preloadedTexture.wrapS = THREE.RepeatWrapping
  preloadedTexture.wrapT = THREE.RepeatWrapping
  preloadedTexture.repeat.set(WALL_TEXTURE_CONFIG.repeatX, WALL_TEXTURE_CONFIG.repeatY)
  preloadedTexture.colorSpace = THREE.SRGBColorSpace
  preloadedTexture.anisotropy = 8

  const material = new THREE.MeshStandardMaterial({
    map: preloadedTexture,
    roughness: 0.85,
    metalness: 0.1,
  })

  // Find and apply to wall meshes
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name.startsWith('wall-')) {
      child.material = material
      console.log(`[WallMaterialLoader] Applied pre-loaded texture to ${child.name}`)
    }
  })

  console.log('[WallMaterialLoader] Pre-loaded wall textures applied')
}
