/**
 * LightingBuilder - AAA Abandoned Subway Lighting
 *
 * Design: Moody, atmospheric lighting for an abandoned underground station
 * - Dim ambient with strategic accent pools
 * - Emergency/utility light sources (not decorative fixtures)
 * - Strong contrast for dramatic shadows
 * - Cool/warm color temperature contrast
 * - Optimized: minimal shadow-casters, efficient light count
 */

import * as THREE from 'three'
import type { ArenaMaterials } from '../materials/ArenaMaterials'
import type { LightingConfig } from '../maps/types'

/**
 * Create the complete abandoned subway lighting rig
 * No decorative fixtures - just atmospheric light sources
 *
 * @param config - LightingConfig containing all light definitions
 */
export function createAmbientLighting(config: LightingConfig): THREE.Group {
  const group = new THREE.Group()
  group.name = 'ambient-lighting'

  // ========================================
  // BASE AMBIENT (Power is mostly off)
  // ========================================

  const ambient = new THREE.AmbientLight(config.ambient.color, config.ambient.intensity)
  group.add(ambient)

  const hemi = new THREE.HemisphereLight(
    config.hemisphere.skyColor,
    config.hemisphere.groundColor,
    config.hemisphere.intensity
  )
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
  keyLight.shadow.mapSize.width = config.keyLight.shadowMapSize ?? 1024
  keyLight.shadow.mapSize.height = config.keyLight.shadowMapSize ?? 1024
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 50
  keyLight.shadow.camera.left = -25
  keyLight.shadow.camera.right = 25
  keyLight.shadow.camera.top = 25
  keyLight.shadow.camera.bottom = -25
  keyLight.shadow.bias = config.keyLight.shadowBias ?? -0.0001
  keyLight.shadow.radius = 4 // Soft edges
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
  // POINT LIGHTS (from config)
  // ========================================
  // All point lights (emergency, utility, trackGlow, tunnelGlow, wallWash)
  // are now defined in the LightingConfig.pointLights array

  config.pointLights.forEach((pointLightConfig, i) => {
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
