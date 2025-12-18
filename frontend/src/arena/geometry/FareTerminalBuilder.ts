/**
 * FareTerminalBuilder - Loads abandoned fare terminal GLB models
 * 
 * Places 2 fare terminals on the platforms:
 * - 1 on the west platform (facing the tracks)
 * - 1 on the east platform (facing the tracks)
 * 
 * Positioned parallel to the tracks, near the platform edge.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { DRACO_DECODER_PATH, type PropPlacement, type ArenaConfig } from '../maps/types'

// Fare terminal model URL - optimized with WebP textures and Draco compression
// @deprecated Use MapLoader to load models instead
const TERMINAL_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/fare-terminal-optimized.glb'

// @deprecated Use DRACO_DECODER_PATH from maps/types.ts
const DRACO_PATH = DRACO_DECODER_PATH

// Terminal positioning config
const TERMINAL_CONFIG = {
  // Y position - on the floor
  y: 0,
  
  // Scale - reduced 30% from 3.0
  scale: 2.1,
}

/**
 * Load and place fare terminals on both platforms
 */
export async function loadFareTerminals(scene: THREE.Scene): Promise<THREE.Group[]> {
  const loader = new GLTFLoader()
  
  // Setup Draco decoder
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(DRACO_PATH)
  loader.setDRACOLoader(dracoLoader)
  
  try {
    // Load the terminal model once
    const gltf = await loader.loadAsync(TERMINAL_URL)
    const originalTerminal = gltf.scene
    
    // Get terminal dimensions for logging
    const box = new THREE.Box3().setFromObject(originalTerminal)
    const size = box.getSize(new THREE.Vector3())
    console.log('[FareTerminalBuilder] Terminal dimensions:', size)
    
    const terminals: THREE.Group[] = []
    
    // Terminal positions: [x, z, rotationY]
    // Spawns are at diagonal corners, so terminals mirror that layout
    // West platform (near NW spawn) - parallel to tracks, facing east
    // East platform (near SE spawn) - parallel to tracks, facing west
    const positions: [number, number, number][] = [
      // West platform - near north end, facing east (toward tracks)
      [-8, -10, Math.PI / 2],
      // East platform - near south end, facing west (toward tracks)
      [8, 10, -Math.PI / 2],
    ]
    
    for (let i = 0; i < positions.length; i++) {
      const [x, z, rotY] = positions[i]
      
      // Clone the terminal
      const terminal = originalTerminal.clone()
      terminal.name = `fare-terminal-${i}`
      
      // Apply scale
      terminal.scale.setScalar(TERMINAL_CONFIG.scale)
      
      // Position the terminal
      const terminalBox = new THREE.Box3().setFromObject(terminal)
      const terminalCenter = terminalBox.getCenter(new THREE.Vector3())
      
      terminal.position.x = x - terminalCenter.x
      terminal.position.y = TERMINAL_CONFIG.y - terminalBox.min.y
      terminal.position.z = z - terminalCenter.z
      
      // Rotate to face the tracks
      terminal.rotation.y = rotY
      
      // Setup shadows
      terminal.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      scene.add(terminal)
      terminals.push(terminal)
      
      console.log(`[FareTerminalBuilder] Terminal ${i} placed at (${x.toFixed(1)}, ${TERMINAL_CONFIG.y.toFixed(1)}, ${z.toFixed(1)})`)
    }
    
    console.log(`[FareTerminalBuilder] Loaded ${terminals.length} fare terminals`)
    return terminals
    
  } catch (error) {
    console.error('[FareTerminalBuilder] Failed to load terminal GLB:', error)
    return []
  }
}


/**
 * Place pre-loaded fare terminal models using positions from props config
 * 
 * This is the preferred method when using MapLoader to pre-load assets.
 * 
 * @param preloadedModel - The fare terminal model from LoadedMap.models.fareTerminal
 * @param propPlacement - The fare terminal placement config from MapDefinition.props
 * @param _config - Arena configuration (reserved for future use)
 * @returns Array of positioned terminal groups
 */
export function placeFareTerminals(
  preloadedModel: THREE.Group | undefined,
  propPlacement: PropPlacement | undefined,
  _config: ArenaConfig // Reserved for future use
): THREE.Group[] {
  if (!preloadedModel) {
    console.warn('[FareTerminalBuilder] No pre-loaded terminal model provided')
    return []
  }

  if (!propPlacement || propPlacement.positions.length === 0) {
    console.warn('[FareTerminalBuilder] No terminal positions provided')
    return []
  }

  const terminals: THREE.Group[] = []

  // Get terminal dimensions for logging
  const box = new THREE.Box3().setFromObject(preloadedModel)
  const size = box.getSize(new THREE.Vector3())
  console.log('[FareTerminalBuilder] Terminal dimensions:', size)

  for (let i = 0; i < propPlacement.positions.length; i++) {
    const pos = propPlacement.positions[i]

    // Clone the terminal
    const terminal = preloadedModel.clone()
    terminal.name = `fare-terminal-${i}`

    // Apply scale from prop config
    terminal.scale.setScalar(pos.scale)

    // Position the terminal
    const terminalBox = new THREE.Box3().setFromObject(terminal)
    const terminalCenter = terminalBox.getCenter(new THREE.Vector3())

    terminal.position.x = pos.x - terminalCenter.x
    terminal.position.y = pos.y - terminalBox.min.y
    terminal.position.z = pos.z - terminalCenter.z

    // Apply rotation
    terminal.rotation.y = pos.rotationY

    // Setup shadows
    terminal.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    terminals.push(terminal)
    console.log(`[FareTerminalBuilder] Terminal ${i} placed at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`)
  }

  console.log(`[FareTerminalBuilder] Placed ${terminals.length} fare terminals`)
  return terminals
}
