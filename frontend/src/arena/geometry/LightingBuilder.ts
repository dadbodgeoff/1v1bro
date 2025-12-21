/**
 * LightingBuilder - AAA Abandoned Subway Lighting (v2)
 *
 * Design: Moody, atmospheric lighting for an abandoned underground station
 * - Dim ambient with strategic accent pools
 * - Emergency/utility light sources (not decorative fixtures)
 * - Strong contrast for dramatic shadows
 * - Cool/warm color temperature contrast
 * - Rim light for player silhouette separation (critical for PvP)
 * - Priority-based point light culling for performance
 * - Optimized: minimal shadow-casters, efficient light count
 */

import * as THREE from 'three'
import type { ArenaMaterials } from '../materials/ArenaMaterials'
import type { LightingConfig } from '../maps/types'
import { POINT_LIGHT_PRIORITY } from '../maps/types'

/**
 * Get the maximum number of point lights for a quality tier
 */
function getMaxPointLightsForTier(maxLights: number): number {
  // Reserve 3-4 lights for ambient/hemisphere/key/fill/rim
  // The rest can be point lights
  return Math.max(0, maxLights - 4)
}

/**
 * Filter and sort point lights by priority for quality-based culling
 */
function cullPointLightsByPriority(
  pointLights: LightingConfig['pointLights'],
  maxPointLights: number
): LightingConfig['pointLights'] {
  if (pointLights.length <= maxPointLights) {
    return pointLights
  }

  // Sort by priority (lower number = higher priority)
  const sorted = [...pointLights].sort((a, b) => {
    const priorityA = POINT_LIGHT_PRIORITY[a.type] ?? 99
    const priorityB = POINT_LIGHT_PRIORITY[b.type] ?? 99
    return priorityA - priorityB
  })

  return sorted.slice(0, maxPointLights)
}

/**
 * Create the complete abandoned subway lighting rig
 * No decorative fixtures - just atmospheric light sources
 *
 * @param config - LightingConfig containing all light definitions
 * @param maxLights - Optional max lights from quality profile (default: unlimited)
 */
export function createAmbientLighting(config: LightingConfig, maxLights?: number): THREE.Group {
  const group = new THREE.Group()
  group.name = 'ambient-lighting'

  // ========================================
  // BASE AMBIENT (Power is mostly off)
  // ========================================

  const ambient = new THREE.AmbientLight(config.ambient.color, config.ambient.intensity)
  ambient.name = 'ambient-light'
  group.add(ambient)

  const hemi = new THREE.HemisphereLight(
    config.hemisphere.skyColor,
    config.hemisphere.groundColor,
    config.hemisphere.intensity
  )
  hemi.name = 'hemisphere-light'
  group.add(hemi)

  // ========================================
  // KEY LIGHT (Light bleeding from surface)
  // ========================================
  // Simulates daylight coming through vents/grates above

  const keyLight = new THREE.DirectionalLight(config.keyLight.color, config.keyLight.intensity)
  keyLight.position.set(
    config.keyLight.position.x,
    config.keyLight.position.y,
    config.keyLight.position.z
  )
  keyLight.castShadow = config.keyLight.castShadow ?? true
  keyLight.shadow.mapSize.width = config.keyLight.shadowMapSize ?? 2048
  keyLight.shadow.mapSize.height = config.keyLight.shadowMapSize ?? 2048
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 50
  // Tighter frustum for better shadow texel density
  keyLight.shadow.camera.left = -20
  keyLight.shadow.camera.right = 20
  keyLight.shadow.camera.top = 20
  keyLight.shadow.camera.bottom = -20
  keyLight.shadow.bias = config.keyLight.shadowBias ?? -0.00025
  keyLight.shadow.radius = 2.5 // Tighter penumbra for sharper silhouettes
  keyLight.name = 'key-light'
  group.add(keyLight)

  // ========================================
  // FILL LIGHT (Bounce/secondary source)
  // ========================================

  const fillLight = new THREE.DirectionalLight(config.fillLight.color, config.fillLight.intensity)
  fillLight.position.set(
    config.fillLight.position.x,
    config.fillLight.position.y,
    config.fillLight.position.z
  )
  fillLight.name = 'fill-light'
  group.add(fillLight)

  // ========================================
  // RIM LIGHT (Player silhouette separation)
  // ========================================
  // Critical for PvP - makes players "pop" against dark background

  if (config.rimLight) {
    const rimLight = new THREE.DirectionalLight(config.rimLight.color, config.rimLight.intensity)
    rimLight.position.set(
      config.rimLight.position.x,
      config.rimLight.position.y,
      config.rimLight.position.z
    )
    rimLight.castShadow = config.rimLight.castShadow ?? false
    rimLight.name = 'rim-light'
    group.add(rimLight)
  }

  // ========================================
  // POINT LIGHTS (from config with priority culling)
  // ========================================

  // Apply quality-based culling if maxLights is specified
  const maxPointLights = maxLights ? getMaxPointLightsForTier(maxLights) : config.pointLights.length
  const culledPointLights = cullPointLightsByPriority(config.pointLights, maxPointLights)

  culledPointLights.forEach((pointLightConfig, i) => {
    const light = new THREE.PointLight(
      pointLightConfig.color,
      pointLightConfig.intensity,
      pointLightConfig.distance,
      pointLightConfig.decay
    )
    light.position.set(
      pointLightConfig.position.x,
      pointLightConfig.position.y,
      pointLightConfig.position.z
    )
    light.name = pointLightConfig.name ?? `${pointLightConfig.type}-${i}`
    group.add(light)
  })

  // Log culling info in development
  if (maxLights && config.pointLights.length > maxPointLights) {
    console.log(
      `[LightingBuilder] Point lights culled: ${config.pointLights.length} → ${culledPointLights.length} (maxLights: ${maxLights})`
    )
  }

  return group
}

/**
 * Create hanging lights - DEPRECATED for abandoned theme
 * Returns empty group to maintain API compatibility
 */
export function createHangingLights(_materials: ArenaMaterials): THREE.Group {
  const group = new THREE.Group()
  group.name = 'hanging-lights-deprecated'
  // No fixtures for abandoned subway - lighting is environmental only
  return group
}

/**
 * Get light count for debugging/optimization
 */
export function getLightingStats(scene: THREE.Scene): {
  total: number
  shadowCasting: number
  pointLights: number
  directionalLights: number
  spotLights: number
} {
  let total = 0
  let shadowCasting = 0
  let pointLights = 0
  let directionalLights = 0
  let spotLights = 0

  scene.traverse((obj) => {
    if (obj instanceof THREE.Light) {
      total++
      if ((obj as THREE.Light & { castShadow?: boolean }).castShadow) {
        shadowCasting++
      }
      if (obj instanceof THREE.PointLight) pointLights++
      if (obj instanceof THREE.DirectionalLight) directionalLights++
      if (obj instanceof THREE.SpotLight) spotLights++
    }
  })

  return { total, shadowCasting, pointLights, directionalLights, spotLights }
}
