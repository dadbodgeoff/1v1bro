/**
 * CeilingMaterialLoader - Loads and applies ceiling texture from Supabase CDN
 *
 * Applies industrial abandoned ceiling texture with pipes and broken lights
 */

import * as THREE from 'three'

const CEILING_TEXTURE_URL =
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/ceiling-texture.jpg'

// Texture tiling config
const CEILING_TEXTURE_CONFIG = {
  repeatX: 4, // Tiles across ceiling width
  repeatY: 4, // Tiles across ceiling depth
}

let ceilingTexture: THREE.Texture | null = null
let ceilingMaterial: THREE.MeshStandardMaterial | null = null

/**
 * Load ceiling texture from CDN
 */
async function loadCeilingTexture(): Promise<THREE.Texture> {
  if (ceilingTexture) return ceilingTexture

  const loader = new THREE.TextureLoader()
  const texture = await loader.loadAsync(CEILING_TEXTURE_URL)

  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(CEILING_TEXTURE_CONFIG.repeatX, CEILING_TEXTURE_CONFIG.repeatY)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4 // Lower than floor/walls since ceiling is less viewed

  ceilingTexture = texture
  return texture
}

/**
 * Apply ceiling texture to ceiling mesh in scene
 */
export async function applyCeilingMaterial(scene: THREE.Scene): Promise<void> {
  try {
    const texture = await loadCeilingTexture()

    ceilingMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
    })

    // Find and apply to ceiling mesh
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === 'ceiling') {
        child.material = ceilingMaterial
        console.log('[CeilingMaterialLoader] Applied texture to ceiling')
      }
    })
  } catch (error) {
    console.error('[CeilingMaterialLoader] Failed to load ceiling texture:', error)
  }
}

/**
 * Cleanup
 */
export function disposeCeilingMaterial(): void {
  if (ceilingTexture) {
    ceilingTexture.dispose()
    ceilingTexture = null
  }
  if (ceilingMaterial) {
    ceilingMaterial.dispose()
    ceilingMaterial = null
  }
}
