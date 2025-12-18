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

// Fare terminal model URL - optimized with WebP textures and Draco compression
const TERMINAL_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/fare-terminal-optimized.glb'

// Draco decoder path
const DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'

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
