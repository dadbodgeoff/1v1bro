/**
 * FloorMaterialLoader - Loads floor texture atlas (inpainted, no dividers/text)
 * 
 * Atlas layout: 8 columns × 8 rows
 * - Columns 0-3: West platform
 * - Columns 4-7: East platform
 */

import * as THREE from 'three'

const FLOOR_ATLAS_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/floor-atlas.jpg'

let cachedTexture: THREE.Texture | null = null

/**
 * Create floor geometry with UVs for atlas section
 */
function createFloorWithUVs(
  width: number,
  depth: number,
  uMin: number,
  uMax: number
): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(width, depth)
  const uv = geometry.attributes.uv

  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i)
    const v = uv.getY(i)
    uv.setXY(i, uMin + u * (uMax - uMin), v)
  }
  uv.needsUpdate = true
  return geometry
}

async function loadTexture(): Promise<THREE.Texture> {
  if (cachedTexture) return cachedTexture

  const loader = new THREE.TextureLoader()
  const texture = await loader.loadAsync(FLOOR_ATLAS_URL)

  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 8

  cachedTexture = texture
  return texture
}

export async function applyFloorMaterial(scene: THREE.Scene): Promise<void> {
  try {
    const texture = await loadTexture()

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.1,
    })

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.name === 'floor-west') {
          child.geometry.dispose()
          child.geometry = createFloorWithUVs(15.5, 40, 0, 0.5)
          child.material = material
        } else if (child.name === 'floor-east') {
          child.geometry.dispose()
          child.geometry = createFloorWithUVs(15.5, 40, 0.5, 1.0)
          child.material = material.clone()
        }
      }
    })

    console.log('[FloorMaterialLoader] Atlas applied')
  } catch (error) {
    console.error('[FloorMaterialLoader] Failed:', error)
  }
}

export async function loadFloorMaterial(): Promise<THREE.MeshStandardMaterial | null> {
  const texture = await loadTexture()
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85, metalness: 0.1 })
}

export function disposeFloorMaterial(): void {
  if (cachedTexture) {
    cachedTexture.dispose()
    cachedTexture = null
  }
}
