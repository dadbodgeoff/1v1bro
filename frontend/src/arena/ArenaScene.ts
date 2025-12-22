/**
 * ArenaScene - Assembles the complete arena with enterprise rendering
 *
 * Features:
 * - Procedural textures
 * - Environment mapping for reflections
 * - Optimized geometry batching
 * - Proper lighting setup with quality-based culling
 * - Data-driven map configuration via LoadedMap
 */

import * as THREE from 'three';
import type { LoadedMap } from './maps/MapLoader';
import { MapLoader } from './maps/MapLoader';
import {
  createArenaMaterials,
  disposeMaterials,
  type ArenaMaterials,
} from './materials/ArenaMaterials';
import {
  createFloor,
  createCeiling,
  createWalls,
  createHangingLights,
  createAmbientLighting,
  createTrackChannel,
  createPlatformEdges,
  placeSubwayTrain,
  placeSubwayEntrances,
  placeCarts,
  placeFareTerminals,
  placeWallExpressions,
  placeBenches,
  placeLuggageStacks,
  applyPreloadedFloorMaterial,
  applyPreloadedWallMaterial,
  applyPreloadedCeilingMaterial,
  applyPreloadedTrackTextures,
} from './geometry';
import { GeometryBatcher } from './rendering/GeometryBatcher';
import { getArenaQualityProfile } from './config/quality';

export interface ArenaSceneOptions {
  /** Override max lights (defaults to quality profile) */
  maxLights?: number;
}

export class ArenaScene {
  public readonly scene: THREE.Scene;
  private materials: ArenaMaterials;
  private arenaGroup: THREE.Group;
  private envMap: THREE.CubeTexture | null = null;
  private loadedMap: LoadedMap;
  private trainModel: THREE.Group | null = null;
  private options: ArenaSceneOptions;

  constructor(loadedMap: LoadedMap, options: ArenaSceneOptions = {}) {
    this.loadedMap = loadedMap;
    this.options = options;
    this.scene = new THREE.Scene();
    this.setupScene();

    this.materials = createArenaMaterials();
    this.arenaGroup = new THREE.Group();
    this.arenaGroup.name = 'arena';

    this.createEnvironmentMap();
    this.buildArena();
  }

  private setupScene(): void {
    const { arenaConfig } = this.loadedMap.definition;

    // Background - dark but not pure black
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Fog for depth
    this.scene.fog = new THREE.FogExp2(arenaConfig.colors.fog, 0.015);
  }


  /**
   * Create a simple environment map for reflections
   * In production, this would be a proper HDRI or baked cubemap
   */
  private createEnvironmentMap(): void {
    const { arenaConfig } = this.loadedMap.definition;

    // Create a simple gradient environment
    const envScene = new THREE.Scene();

    // Top - slightly warm
    const topGeo = new THREE.PlaneGeometry(100, 100);
    const topMat = new THREE.MeshBasicMaterial({
      color: 0x2a2520,
      side: THREE.DoubleSide,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 20;
    top.rotation.x = Math.PI / 2;
    envScene.add(top);

    // Bottom - floor reflection
    const bottomMat = new THREE.MeshBasicMaterial({
      color: 0x1a1815,
      side: THREE.DoubleSide,
    });
    const bottom = new THREE.Mesh(topGeo.clone(), bottomMat);
    bottom.position.y = -20;
    bottom.rotation.x = -Math.PI / 2;
    envScene.add(bottom);

    // Sides - ambient
    const sideMat = new THREE.MeshBasicMaterial({
      color: 0x15120f,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 4; i++) {
      const side = new THREE.Mesh(topGeo.clone(), sideMat);
      side.position.set(
        Math.cos((i * Math.PI) / 2) * 20,
        0,
        Math.sin((i * Math.PI) / 2) * 20
      );
      side.rotation.y = (i * Math.PI) / 2;
      envScene.add(side);
    }

    // Add some light spots for reflection highlights
    const lightSpotGeo = new THREE.CircleGeometry(2, 16);
    const lightSpotMat = new THREE.MeshBasicMaterial({ color: 0xfff5e6 });
    arenaConfig.lightPositions.forEach((pos) => {
      const spot = new THREE.Mesh(lightSpotGeo, lightSpotMat);
      spot.position.set(pos.x * 0.3, 15, pos.z * 0.3);
      spot.rotation.x = -Math.PI / 2;
      envScene.add(spot);
    });

    // We'll generate the cubemap in the viewer since we need a renderer
    // For now, store the scene for later
    this.envMap = null;

    // Apply to materials that need reflections
    if (this.materials.terrazzo.envMap !== this.envMap) {
      this.materials.terrazzo.envMap = this.envMap;
      this.materials.terrazzo.needsUpdate = true;
    }
  }

  /**
   * Generate environment map (call after renderer is available)
   */
  generateEnvMap(renderer: THREE.WebGLRenderer): void {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create a simple room environment
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x15120f);

    // Add ambient light representation
    const ambientColor = new THREE.Color(0x2a2520);
    envScene.add(new THREE.AmbientLight(ambientColor, 1));

    // Generate from scene
    const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;

    // Store for later use
    this.envMap = envMap as unknown as THREE.CubeTexture;

    // Apply to reflective materials
    this.materials.terrazzo.envMap = envMap;
    this.materials.terrazzo.envMapIntensity = 0.3;
    this.materials.terrazzo.needsUpdate = true;

    this.materials.lightFixture.envMap = envMap;
    this.materials.lightFixture.envMapIntensity = 0.5;
    this.materials.lightFixture.needsUpdate = true;

    // Apply to train if already loaded
    if (this.trainModel) {
      this.trainModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          for (const mat of materials) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.envMap = envMap;
              mat.envMapIntensity = 0.4;
              mat.needsUpdate = true;
            }
          }
        }
      });
    }

    pmremGenerator.dispose();
  }


  private buildArena(): void {
    const { definition, textures, models } = this.loadedMap;
    const { arenaConfig, lightingConfig, props } = definition;

    // Get max lights from options or quality profile
    const qualityProfile = getArenaQualityProfile();
    const maxLights = this.options.maxLights ?? qualityProfile.renderer.maxLights;

    // Create geometry using config from LoadedMap
    const floor = createFloor(this.materials, arenaConfig);
    const ceiling = createCeiling(this.materials, arenaConfig);
    const walls = createWalls(this.materials, arenaConfig);
    const trackChannel = createTrackChannel(this.materials, arenaConfig);
    const platformEdges = createPlatformEdges(this.materials, arenaConfig);
    // NOTE: Don't create placeholder train - we load GLB model directly
    const lights = createHangingLights(this.materials);
    // Pass maxLights for quality-based point light culling
    const ambientLighting = createAmbientLighting(lightingConfig, maxLights);

    // Batch static geometry for fewer draw calls
    // NOTE: Floor, walls, ceiling are NOT batched so we can apply textures to them
    // NOTE: Train is NOT batched - we use the GLB model directly
    const batcher = new GeometryBatcher();

    // Add static elements to batcher (excluding textured surfaces and train)
    batcher.addGroup(trackChannel);
    batcher.addGroup(platformEdges);

    // Build batched mesh
    const batchedStatic = batcher.build();
    this.arenaGroup.add(batchedStatic);

    // Add floor separately (unbatched) so we can swap its material
    this.arenaGroup.add(floor);

    // Add walls separately (unbatched) so we can apply wall texture
    this.arenaGroup.add(walls);

    // Add ceiling separately (unbatched) so we can apply ceiling texture
    this.arenaGroup.add(ceiling);

    // Add non-batched elements (lights need to stay separate for updates)
    this.arenaGroup.add(lights);
    this.arenaGroup.add(ambientLighting);

    this.scene.add(this.arenaGroup);

    // Log batching stats
    console.log('[ArenaScene] Geometry batched:', batcher.getStats());

    // Apply pre-loaded textures
    this.applyTextures(textures);

    // Place pre-loaded models
    this.placeModels(models, props);
  }

  /**
   * Apply pre-loaded textures to scene meshes
   */
  private applyTextures(textures: LoadedMap['textures']): void {
    const { arenaConfig } = this.loadedMap.definition;

    if (textures.floor) {
      applyPreloadedFloorMaterial(this.scene, textures.floor, arenaConfig);
    }

    if (textures.wall) {
      applyPreloadedWallMaterial(this.scene, textures.wall);
    }

    if (textures.ceiling) {
      applyPreloadedCeilingMaterial(this.scene, textures.ceiling);
    }

    if (textures.track || textures.tunnel) {
      applyPreloadedTrackTextures(
        this.scene,
        textures.track,
        textures.tunnel,
        arenaConfig
      );
    }
  }

  /**
   * Place pre-loaded models in the scene
   */
  private placeModels(
    models: LoadedMap['models'],
    props: LoadedMap['definition']['props']
  ): void {
    const { arenaConfig } = this.loadedMap.definition;

    // Find prop placements by asset key
    const getPropPlacement = (assetKey: string) =>
      props.find((p) => p.assetKey === assetKey);

    // Place train
    if (models.train) {
      const trainGroup = placeSubwayTrain(models.train, arenaConfig);
      if (trainGroup) {
        this.scene.add(trainGroup);
        this.trainModel = trainGroup;
      }
    }

    // Place subway entrances
    if (models.subwayEntrance) {
      const entrances = placeSubwayEntrances(models.subwayEntrance, arenaConfig);
      entrances.forEach((entrance) => this.scene.add(entrance));
    }

    // Place carts
    if (models.cart) {
      const cartPlacement = getPropPlacement('cart');
      const carts = placeCarts(models.cart, cartPlacement, arenaConfig);
      carts.forEach((cart) => this.scene.add(cart));
    }

    // Place fare terminals
    if (models.fareTerminal) {
      const terminalPlacement = getPropPlacement('fareTerminal');
      const terminals = placeFareTerminals(models.fareTerminal, terminalPlacement, arenaConfig);
      terminals.forEach((terminal) => this.scene.add(terminal));
    }

    // Place wall expressions
    if (models.wallExpression) {
      const wallPlacement = getPropPlacement('wallExpression');
      const walls = placeWallExpressions(models.wallExpression, wallPlacement);
      walls.forEach((wall) => this.scene.add(wall));
    }

    // Place benches
    if (models.bench) {
      const benchPlacement = getPropPlacement('bench');
      const benches = placeBenches(models.bench, benchPlacement);
      benches.forEach((bench) => this.scene.add(bench));
    }

    // Place luggage
    if (models.luggage) {
      const luggagePlacement = getPropPlacement('luggage');
      const luggage = placeLuggageStacks(models.luggage, luggagePlacement, arenaConfig);
      luggage.forEach((item) => this.scene.add(item));
    }
  }

  /**
   * Get arena bounds for camera constraints
   */
  getBounds(): THREE.Box3 {
    const bounds = new THREE.Box3();
    bounds.setFromObject(this.arenaGroup);
    return bounds;
  }

  /**
   * Get the loaded map definition
   */
  getMapDefinition(): LoadedMap['definition'] {
    return this.loadedMap.definition;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    disposeMaterials(this.materials);

    this.arenaGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });

    if (this.envMap) {
      this.envMap.dispose();
    }

    // Dispose loaded map resources
    MapLoader.disposeLoadedMap(this.loadedMap);

    this.scene.clear();
  }
}
