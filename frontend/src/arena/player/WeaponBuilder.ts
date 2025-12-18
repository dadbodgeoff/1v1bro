/**
 * WeaponBuilder - First-person weapon system
 * 
 * Loads weapon models and attaches them to the camera for FPS view.
 * Handles weapon positioning, animations (recoil, bob), and switching.
 * 
 * Weapons are rendered in a separate layer to prevent clipping with world geometry.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const SUPABASE_BASE = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena'

/**
 * Weapon definition with stats and positioning
 */
export interface WeaponDefinition {
  id: string
  name: string
  modelUrl: string
  
  // Position relative to camera (right-hand side of screen)
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: number
  
  // Combat stats
  damage: number
  fireRate: number      // Rounds per second
  magazineSize: number
  reloadTime: number    // Seconds
  
  // Animation params
  recoilAmount: number  // How much gun kicks back
  recoilRecovery: number // How fast it returns
}

/**
 * Built-in weapon definitions
 */
export const WEAPONS: Record<string, WeaponDefinition> = {
  'ak-47': {
    id: 'ak-47',
    name: 'AK-47',
    modelUrl: `${SUPABASE_BASE}/ak-47.glb`,
    position: new THREE.Vector3(0.25, -0.2, -0.5),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: 0.15,
    damage: 8,
    fireRate: 10,
    magazineSize: 30,
    reloadTime: 2.5,
    recoilAmount: 0.02,
    recoilRecovery: 8,
  },
  'raygun': {
    id: 'raygun',
    name: 'Raygun',
    modelUrl: `${SUPABASE_BASE}/raygun.glb`,
    position: new THREE.Vector3(0.2, -0.15, -0.4),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: 0.12,
    damage: 8,
    fireRate: 15,
    magazineSize: 50,
    reloadTime: 1.5,
    recoilAmount: 0.01,
    recoilRecovery: 12,
  },
}

/**
 * Weapon state for animations
 */
interface WeaponState {
  recoilOffset: number
  bobPhase: number
  bobOffset: THREE.Vector3
  isReloading: boolean
  reloadProgress: number
}

/**
 * WeaponBuilder - Manages first-person weapon rendering
 */
export class WeaponBuilder {
  private loader: GLTFLoader
  private weaponGroup: THREE.Group
  private currentWeapon: THREE.Group | null = null
  private currentDefinition: WeaponDefinition | null = null
  private state: WeaponState
  
  // Weapon layer (renders on top of world)
  public static readonly WEAPON_LAYER = 1
  
  constructor() {
    // Setup GLTF loader with Draco compression
    this.loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    this.loader.setDRACOLoader(dracoLoader)
    
    // Create weapon container group
    this.weaponGroup = new THREE.Group()
    this.weaponGroup.name = 'weapon-container'
    this.weaponGroup.layers.set(WeaponBuilder.WEAPON_LAYER)
    
    // Initialize state
    this.state = {
      recoilOffset: 0,
      bobPhase: 0,
      bobOffset: new THREE.Vector3(),
      isReloading: false,
      reloadProgress: 0,
    }
  }
  
  /**
   * Get the weapon group to attach to camera
   */
  getWeaponGroup(): THREE.Group {
    return this.weaponGroup
  }
  
  /**
   * Load and equip a weapon
   */
  async equipWeapon(weaponId: string): Promise<void> {
    const definition = WEAPONS[weaponId]
    if (!definition) {
      console.error(`[WeaponBuilder] Unknown weapon: ${weaponId}`)
      return
    }
    
    // Remove current weapon
    if (this.currentWeapon) {
      this.weaponGroup.remove(this.currentWeapon)
      this.disposeModel(this.currentWeapon)
      this.currentWeapon = null
    }
    
    try {
      console.log(`[WeaponBuilder] Loading weapon: ${definition.name}`)
      const gltf = await this.loader.loadAsync(definition.modelUrl)
      
      const model = gltf.scene
      model.name = `weapon-${weaponId}`
      
      // Apply transforms from definition
      model.position.copy(definition.position)
      model.rotation.copy(definition.rotation)
      model.scale.setScalar(definition.scale)
      
      // Set all meshes to weapon layer
      model.traverse((child) => {
        child.layers.set(WeaponBuilder.WEAPON_LAYER)
        if (child instanceof THREE.Mesh) {
          // Ensure materials render properly
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.envMapIntensity = 0.5
          }
        }
      })
      
      this.weaponGroup.add(model)
      this.currentWeapon = model
      this.currentDefinition = definition
      
      // Reset state
      this.state.recoilOffset = 0
      this.state.isReloading = false
      
      console.log(`[WeaponBuilder] Equipped: ${definition.name}`)
    } catch (err) {
      console.error(`[WeaponBuilder] Failed to load weapon:`, err)
    }
  }
  
  /**
   * Trigger recoil animation (call on fire)
   */
  triggerRecoil(): void {
    if (!this.currentDefinition) return
    this.state.recoilOffset = this.currentDefinition.recoilAmount
  }
  
  /**
   * Start reload animation
   */
  startReload(): void {
    if (this.state.isReloading) return
    this.state.isReloading = true
    this.state.reloadProgress = 0
  }
  
  /**
   * Update weapon animations
   * @param deltaTime Time since last frame in seconds
   * @param isMoving Whether player is moving
   * @param moveSpeed Current movement speed
   */
  update(deltaTime: number, isMoving: boolean, moveSpeed: number): void {
    if (!this.currentWeapon || !this.currentDefinition) return
    
    // Recoil recovery
    if (this.state.recoilOffset > 0) {
      this.state.recoilOffset -= this.currentDefinition.recoilRecovery * deltaTime
      if (this.state.recoilOffset < 0) this.state.recoilOffset = 0
    }
    
    // View bob when moving
    if (isMoving && moveSpeed > 0.1) {
      this.state.bobPhase += moveSpeed * deltaTime * 10
      this.state.bobOffset.x = Math.sin(this.state.bobPhase) * 0.005
      this.state.bobOffset.y = Math.abs(Math.sin(this.state.bobPhase * 2)) * 0.003
    } else {
      // Smoothly return to center
      this.state.bobOffset.multiplyScalar(0.9)
      this.state.bobPhase = 0
    }
    
    // Reload animation
    if (this.state.isReloading) {
      this.state.reloadProgress += deltaTime / this.currentDefinition.reloadTime
      if (this.state.reloadProgress >= 1) {
        this.state.isReloading = false
        this.state.reloadProgress = 0
      }
    }
    
    // Apply transforms
    const basePos = this.currentDefinition.position.clone()
    
    // Add recoil (push back on Z)
    basePos.z += this.state.recoilOffset
    
    // Add bob
    basePos.add(this.state.bobOffset)
    
    // Reload animation (lower weapon)
    if (this.state.isReloading) {
      const reloadCurve = Math.sin(this.state.reloadProgress * Math.PI)
      basePos.y -= reloadCurve * 0.15
      basePos.z -= reloadCurve * 0.1
    }
    
    this.currentWeapon.position.copy(basePos)
  }
  
  /**
   * Get current weapon definition
   */
  getCurrentWeapon(): WeaponDefinition | null {
    return this.currentDefinition
  }
  
  /**
   * Check if currently reloading
   */
  isReloading(): boolean {
    return this.state.isReloading
  }
  
  /**
   * Dispose of a model and its resources
   */
  private disposeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    if (this.currentWeapon) {
      this.disposeModel(this.currentWeapon)
      this.currentWeapon = null
    }
    this.currentDefinition = null
  }
}

/**
 * Setup camera to render weapon layer
 * Call this after creating your camera
 */
export function setupWeaponCamera(
  renderer: THREE.WebGLRenderer,
  _scene: THREE.Scene, // Kept for API compatibility, not used (weapons render in separate scene)
  camera: THREE.PerspectiveCamera,
  weaponBuilder: WeaponBuilder
): { renderWeapon: () => void; dispose: () => void } {
  // Create a separate scene for weapons to avoid layer conflicts
  const weaponScene = new THREE.Scene()
  weaponScene.name = 'weapon-scene'
  
  // Create a separate camera for weapons with different near plane
  // This prevents weapons from clipping into walls
  const weaponCamera = new THREE.PerspectiveCamera(
    camera.fov,
    camera.aspect,
    0.01,  // Very close near plane for weapons
    10     // Short far plane - weapons are close
  )
  
  // Attach weapon group to weapon camera
  weaponCamera.add(weaponBuilder.getWeaponGroup())
  weaponScene.add(weaponCamera)
  
  // Add some ambient light to weapon scene so it's visible
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  weaponScene.add(ambientLight)
  
  // Add directional light for weapon highlights
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(1, 1, 1)
  weaponScene.add(dirLight)
  
  // Handle resize
  const handleResize = () => {
    weaponCamera.aspect = camera.aspect
    weaponCamera.updateProjectionMatrix()
  }
  window.addEventListener('resize', handleResize)
  
  // Return render function and cleanup
  const renderWeapon = () => {
    // Sync weapon camera with main camera orientation
    weaponCamera.position.set(0, 0, 0)
    weaponCamera.quaternion.copy(camera.quaternion)
    
    // Render weapon scene on top (clear depth only, preserve color)
    const oldAutoClear = renderer.autoClear
    renderer.autoClear = false
    renderer.clearDepth()
    renderer.render(weaponScene, weaponCamera)
    renderer.autoClear = oldAutoClear
  }
  
  // Return object with render function and cleanup
  return {
    renderWeapon,
    dispose: () => {
      window.removeEventListener('resize', handleResize)
      weaponScene.remove(weaponCamera)
      ambientLight.dispose()
      dirLight.dispose()
      weaponBuilder.dispose()
    }
  }
}
