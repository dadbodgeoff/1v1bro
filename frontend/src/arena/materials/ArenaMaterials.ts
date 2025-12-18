/**
 * ArenaMaterials - PBR materials with procedural textures
 * 
 * Enterprise-grade material system with:
 * - Procedural texture generation
 * - Normal mapping
 * - Proper PBR parameters
 * - Material disposal
 */

import * as THREE from 'three'
import { ARENA_CONFIG } from '../config/ArenaConfig'
import {
  generateTerrazzoTexture,
  generateWallTexture,
  generateNormalMap,
} from '../rendering/TextureLoader'

export interface ArenaMaterials {
  terrazzo: THREE.MeshStandardMaterial
  wall: THREE.MeshStandardMaterial
  ceiling: THREE.MeshStandardMaterial
  windowFrame: THREE.MeshStandardMaterial
  lightFixture: THREE.MeshStandardMaterial
  lightEmissive: THREE.MeshStandardMaterial
}

// Store textures for disposal
let cachedTextures: THREE.Texture[] = []

export function createArenaMaterials(): ArenaMaterials {
  const { colors } = ARENA_CONFIG
  
  // Generate procedural textures
  const terrazzoMap = generateTerrazzoTexture(1024)
  const terrazzoNormal = generateNormalMap(terrazzoMap, 0.5)
  terrazzoMap.repeat.set(4, 4)
  terrazzoNormal.repeat.set(4, 4)
  
  const wallMap = generateWallTexture(512)
  const wallNormal = generateNormalMap(wallMap, 0.8)
  wallMap.repeat.set(2, 1)
  wallNormal.repeat.set(2, 1)
  
  // Cache for disposal
  cachedTextures = [terrazzoMap, terrazzoNormal, wallMap, wallNormal]
  
  return {
    // Terrazzo floor - polished with subtle reflection
    terrazzo: new THREE.MeshStandardMaterial({
      map: terrazzoMap,
      normalMap: terrazzoNormal,
      normalScale: new THREE.Vector2(0.3, 0.3),
      roughness: 0.25,
      metalness: 0.05,
      envMapIntensity: 0.5,
    }),
    
    // Walls - aged plaster/concrete with texture
    wall: new THREE.MeshStandardMaterial({
      map: wallMap,
      normalMap: wallNormal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.85,
      metalness: 0.0,
    }),
    
    // Ceiling - dark, matte
    ceiling: new THREE.MeshStandardMaterial({
      color: colors.ceiling,
      roughness: 0.95,
      metalness: 0.0,
    }),
    
    // Window frame - dark metal
    windowFrame: new THREE.MeshStandardMaterial({
      color: colors.windowFrame,
      roughness: 0.5,
      metalness: 0.4,
    }),
    
    // Light fixture metal
    lightFixture: new THREE.MeshStandardMaterial({
      color: colors.lightFixture,
      roughness: 0.3,
      metalness: 0.7,
    }),
    
    // Emissive light bulb
    lightEmissive: new THREE.MeshStandardMaterial({
      color: colors.lightEmissive,
      emissive: colors.lightEmissive,
      emissiveIntensity: 3,
      toneMapped: false, // Prevent tone mapping from dimming
    }),
  }
}

export function disposeMaterials(materials: ArenaMaterials): void {
  // Dispose materials
  Object.values(materials).forEach(mat => {
    if (mat.map) mat.map.dispose()
    if (mat.normalMap) mat.normalMap.dispose()
    mat.dispose()
  })
  
  // Dispose cached textures
  cachedTextures.forEach(tex => tex.dispose())
  cachedTextures = []
}
