/**
 * ArenaScene - Assembles the complete arena with enterprise rendering
 * 
 * Features:
 * - Procedural textures
 * - Environment mapping for reflections
 * - Optimized geometry batching
 * - Proper lighting setup
 */

import * as THREE from 'three'
import { ARENA_CONFIG } from './config/ArenaConfig'
import { AbandonedTerminalMap } from './maps/definitions/AbandonedTerminalMap'
import { createArenaMaterials, disposeMaterials, type ArenaMaterials } from './materials/ArenaMaterials'
import {
  createFloor,
  createCeiling,
  createWalls,
  createHangingLights,
  createAmbientLighting,
  createTrackChannel,
  createPlatformEdges,
  createSubwayTrain,
  loadSubwayTrainGLB,
  loadSubwayEntrancesGLB,
  loadUndergroundCarts,
  loadFareTerminals,
  applyFloorMaterial,
  loadArenaProps,
  loadTrackTextures,
  applyWallMaterial,
  applyCeilingMaterial,
  loadLuggageStacks,
} from './geometry'
import { GeometryBatcher } from './rendering/GeometryBatcher'

export class ArenaScene {
  public readonly scene: THREE.Scene
  private materials: ArenaMaterials
  private arenaGroup: THREE.Group
  private envMap: THREE.CubeTexture | null = null
  
  constructor() {
    this.scene = new THREE.Scene()
    this.setupScene()
    
    this.materials = createArenaMaterials()
    this.arenaGroup = new THREE.Group()
    this.arenaGroup.name = 'arena'
    
    this.createEnvironmentMap()
    this.buildArena()
  }
  
  private setupScene(): void {
    // Background - dark but not pure black
    this.scene.background = new THREE.Color(0x0a0a0a)
    
    // Fog for depth
    this.scene.fog = new THREE.FogExp2(ARENA_CONFIG.colors.fog, 0.015)
  }
  
  /**
   * Create a simple environment map for reflections
   * In production, this would be a proper HDRI or baked cubemap
   */
  private createEnvironmentMap(): void {
    // Create a simple gradient environment
    const envScene = new THREE.Scene()
    
    // Top - slightly warm
    const topGeo = new THREE.PlaneGeometry(100, 100)
    const topMat = new THREE.MeshBasicMaterial({ color: 0x2a2520, side: THREE.DoubleSide })
    const top = new THREE.Mesh(topGeo, topMat)
    top.position.y = 20
    top.rotation.x = Math.PI / 2
    envScene.add(top)
    
    // Bottom - floor reflection
    const bottomMat = new THREE.MeshBasicMaterial({ color: 0x1a1815, side: THREE.DoubleSide })
    const bottom = new THREE.Mesh(topGeo.clone(), bottomMat)
    bottom.position.y = -20
    bottom.rotation.x = -Math.PI / 2
    envScene.add(bottom)
    
    // Sides - ambient
    const sideMat = new THREE.MeshBasicMaterial({ color: 0x15120f, side: THREE.DoubleSide })
    for (let i = 0; i < 4; i++) {
      const side = new THREE.Mesh(topGeo.clone(), sideMat)
      side.position.set(
        Math.cos(i * Math.PI / 2) * 20,
        0,
        Math.sin(i * Math.PI / 2) * 20
      )
      side.rotation.y = i * Math.PI / 2
      envScene.add(side)
    }
    
    // Add some light spots for reflection highlights
    const lightSpotGeo = new THREE.CircleGeometry(2, 16)
    const lightSpotMat = new THREE.MeshBasicMaterial({ color: 0xfff5e6 })
    ARENA_CONFIG.lightPositions.forEach(pos => {
      const spot = new THREE.Mesh(lightSpotGeo, lightSpotMat)
      spot.position.set(pos.x * 0.3, 15, pos.z * 0.3)
      spot.rotation.x = -Math.PI / 2
      envScene.add(spot)
    })
    
    // We'll generate the cubemap in the viewer since we need a renderer
    // For now, store the scene for later
    this.envMap = null
    
    // Apply to materials that need reflections
    if (this.materials.terrazzo.envMap !== this.envMap) {
      this.materials.terrazzo.envMap = this.envMap
      this.materials.terrazzo.needsUpdate = true
    }
  }
  
  /**
   * Generate environment map (call after renderer is available)
   */
  generateEnvMap(renderer: THREE.WebGLRenderer): void {
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    
    // Create a simple room environment
    const envScene = new THREE.Scene()
    envScene.background = new THREE.Color(0x15120f)
    
    // Add ambient light representation
    const ambientColor = new THREE.Color(0x2a2520)
    envScene.add(new THREE.AmbientLight(ambientColor, 1))
    
    // Generate from scene
    const envMap = pmremGenerator.fromScene(envScene, 0.04).texture
    
    // Store for later use
    this.envMap = envMap as unknown as THREE.CubeTexture
    
    // Apply to reflective materials
    this.materials.terrazzo.envMap = envMap
    this.materials.terrazzo.envMapIntensity = 0.3
    this.materials.terrazzo.needsUpdate = true
    
    this.materials.lightFixture.envMap = envMap
    this.materials.lightFixture.envMapIntensity = 0.5
    this.materials.lightFixture.needsUpdate = true
    
    // Apply to train if already loaded
    const trainModel = (this as { trainModel?: THREE.Group }).trainModel
    if (trainModel) {
      trainModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          for (const mat of materials) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.envMap = envMap
              mat.envMapIntensity = 0.4
              mat.needsUpdate = true
            }
          }
        }
      })
    }
    
    pmremGenerator.dispose()
  }
  
  private buildArena(): void {
    // Create geometry using ARENA_CONFIG
    const floor = createFloor(this.materials, ARENA_CONFIG)
    const ceiling = createCeiling(this.materials, ARENA_CONFIG)
    const walls = createWalls(this.materials, ARENA_CONFIG)
    const trackChannel = createTrackChannel(this.materials, ARENA_CONFIG)
    const platformEdges = createPlatformEdges(this.materials, ARENA_CONFIG)
    const subwayTrain = createSubwayTrain()
    const lights = createHangingLights(this.materials)
    const ambientLighting = createAmbientLighting(AbandonedTerminalMap.lightingConfig)
    
    // Batch static geometry for fewer draw calls
    // NOTE: Floor, walls, ceiling are NOT batched so we can apply textures to them
    const batcher = new GeometryBatcher()
    
    // Add static elements to batcher (excluding textured surfaces)
    batcher.addGroup(trackChannel)
    batcher.addGroup(platformEdges)
    batcher.addGroup(subwayTrain)
    
    // Build batched mesh
    const batchedStatic = batcher.build()
    this.arenaGroup.add(batchedStatic)
    
    // Add floor separately (unbatched) so we can swap its material
    this.arenaGroup.add(floor)
    
    // Add walls separately (unbatched) so we can apply wall texture
    this.arenaGroup.add(walls)
    
    // Add ceiling separately (unbatched) so we can apply ceiling texture
    this.arenaGroup.add(ceiling)
    
    // Add non-batched elements (lights need to stay separate for updates)
    this.arenaGroup.add(lights)
    this.arenaGroup.add(ambientLighting)
    
    this.scene.add(this.arenaGroup)
    
    // Log batching stats
    console.log('[ArenaScene] Geometry batched:', batcher.getStats())
    
    // Load GLB models asynchronously
    this.loadTrainModel()
    this.loadSubwayEntrances()
    this.loadCarts()
    this.loadTerminals()
    this.loadFloorMaterial()
    this.loadWallMaterial()
    this.loadCeilingMaterial()
    this.loadProps()
    this.loadTrackTextures()
    this.loadLuggage()
  }

  /**
   * Load decorative props (walls, benches)
   */
  private async loadProps(): Promise<void> {
    try {
      await loadArenaProps(this.scene)
    } catch (error) {
      console.error('[ArenaScene] Failed to load props:', error)
    }
  }

  /**
   * Load luggage stacks for cover
   */
  private async loadLuggage(): Promise<void> {
    try {
      await loadLuggageStacks(this.scene)
    } catch (error) {
      console.error('[ArenaScene] Failed to load luggage:', error)
    }
  }

  /**
   * Load track bed texture and tunnel entrance walls
   */
  private async loadTrackTextures(): Promise<void> {
    try {
      await loadTrackTextures(this.scene)
    } catch (error) {
      console.error('[ArenaScene] Failed to load track textures:', error)
    }
  }

  /**
   * Load wall texture and apply to arena walls
   */
  private async loadWallMaterial(): Promise<void> {
    try {
      await applyWallMaterial(this.scene)
    } catch (error) {
      console.error('[ArenaScene] Failed to load wall material:', error)
    }
  }

  /**
   * Load ceiling texture and apply to ceiling
   */
  private async loadCeilingMaterial(): Promise<void> {
    try {
      await applyCeilingMaterial(this.scene)
    } catch (error) {
      console.error('[ArenaScene] Failed to load ceiling material:', error)
    }
  }
  
  /**
   * Load floor tile GLB and apply material to floor meshes
   */
  private async loadFloorMaterial(): Promise<void> {
    try {
      await applyFloorMaterial(this.scene)
    } catch (error) {
      console.error('[ArenaScene] Failed to load floor material:', error)
    }
  }
  
  /**
   * Load the train GLB model asynchronously
   */
  private async loadTrainModel(): Promise<void> {
    try {
      const train = await loadSubwayTrainGLB(this.scene)
      if (train) {
        (this as { trainModel?: THREE.Group }).trainModel = train
      }
    } catch (error) {
      console.error('[ArenaScene] Failed to load train model:', error)
    }
  }
  
  /**
   * Load subway entrance GLB models asynchronously
   */
  private async loadSubwayEntrances(): Promise<void> {
    try {
      await loadSubwayEntrancesGLB(this.scene)
    } catch (error) {
      console.error('[ArenaScene] Failed to load subway entrances:', error)
    }
  }
  
  /**
   * Load underground cart GLB models asynchronously
   */
  private async loadCarts(): Promise<void> {
    try {
      await loadUndergroundCarts(this.scene)
    } catch (error) {
      console.error('[ArenaScene] Failed to load underground carts:', error)
    }
  }
  
  /**
   * Load fare terminal GLB models asynchronously
   */
  private async loadTerminals(): Promise<void> {
    try {
      await loadFareTerminals(this.scene)
    } catch (error) {
      console.error('[ArenaScene] Failed to load fare terminals:', error)
    }
  }
  
  /**
   * Get arena bounds for camera constraints
   */
  getBounds(): THREE.Box3 {
    const bounds = new THREE.Box3()
    bounds.setFromObject(this.arenaGroup)
    return bounds
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    disposeMaterials(this.materials)
    
    this.arenaGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
      }
    })
    
    if (this.envMap) {
      this.envMap.dispose()
    }
    
    this.scene.clear()
  }
}
