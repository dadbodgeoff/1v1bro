/**
 * SubwayEntranceBuilder - Loads subway entrance GLB models
 * Places two entrances at diagonal corners (NW and SE)
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const SUBWAY_GLB_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/subway.glb'

// Target height for scaling - match ceiling height (leads to street level above)
const TARGET_HEIGHT = 6  // meters (same as ARENA_CONFIG.ceilingHeight)

// Entrance positions (diagonal corners) - flipped 180° from original
const ENTRANCES = [
  { x: -12, z: -14, rotationY: 0, name: 'nw' },            // NW corner, facing into platform
  { x: 12, z: 14, rotationY: Math.PI, name: 'se' },        // SE corner, facing into platform
]

/**
 * Create placeholder group while GLB loads
 */
export function createSubwayEntrances(): THREE.Group {
  const group = new THREE.Group()
  group.name = 'subway-entrances'
  return group
}


/**
 * Load subway entrance GLB and add to scene
 */
export async function loadSubwayEntrancesGLB(scene: THREE.Scene): Promise<void> {
  const loader = new GLTFLoader()
  
  return new Promise((resolve, reject) => {
    loader.load(
      SUBWAY_GLB_URL,
      (gltf) => {
        const model = gltf.scene
        
        // Calculate current bounds
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        
        // Scale based on height to fit under ceiling
        const scale = TARGET_HEIGHT / size.y
        
        console.log('[SubwayEntrance] Original size:', size)
        console.log('[SubwayEntrance] Scale factor:', scale)
        
        // Create entrance at each position
        ENTRANCES.forEach((pos) => {
          const entrance = model.clone()
          entrance.name = `subway-entrance-${pos.name}`
          
          // Apply scale
          entrance.scale.setScalar(scale)
          
          // Recalculate bounds after scaling to position correctly
          const scaledBox = new THREE.Box3().setFromObject(entrance)
          const scaledSize = scaledBox.getSize(new THREE.Vector3())
          
          // Position so bottom of model sits at Y=0 (floor level)
          // minY is the lowest point - we offset by negative minY to bring bottom to 0
          const yOffset = -scaledBox.min.y
          
          entrance.position.set(pos.x, yOffset, pos.z)
          entrance.rotation.y = pos.rotationY
          
          console.log(`[SubwayEntrance] ${pos.name} bounds:`, scaledBox.min.y, 'to', scaledBox.max.y, 'yOffset:', yOffset)
          
          // Enable shadows and improve material rendering
          entrance.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true
              child.receiveShadow = true
              
              // Improve material rendering
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.roughness = Math.min(child.material.roughness, 0.7)
                child.material.metalness = Math.max(child.material.metalness, 0.1)
                child.material.envMapIntensity = 0.5
                child.material.needsUpdate = true
              }
            }
          })
          
          scene.add(entrance)
          console.log(`[SubwayEntrance] Added ${pos.name} at (${pos.x}, 0, ${pos.z}), size:`, scaledSize)
        })
        
        resolve()
      },
      (progress) => {
        const pct = (progress.loaded / progress.total * 100).toFixed(1)
        console.log(`[SubwayEntrance] Loading: ${pct}%`)
      },
      (error) => {
        console.error('[SubwayEntrance] Failed to load GLB:', error)
        reject(error)
      }
    )
  })
}
