/**
 * Arena Character Loader
 * 
 * Handles loading 3D character models and animations from Supabase storage.
 * Supports progressive loading with priority-based animation loading.
 */

import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { 
  type ArenaCharacterSkin, 
  type ArenaAnimationName,
  getAnimationsByPriority,
  DEFAULT_ARENA_SKIN 
} from './ArenaCharacterConfig'

export interface LoadProgress {
  phase: 'model' | 'animations'
  loaded: number
  total: number
  currentAsset?: string
}

export interface LoadedCharacter {
  /** The character's 3D scene/model */
  model: THREE.Group
  /** Animation mixer for this character */
  mixer: THREE.AnimationMixer
  /** Loaded animation clips keyed by name */
  animations: Map<ArenaAnimationName, THREE.AnimationClip>
  /** The skin configuration used */
  skin: ArenaCharacterSkin
}

/**
 * Loads arena character models and animations
 */
export class ArenaCharacterLoader {
  private gltfLoader: GLTFLoader
  private loadedCharacters: Map<string, LoadedCharacter> = new Map()

  constructor() {
    this.gltfLoader = new GLTFLoader()
    // Enable meshopt decoder for compressed GLB files
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder)
  }

  /**
   * Load a character with all animations
   * 
   * @param skin - Character skin configuration (defaults to DEFAULT_ARENA_SKIN)
   * @param onProgress - Progress callback
   * @returns Loaded character with model and animations
   */
  async loadCharacter(
    skin: ArenaCharacterSkin = DEFAULT_ARENA_SKIN,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<LoadedCharacter> {
    // Check cache first
    const cached = this.loadedCharacters.get(skin.id)
    if (cached) {
      // Clone the model for new instances
      return {
        ...cached,
        model: cached.model.clone(),
        mixer: new THREE.AnimationMixer(cached.model.clone()),
      }
    }

    const animations = new Map<ArenaAnimationName, THREE.AnimationClip>()

    // Phase 1: Load base model
    onProgress?.({ phase: 'model', loaded: 0, total: 1, currentAsset: 'Base Model' })
    
    const baseGltf = await this.loadGLTF(skin.baseModel)
    const model = baseGltf.scene

    // Extract any animations from base model
    if (baseGltf.animations.length > 0) {
      // Assume first animation is idle if present
      animations.set('idle', baseGltf.animations[0])
    }

    onProgress?.({ phase: 'model', loaded: 1, total: 1 })

    // Phase 2: Load animations by priority
    const animsToLoad = getAnimationsByPriority(skin)
    const totalAnims = animsToLoad.length

    for (let i = 0; i < animsToLoad.length; i++) {
      const { name, url } = animsToLoad[i]
      
      onProgress?.({ 
        phase: 'animations', 
        loaded: i, 
        total: totalAnims, 
        currentAsset: name 
      })

      try {
        const animGltf = await this.loadGLTF(url)
        if (animGltf.animations.length > 0) {
          // Use the first animation clip from the file
          const clip = animGltf.animations[0]
          clip.name = name // Rename to our standard name
          animations.set(name, clip)
        }
      } catch (err) {
        console.warn(`[ArenaCharacterLoader] Failed to load animation ${name}:`, err)
        // Continue loading other animations
      }
    }

    onProgress?.({ phase: 'animations', loaded: totalAnims, total: totalAnims })

    // Create mixer
    const mixer = new THREE.AnimationMixer(model)

    const loadedCharacter: LoadedCharacter = {
      model,
      mixer,
      animations,
      skin,
    }

    // Cache for reuse
    this.loadedCharacters.set(skin.id, loadedCharacter)

    return loadedCharacter
  }

  /**
   * Load just the essential animations for quick start
   * (idle, run, shoot, death)
   */
  async loadEssentials(
    skin: ArenaCharacterSkin = DEFAULT_ARENA_SKIN,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<LoadedCharacter> {
    const essentialAnims: ArenaAnimationName[] = ['idle', 'run', 'shoot', 'death', 'jump']
    const animations = new Map<ArenaAnimationName, THREE.AnimationClip>()

    // Load base model
    onProgress?.({ phase: 'model', loaded: 0, total: 1, currentAsset: 'Base Model' })
    const baseGltf = await this.loadGLTF(skin.baseModel)
    const model = baseGltf.scene
    onProgress?.({ phase: 'model', loaded: 1, total: 1 })

    // Load only essential animations
    const totalAnims = essentialAnims.length
    for (let i = 0; i < essentialAnims.length; i++) {
      const name = essentialAnims[i]
      const url = skin.animations[name]
      
      if (!url) continue

      onProgress?.({ 
        phase: 'animations', 
        loaded: i, 
        total: totalAnims, 
        currentAsset: name 
      })

      try {
        const animGltf = await this.loadGLTF(url)
        if (animGltf.animations.length > 0) {
          const clip = animGltf.animations[0]
          clip.name = name
          animations.set(name, clip)
        }
      } catch (err) {
        console.warn(`[ArenaCharacterLoader] Failed to load essential animation ${name}:`, err)
      }
    }

    onProgress?.({ phase: 'animations', loaded: totalAnims, total: totalAnims })

    const mixer = new THREE.AnimationMixer(model)

    return {
      model,
      mixer,
      animations,
      skin,
    }
  }

  /**
   * Load remaining animations after essentials
   * Call this after game starts to load non-critical animations
   */
  async loadRemaining(
    character: LoadedCharacter,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<void> {
    const allAnims = getAnimationsByPriority(character.skin)
    const remaining = allAnims.filter(a => !character.animations.has(a.name))

    for (let i = 0; i < remaining.length; i++) {
      const { name, url } = remaining[i]

      onProgress?.({
        phase: 'animations',
        loaded: i,
        total: remaining.length,
        currentAsset: name,
      })

      try {
        const animGltf = await this.loadGLTF(url)
        if (animGltf.animations.length > 0) {
          const clip = animGltf.animations[0]
          clip.name = name
          character.animations.set(name, clip)
        }
      } catch (err) {
        console.warn(`[ArenaCharacterLoader] Failed to load animation ${name}:`, err)
      }
    }

    onProgress?.({ phase: 'animations', loaded: remaining.length, total: remaining.length })
  }

  /**
   * Clear cached characters
   */
  clearCache(): void {
    this.loadedCharacters.clear()
  }

  /**
   * Load a GLTF file
   */
  private loadGLTF(url: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      )
    })
  }
}

// Singleton instance for convenience
export const arenaCharacterLoader = new ArenaCharacterLoader()
