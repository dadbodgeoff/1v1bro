/**
 * CartBuilder - Loads underground cart GLB models
 * 
 * Places 2 carts on the tracks:
 * - 1 on the north side (front of train) - centered on track
 * - 1 on the south side (back of train) - centered on track
 * 
 * Carts are positioned parallel to the train, centered between train and walls.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { ARENA_CONFIG } from '../config/ArenaConfig'
import { DRACO_DECODER_PATH, type PropPlacement, type ArenaConfig } from '../maps/types'

// Cart model URL - optimized with WebP textures and Draco compression
// @deprecated Use MapLoader to load models instead
const CART_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena/underground-cart-optimized.glb'

// @deprecated Use DRACO_DECODER_PATH from maps/types.ts
const DRACO_PATH = DRACO_DECODER_PATH

// Cart positioning config
const CART_CONFIG = {
  // Train is ~13m long, centered at Z=0, so ends at Z = ±6.5
  // Walls are at Z = ±20 (depth/2)
  // Place carts centered between train ends and walls: (6.5 + 20) / 2 = 13.25
  northZ: -13.25,  // Centered between train front (Z=-6.5) and north wall (Z=-20)
  southZ: 13.25,   // Centered between train back (Z=6.5) and south wall (Z=20)
  
  // Y position - on the track bed (sunken)
  yOffset: -ARENA_CONFIG.tracks.depth,
  
  // Scale - reduced 30% from 3.5
  scale: 2.45,
}

/**
 * Load and place all underground carts
 */
export async function loadUndergroundCarts(scene: THREE.Scene): Promise<THREE.Group[]> {
  const loader = new GLTFLoader()
  
  // Setup Draco decoder
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(DRACO_PATH)
  loader.setDRACOLoader(dracoLoader)
  
  try {
    // Load the cart model once
    const gltf = await loader.loadAsync(CART_URL)
    const originalCart = gltf.scene
    
    // Get cart dimensions for logging
    const box = new THREE.Box3().setFromObject(originalCart)
    const size = box.getSize(new THREE.Vector3())
    console.log('[CartBuilder] Cart dimensions:', size)
    
    const carts: THREE.Group[] = []
    
    // Cart positions: [x, z, rotationY]
    // 2 carts total - one north, one south, both centered on track (X=0)
    const positions: [number, number, number][] = [
      // North side - centered on track, facing south
      [0, CART_CONFIG.northZ, Math.PI / 2],
      // South side - centered on track, facing north
      [0, CART_CONFIG.southZ, -Math.PI / 2],
    ]
    
    for (let i = 0; i < positions.length; i++) {
      const [x, z, rotY] = positions[i]
      
      // Clone the cart
      const cart = originalCart.clone()
      cart.name = `underground-cart-${i}`
      
      // Apply scale
      cart.scale.setScalar(CART_CONFIG.scale)
      
      // Position the cart
      // Center it on the track and place on track bed
      const cartBox = new THREE.Box3().setFromObject(cart)
      const cartCenter = cartBox.getCenter(new THREE.Vector3())
      
      cart.position.x = x - cartCenter.x
      cart.position.y = CART_CONFIG.yOffset - cartBox.min.y
      cart.position.z = z - cartCenter.z
      
      // Rotate to face the train
      cart.rotation.y = rotY
      
      // Setup shadows
      cart.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      scene.add(cart)
      carts.push(cart)
      
      console.log(`[CartBuilder] Cart ${i} placed at (${x.toFixed(1)}, ${CART_CONFIG.yOffset.toFixed(1)}, ${z.toFixed(1)})`)
    }
    
    console.log(`[CartBuilder] Loaded ${carts.length} underground carts`)
    return carts
    
  } catch (error) {
    console.error('[CartBuilder] Failed to load cart GLB:', error)
    return []
  }
}

/**
 * Create placeholder carts while GLB loads
 */
export function createCartPlaceholders(): THREE.Group {
  const group = new THREE.Group()
  group.name = 'cart-placeholders'
  
  const placeholderGeo = new THREE.BoxGeometry(1.5, 1, 2.5)
  const placeholderMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.7,
    metalness: 0.3,
    transparent: true,
    opacity: 0.3,
  })
  
  const positions: [number, number][] = [
    [0, CART_CONFIG.northZ],
    [0, CART_CONFIG.southZ],
  ]
  
  positions.forEach(([x, z], i) => {
    const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat)
    placeholder.position.set(x, CART_CONFIG.yOffset + 0.5, z)
    placeholder.name = `cart-placeholder-${i}`
    group.add(placeholder)
  })
  
  return group
}


/**
 * Place pre-loaded cart models using positions from props config
 * 
 * This is the preferred method when using MapLoader to pre-load assets.
 * 
 * @param preloadedModel - The cart model from LoadedMap.models.cart
 * @param propPlacement - The cart placement config from MapDefinition.props
 * @param config - Arena configuration for track depth
 * @returns Array of positioned cart groups
 */
export function placeCarts(
  preloadedModel: THREE.Group | undefined,
  propPlacement: PropPlacement | undefined,
  _config: ArenaConfig // Reserved for future use
): THREE.Group[] {
  if (!preloadedModel) {
    console.warn('[CartBuilder] No pre-loaded cart model provided')
    return []
  }

  if (!propPlacement || propPlacement.positions.length === 0) {
    console.warn('[CartBuilder] No cart positions provided')
    return []
  }

  const carts: THREE.Group[] = []

  // Get cart dimensions for logging
  const box = new THREE.Box3().setFromObject(preloadedModel)
  const size = box.getSize(new THREE.Vector3())
  console.log('[CartBuilder] Cart dimensions:', size)

  for (let i = 0; i < propPlacement.positions.length; i++) {
    const pos = propPlacement.positions[i]

    // Clone the cart
    const cart = preloadedModel.clone()
    cart.name = `underground-cart-${i}`

    // Apply scale from prop config
    cart.scale.setScalar(pos.scale)

    // Position the cart
    const cartBox = new THREE.Box3().setFromObject(cart)
    const cartCenter = cartBox.getCenter(new THREE.Vector3())

    cart.position.x = pos.x - cartCenter.x
    cart.position.y = pos.y - cartBox.min.y
    cart.position.z = pos.z - cartCenter.z

    // Apply rotation
    cart.rotation.y = pos.rotationY

    // Setup shadows
    cart.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    carts.push(cart)
    console.log(`[CartBuilder] Cart ${i} placed at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`)
  }

  console.log(`[CartBuilder] Placed ${carts.length} underground carts`)
  return carts
}
