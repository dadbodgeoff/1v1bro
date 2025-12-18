/**
 * TrainBuilder - Loads the subway train GLB model
 * 
 * The train model (train3.glb) was scaled and positioned in Three.js Editor
 * with transforms baked into the geometry. No runtime scaling needed.
 * 
 * train3 = Rusty abandoned subway car, scaled in Three.js Editor
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { ARENA_CONFIG } from '../config/ArenaConfig'
import { DRACO_DECODER_PATH, type ArenaConfig } from '../maps/types'

// Train model - optimized with WebP textures and Draco compression (2.1MB vs 23MB)
// @deprecated Use MapLoader to load models instead
const TRAIN_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/train2-optimized.glb'

// Scale factor to adjust train size
// Original train2-optimized.glb has baked transforms (~9m × 12m × 26m at scale 1.0)
// Scale 0.5 gives us ~4.5m × 6m × 13m which fits the station well
const TRAIN_SCALE = 0.5

// @deprecated Use DRACO_DECODER_PATH from maps/types.ts
const DRACO_PATH = DRACO_DECODER_PATH

/**
 * Create a placeholder train while GLB loads
 */
export function createSubwayTrain(): THREE.Group {
  const group = new THREE.Group()
  group.name = 'subway-train'
  
  // Simple placeholder box while loading
  const trackDepth = ARENA_CONFIG.tracks.depth
  const placeholderGeo = new THREE.BoxGeometry(2.8, 2.6, 18)
  const placeholderMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.5,
    metalness: 0.5,
    transparent: true,
    opacity: 0.3,
  })
  const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat)
  placeholder.position.y = -trackDepth + 0.3 + 1.3
  placeholder.name = 'train-placeholder'
  group.add(placeholder)
  
  return group
}

/**
 * Load the actual train GLB and replace placeholder
 */
export async function loadSubwayTrainGLB(
  scene: THREE.Scene
): Promise<THREE.Group | null> {
  const loader = new GLTFLoader()
  
  // Setup Draco decoder for compressed meshes
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(DRACO_PATH)
  loader.setDRACOLoader(dracoLoader)
  
  try {
    const gltf = await loader.loadAsync(TRAIN_URL)
    const train = gltf.scene
    train.name = 'subway-train-glb'
    
    // Apply scale factor
    train.scale.setScalar(TRAIN_SCALE)
    
    // Recalculate bounds after scaling
    const box = new THREE.Box3().setFromObject(train)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    console.log('[TrainBuilder] Train size after scaling:', size)
    
    // Center horizontally and along track
    train.position.x = -center.x
    train.position.z = -center.z
    
    // Position train so its FLOOR is at Y=0 (level with main floor)
    // Train floor is ~15% up from bottom (wheels/undercarriage below)
    const trainFloorOffset = size.y * 0.15
    train.position.y = -box.min.y - trainFloorOffset
    
    console.log('[TrainBuilder] Train Y position:', train.position.y)
    
    // Count triangles and meshes for debugging
    let triangleCount = 0
    let meshCount = 0
    
    train.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCount++
        child.castShadow = false
        child.receiveShadow = true
        
        // Count triangles
        const geometry = child.geometry
        if (geometry.index) {
          triangleCount += geometry.index.count / 3
        } else if (geometry.attributes.position) {
          triangleCount += geometry.attributes.position.count / 3
        }
      }
    })
    
    console.log(`[TrainBuilder] Train stats: ${meshCount} meshes, ${triangleCount.toLocaleString()} triangles`)
    
    // Find and remove placeholder
    const placeholder = scene.getObjectByName('subway-train')
    if (placeholder) {
      scene.remove(placeholder)
      placeholder.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (obj.material instanceof THREE.Material) {
            obj.material.dispose()
          }
        }
      })
    }
    
    scene.add(train)
    console.log('[TrainBuilder] Train GLB loaded successfully')
    
    return train
  } catch (error) {
    console.error('[TrainBuilder] Failed to load train GLB:', error)
    return null
  }
}


/**
 * Place a pre-loaded train model in the scene
 * 
 * This is the preferred method when using MapLoader to pre-load assets.
 * The model is cloned, scaled, and positioned based on the config.
 * 
 * @param preloadedModel - The train model from LoadedMap.models.train
 * @param config - Arena configuration for positioning
 * @returns The positioned train group, or null if model is undefined
 */
export function placeSubwayTrain(
  preloadedModel: THREE.Group | undefined,
  _config: ArenaConfig // Reserved for future use (e.g., track-specific positioning)
): THREE.Group | null {
  if (!preloadedModel) {
    console.warn('[TrainBuilder] No pre-loaded train model provided')
    return null
  }

  // Clone the model so we don't modify the original
  const train = preloadedModel.clone()
  train.name = 'subway-train-glb'

  // Original train2-optimized.glb has correct orientation baked in
  // No rotation needed

  // Apply scale factor
  train.scale.setScalar(TRAIN_SCALE)

  // Recalculate bounds after scaling and rotation
  const box = new THREE.Box3().setFromObject(train)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  console.log('[TrainBuilder] Train size after scaling:', size)

  // Center horizontally and along track
  train.position.x = -center.x
  train.position.z = -center.z

  // Position train so its FLOOR is at Y=0 (level with main floor)
  // Train floor is ~15% up from bottom (wheels/undercarriage below)
  const trainFloorOffset = size.y * 0.15
  train.position.y = -box.min.y - trainFloorOffset

  console.log('[TrainBuilder] Train Y position:', train.position.y)

  // Count triangles and meshes for debugging
  let triangleCount = 0
  let meshCount = 0

  train.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshCount++
      child.castShadow = false
      child.receiveShadow = true

      // Count triangles
      const geometry = child.geometry
      if (geometry.index) {
        triangleCount += geometry.index.count / 3
      } else if (geometry.attributes.position) {
        triangleCount += geometry.attributes.position.count / 3
      }
    }
  })

  console.log(`[TrainBuilder] Train stats: ${meshCount} meshes, ${triangleCount.toLocaleString()} triangles`)

  return train
}
