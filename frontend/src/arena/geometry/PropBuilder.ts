/**
 * PropBuilder - Loads decorative props (walls, benches, luggage)
 * 
 * Placement strategy:
 * - Wall of Expression: At track ends, between carts and arena walls
 * - Benches: Along platform edges, providing cover without blocking paths
 * - Luggage: Scattered for atmosphere (future)
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// Asset URLs (Supabase CDN)
const ASSETS = {
  wallExpression: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/wall-expression.glb',
  bench: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/weathered-bench.glb',
  luggage: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/lost-luggage.glb',
}

const DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'

// Prop placement config
const PROP_CONFIG = {
  // Wall of Expression - at track ends
  walls: {
    scale: 2.0,
    positions: [
      { x: 0, z: -18, rotY: 0 },        // North end - facing south
      { x: 0, z: 18, rotY: Math.PI },   // South end - facing north
    ],
  },
  // Benches - along platform edges, mid-platform
  // Placed parallel to track, providing cover spots
  // West platform: X = -10 (center of 15.5m platform from track edge)
  // East platform: X = +10
  benches: {
    scale: 1.2,
    positions: [
      // West platform - 2 benches
      { x: -10, z: -6, rotY: Math.PI / 2 },   // North-ish, facing track
      { x: -10, z: 6, rotY: Math.PI / 2 },    // South-ish, facing track
      // East platform - 2 benches  
      { x: 10, z: -6, rotY: -Math.PI / 2 },   // North-ish, facing track
      { x: 10, z: 6, rotY: -Math.PI / 2 },    // South-ish, facing track
    ],
  },
}

// Shared loader instance
let loader: GLTFLoader | null = null

function getLoader(): GLTFLoader {
  if (!loader) {
    loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_PATH)
    loader.setDRACOLoader(dracoLoader)
  }
  return loader
}

/**
 * Load and place Wall of Expression props
 */
export async function loadWallExpressions(scene: THREE.Scene): Promise<THREE.Group[]> {
  const gltfLoader = getLoader()
  const config = PROP_CONFIG.walls

  try {
    const gltf = await gltfLoader.loadAsync(ASSETS.wallExpression)
    const original = gltf.scene
    const walls: THREE.Group[] = []

    // Log dimensions
    const box = new THREE.Box3().setFromObject(original)
    const size = box.getSize(new THREE.Vector3())
    console.log('[PropBuilder] Wall dimensions:', size)

    for (let i = 0; i < config.positions.length; i++) {
      const pos = config.positions[i]
      const wall = original.clone()
      wall.name = `wall-expression-${i}`

      wall.scale.setScalar(config.scale)
      wall.position.set(pos.x, 0, pos.z)
      wall.rotation.y = pos.rotY

      // Center on ground
      const wallBox = new THREE.Box3().setFromObject(wall)
      wall.position.y = -wallBox.min.y

      // Shadows
      wall.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      scene.add(wall)
      walls.push(wall)
      console.log(`[PropBuilder] Wall ${i} at (${pos.x}, 0, ${pos.z})`)
    }

    return walls
  } catch (error) {
    console.error('[PropBuilder] Failed to load wall:', error)
    return []
  }
}

/**
 * Load and place bench props
 */
export async function loadBenches(scene: THREE.Scene): Promise<THREE.Group[]> {
  const gltfLoader = getLoader()
  const config = PROP_CONFIG.benches

  try {
    const gltf = await gltfLoader.loadAsync(ASSETS.bench)
    const original = gltf.scene
    const benches: THREE.Group[] = []

    const box = new THREE.Box3().setFromObject(original)
    const size = box.getSize(new THREE.Vector3())
    console.log('[PropBuilder] Bench dimensions:', size)

    for (let i = 0; i < config.positions.length; i++) {
      const pos = config.positions[i]
      const bench = original.clone()
      bench.name = `bench-${i}`

      bench.scale.setScalar(config.scale)
      bench.position.set(pos.x, 0, pos.z)
      bench.rotation.y = pos.rotY

      // Place on floor
      const benchBox = new THREE.Box3().setFromObject(bench)
      bench.position.y = -benchBox.min.y

      bench.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      scene.add(bench)
      benches.push(bench)
      console.log(`[PropBuilder] Bench ${i} at (${pos.x}, 0, ${pos.z})`)
    }

    return benches
  } catch (error) {
    console.error('[PropBuilder] Failed to load benches:', error)
    return []
  }
}

/**
 * Load all arena props
 */
export async function loadArenaProps(scene: THREE.Scene): Promise<void> {
  console.log('[PropBuilder] Loading arena props...')
  
  // Load in parallel
  await Promise.all([
    loadWallExpressions(scene),
    loadBenches(scene),
  ])

  console.log('[PropBuilder] All props loaded')
}
