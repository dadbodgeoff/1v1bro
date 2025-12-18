/**
 * LuggageBuilder - Loads stacked luggage GLB models for cover
 *
 * Places 6 luggage stacks for esports-ready cover:
 * - 2 on west platform mid-lane (flanking cover)
 * - 2 on east platform mid-lane (flanking cover)
 * - 2 near platform edges (track-side peek cover)
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// Luggage model URL from Supabase
const LUGGAGE_URL =
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/lost-luggage.glb'

// Draco decoder path
const DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'

// Luggage positioning config
const LUGGAGE_CONFIG = {
  // Scale factor
  scale: 0.5,

  // Y offset (floor level)
  yOffset: 0,

  // Positions: [x, z, rotationY]
  // Strategic placement:
  //   - 2 beside train (not blocking doors at Z=-3, Z=+3)
  //   - 2 in spawn areas (near subway entrances)
  //   - 2 in platform corners
  positions: [
    // Beside train - west platform, between doors (Z=0, clear of door paths)
    [-4, 0, Math.PI / 2],
    // Beside train - east platform, between doors
    [4, 0, -Math.PI / 2],

    // Spawn area - NW subway entrance (player 1 spawn cover)
    [-10, -16, 0],
    // Spawn area - SE subway entrance (player 2 spawn cover)
    [10, 16, Math.PI],

    // Platform corners - good flanking positions
    [-14, 8, Math.PI / 4],
    [14, -8, -Math.PI / 4],
  ] as [number, number, number][],
}

/**
 * Load and place all luggage stacks
 */
export async function loadLuggageStacks(scene: THREE.Scene): Promise<THREE.Group[]> {
  const loader = new GLTFLoader()

  // Setup Draco decoder
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(DRACO_PATH)
  loader.setDRACOLoader(dracoLoader)

  try {
    // Load the luggage model once
    const gltf = await loader.loadAsync(LUGGAGE_URL)
    const originalLuggage = gltf.scene

    // Get dimensions for logging
    const box = new THREE.Box3().setFromObject(originalLuggage)
    const size = box.getSize(new THREE.Vector3())
    console.log('[LuggageBuilder] Luggage dimensions:', size)

    const luggageStacks: THREE.Group[] = []

    for (let i = 0; i < LUGGAGE_CONFIG.positions.length; i++) {
      const [x, z, rotY] = LUGGAGE_CONFIG.positions[i]

      // Clone the luggage
      const luggage = originalLuggage.clone()
      luggage.name = `luggage-stack-${i}`

      // Apply scale
      luggage.scale.setScalar(LUGGAGE_CONFIG.scale)

      // Position the luggage
      const luggageBox = new THREE.Box3().setFromObject(luggage)

      luggage.position.x = x
      luggage.position.y = LUGGAGE_CONFIG.yOffset - luggageBox.min.y
      luggage.position.z = z

      // Apply rotation
      luggage.rotation.y = rotY

      // Setup shadows
      luggage.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      scene.add(luggage)
      luggageStacks.push(luggage)

      console.log(
        `[LuggageBuilder] Luggage ${i} placed at (${x.toFixed(1)}, ${LUGGAGE_CONFIG.yOffset.toFixed(1)}, ${z.toFixed(1)})`
      )
    }

    console.log(`[LuggageBuilder] Loaded ${luggageStacks.length} luggage stacks`)
    return luggageStacks
  } catch (error) {
    console.error('[LuggageBuilder] Failed to load luggage GLB:', error)
    return []
  }
}
