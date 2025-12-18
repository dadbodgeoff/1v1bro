/**
 * MapLoader - Asset loading service for map definitions
 *
 * Loads all textures and models for a map definition and returns
 * a LoadedMap ready for use by ArenaScene.
 *
 * @module maps/MapLoader
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { Result } from '../core/Result';
import { Ok, Err } from '../core/Result';
import { MapRegistry } from './MapRegistry';
import type {
  MapDefinition,
  TextureAssets,
  ModelAssets,
} from './types';

// ============================================================================
// Types
// ============================================================================

/** Loaded texture assets */
export interface LoadedTextures {
  floor?: THREE.Texture;
  wall?: THREE.Texture;
  ceiling?: THREE.Texture;
  track?: THREE.Texture;
  tunnel?: THREE.Texture;
}

/** Loaded model assets */
export interface LoadedModels {
  train?: THREE.Group;
  subwayEntrance?: THREE.Group;
  cart?: THREE.Group;
  fareTerminal?: THREE.Group;
  bench?: THREE.Group;
  luggage?: THREE.Group;
  wallExpression?: THREE.Group;
}

/** Complete loaded map with all assets */
export interface LoadedMap {
  definition: MapDefinition;
  textures: LoadedTextures;
  models: LoadedModels;
}

/** Loading progress information */
export interface LoadProgress {
  loaded: number;
  total: number;
  currentAsset: string;
  phase: 'textures' | 'models';
}

/** Progress callback type */
export type ProgressCallback = (progress: LoadProgress) => void;

/** Map loading error types */
export type MapLoadErrorType =
  | 'MAP_NOT_FOUND'
  | 'TEXTURE_LOAD_ERROR'
  | 'MODEL_LOAD_ERROR'
  | 'NETWORK_ERROR';

/** Map loading error */
export interface MapLoadError {
  type: MapLoadErrorType;
  message: string;
  assetUrl?: string;
  cause?: Error;
}

// ============================================================================
// MapLoader
// ============================================================================

/** Draco decoder path for compressed GLB models */
const DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

/**
 * MapLoader service for loading map assets
 *
 * Usage:
 * ```typescript
 * const loader = new MapLoader();
 * const result = await loader.load('abandoned_terminal', (progress) => {
 *   console.log(`Loading: ${progress.currentAsset} (${progress.loaded}/${progress.total})`);
 * });
 *
 * if (result.ok) {
 *   const scene = new ArenaScene(result.value);
 * }
 * ```
 */
export class MapLoader {
  private textureLoader: THREE.TextureLoader;
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private loadErrors: MapLoadError[] = [];

  constructor() {
    this.textureLoader = new THREE.TextureLoader();

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(DRACO_PATH);

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  }

  /**
   * Load a map by ID from the registry
   */
  async load(
    mapId: string,
    onProgress?: ProgressCallback
  ): Promise<Result<LoadedMap, MapLoadError>> {
    this.loadErrors = [];

    // Get map definition from registry
    const registry = MapRegistry.getInstance();
    const definition = registry.get(mapId);

    if (!definition) {
      return Err({
        type: 'MAP_NOT_FOUND',
        message: `Map with id "${mapId}" not found in registry`,
      });
    }

    // Count total assets to load
    const textureCount = this.countAssets(definition.assets.textures);
    const modelCount = this.countAssets(definition.assets.models);
    const totalAssets = textureCount + modelCount;

    let loadedCount = 0;

    // Load textures
    const textures = await this.loadTextures(
      definition.assets.textures,
      (assetName) => {
        loadedCount++;
        onProgress?.({
          loaded: loadedCount,
          total: totalAssets,
          currentAsset: assetName,
          phase: 'textures',
        });
      }
    );

    // Load models
    const models = await this.loadModels(
      definition.assets.models,
      (assetName) => {
        loadedCount++;
        onProgress?.({
          loaded: loadedCount,
          total: totalAssets,
          currentAsset: assetName,
          phase: 'models',
        });
      }
    );

    // Log any errors that occurred during loading
    if (this.loadErrors.length > 0) {
      console.warn(
        `[MapLoader] ${this.loadErrors.length} asset(s) failed to load:`,
        this.loadErrors
      );
    }

    return Ok({
      definition,
      textures,
      models,
    });
  }

  /**
   * Get errors from the last load operation
   */
  getLoadErrors(): MapLoadError[] {
    return [...this.loadErrors];
  }

  /**
   * Count non-undefined assets in an asset object
   */
  private countAssets(assets: TextureAssets | ModelAssets): number {
    return Object.values(assets).filter((url) => url !== undefined).length;
  }

  /**
   * Load all textures from the asset manifest
   */
  private async loadTextures(
    assets: TextureAssets,
    onAssetLoaded: (name: string) => void
  ): Promise<LoadedTextures> {
    const results: LoadedTextures = {};
    const entries = Object.entries(assets) as [keyof TextureAssets, string | undefined][];

    const loadPromises = entries
      .filter(([, url]) => url !== undefined)
      .map(async ([key, url]) => {
        try {
          const texture = await this.loadTexture(url!);
          results[key] = texture;
        } catch (error) {
          this.loadErrors.push({
            type: 'TEXTURE_LOAD_ERROR',
            message: `Failed to load texture: ${key}`,
            assetUrl: url,
            cause: error instanceof Error ? error : new Error(String(error)),
          });
        }
        onAssetLoaded(key);
      });

    await Promise.all(loadPromises);
    return results;
  }

  /**
   * Load a single texture
   */
  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // Configure texture defaults
          texture.colorSpace = THREE.SRGBColorSpace;
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Load all models from the asset manifest
   */
  private async loadModels(
    assets: ModelAssets,
    onAssetLoaded: (name: string) => void
  ): Promise<LoadedModels> {
    const results: LoadedModels = {};
    const entries = Object.entries(assets) as [keyof ModelAssets, string | undefined][];

    const loadPromises = entries
      .filter(([, url]) => url !== undefined)
      .map(async ([key, url]) => {
        try {
          const model = await this.loadModel(url!);
          results[key] = model;
        } catch (error) {
          this.loadErrors.push({
            type: 'MODEL_LOAD_ERROR',
            message: `Failed to load model: ${key}`,
            assetUrl: url,
            cause: error instanceof Error ? error : new Error(String(error)),
          });
        }
        onAssetLoaded(key);
      });

    await Promise.all(loadPromises);
    return results;
  }

  /**
   * Load a single GLTF/GLB model
   */
  private loadModel(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf.scene);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Dispose of loaded resources
   */
  static disposeLoadedMap(loadedMap: LoadedMap): void {
    // Dispose textures
    for (const texture of Object.values(loadedMap.textures)) {
      if (texture) {
        texture.dispose();
      }
    }

    // Dispose models
    for (const model of Object.values(loadedMap.models)) {
      if (model) {
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else if (child.material) {
              child.material.dispose();
            }
          }
        });
      }
    }
  }

  /**
   * Dispose loader resources
   */
  dispose(): void {
    this.dracoLoader.dispose();
  }
}
