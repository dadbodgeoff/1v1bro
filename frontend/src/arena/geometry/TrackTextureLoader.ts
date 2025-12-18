/**
 * TrackTextureLoader - Loads track bed and tunnel textures
 * 
 * Creates:
 * - Track bed texture (tiled along the sunken channel)
 * - Tunnel entrance walls (fake depth illusion at track ends)
 */

import * as THREE from 'three'
import { ARENA_CONFIG } from '../config/ArenaConfig'

const TRACK_TEXTURE_URL =
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/track-texture.jpg'
const TUNNEL_TEXTURE_URL =
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/tunnel-texture.jpg'

// Track config
const TRACK_CONFIG = {
  width: 5, // Track channel width
  depth: 40, // Full arena depth
  tilesAlongLength: 8, // How many times to repeat track texture
}

// Tunnel wall config
const TUNNEL_CONFIG = {
  width: 5, // Match track width
  height: 4, // Tunnel entrance height
  zOffset: 20, // Position at arena edges
}

let trackTexture: THREE.Texture | null = null
let tunnelTexture: THREE.Texture | null = null

/**
 * Load track bed texture
 */
async function loadTrackTexture(): Promise<THREE.Texture> {
  if (trackTexture) return trackTexture

  const loader = new THREE.TextureLoader()
  const texture = await loader.loadAsync(TRACK_TEXTURE_URL)

  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, TRACK_CONFIG.tilesAlongLength)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  trackTexture = texture
  return texture
}

/**
 * Load tunnel entrance texture
 */
async function loadTunnelTexture(): Promise<THREE.Texture> {
  if (tunnelTexture) return tunnelTexture

  const loader = new THREE.TextureLoader()
  const texture = await loader.loadAsync(TUNNEL_TEXTURE_URL)

  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  tunnelTexture = texture
  return texture
}

/**
 * Apply track texture to track bed mesh
 */
export async function applyTrackTexture(scene: THREE.Scene): Promise<void> {
  try {
    const texture = await loadTrackTexture()

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.2,
    })

    // Find track bed mesh and apply texture
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === 'track-bed') {
        child.material = material
        console.log('[TrackTextureLoader] Applied track texture')
      }
    })
  } catch (error) {
    console.error('[TrackTextureLoader] Failed to load track texture:', error)
  }
}

/**
 * Create tunnel entrance walls (fake depth illusion)
 */
export async function createTunnelWalls(scene: THREE.Scene): Promise<void> {
  try {
    const texture = await loadTunnelTexture()

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      // No lighting - emissive look for the tunnel
    })

    const { width, height, zOffset } = TUNNEL_CONFIG
    const trackDepth = ARENA_CONFIG.tracks.depth

    // North tunnel wall (at Z = -20)
    const northGeo = new THREE.PlaneGeometry(width, height)
    const northWall = new THREE.Mesh(northGeo, material)
    northWall.position.set(0, height / 2 - trackDepth, -zOffset + 0.1)
    northWall.name = 'tunnel-north'
    scene.add(northWall)

    // South tunnel wall (at Z = +20) - flip texture
    const southMaterial = material.clone()
    const southGeo = new THREE.PlaneGeometry(width, height)
    const southWall = new THREE.Mesh(southGeo, southMaterial)
    southWall.position.set(0, height / 2 - trackDepth, zOffset - 0.1)
    southWall.rotation.y = Math.PI // Face inward
    southWall.name = 'tunnel-south'
    scene.add(southWall)

    console.log('[TrackTextureLoader] Created tunnel entrance walls')
  } catch (error) {
    console.error('[TrackTextureLoader] Failed to create tunnel walls:', error)
  }
}

/**
 * Load all track-related textures
 */
export async function loadTrackTextures(scene: THREE.Scene): Promise<void> {
  await Promise.all([applyTrackTexture(scene), createTunnelWalls(scene)])
}

/**
 * Cleanup
 */
export function disposeTrackTextures(): void {
  if (trackTexture) {
    trackTexture.dispose()
    trackTexture = null
  }
  if (tunnelTexture) {
    tunnelTexture.dispose()
    tunnelTexture = null
  }
}
