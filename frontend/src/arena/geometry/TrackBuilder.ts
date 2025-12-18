/**
 * TrackBuilder - Creates the sunken train track channel
 */

import * as THREE from 'three'
import type { ArenaMaterials } from '../materials/ArenaMaterials'
import type { ArenaConfig } from '../maps/types'

export function createTrackChannel(_materials: ArenaMaterials, config: ArenaConfig): THREE.Group {
  const group = new THREE.Group()
  group.name = 'track-channel'
  
  const { tracks, depth, colors } = config
  const trackLength = depth - 8 // Leave margin at ends for end caps
  
  // Track bed (sunken floor) - gravel/ballast
  const bedGeo = new THREE.BoxGeometry(tracks.width - 0.2, 0.1, trackLength)
  const bedMat = new THREE.MeshStandardMaterial({
    color: colors.trackBed,
    roughness: 0.95,
    metalness: 0.0,
  })
  const bed = new THREE.Mesh(bedGeo, bedMat)
  bed.position.y = -tracks.depth + 0.05
  bed.receiveShadow = true
  bed.name = 'track-bed'
  group.add(bed)
  
  // Rails - make them taller and shinier
  const railHeight = 0.2
  const railWidth = 0.08
  const railGeo = new THREE.BoxGeometry(railWidth, railHeight, trackLength)
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.2,
    metalness: 0.9,
  })
  
  // Rails - no shadow casting (too small to matter)
  const leftRail = new THREE.Mesh(railGeo, railMat)
  leftRail.position.set(-tracks.railSpacing / 2, -tracks.depth + railHeight / 2 + 0.1, 0)
  leftRail.name = 'rail-left'
  group.add(leftRail)
  
  const rightRail = new THREE.Mesh(railGeo, railMat)
  rightRail.position.set(tracks.railSpacing / 2, -tracks.depth + railHeight / 2 + 0.1, 0)
  rightRail.name = 'rail-right'
  group.add(rightRail)
  
  // Sleepers/ties - wooden cross beams
  const sleeperWidth = 2.4
  const sleeperHeight = 0.12
  const sleeperDepth = 0.25
  const sleeperSpacing = 0.65
  const sleeperGeo = new THREE.BoxGeometry(sleeperWidth, sleeperHeight, sleeperDepth)
  const sleeperMat = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.85,
    metalness: 0.0,
  })
  
  const numSleepers = Math.floor(trackLength / sleeperSpacing)
  const startZ = -trackLength / 2 + sleeperDepth
  
  // Sleepers - no shadow casting (too small, too many)
  for (let i = 0; i < numSleepers; i++) {
    const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat)
    sleeper.position.set(
      0,
      -tracks.depth + sleeperHeight / 2,
      startZ + i * sleeperSpacing
    )
    sleeper.receiveShadow = true
    sleeper.name = `sleeper-${i}`
    group.add(sleeper)
  }
  
  // Third rail (electric) - on the side
  const thirdRailGeo = new THREE.BoxGeometry(0.1, 0.15, trackLength)
  const thirdRailMat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.3,
    metalness: 0.8,
  })
  const thirdRail = new THREE.Mesh(thirdRailGeo, thirdRailMat)
  thirdRail.position.set(tracks.width / 2 - 0.3, -tracks.depth + 0.2, 0)
  thirdRail.name = 'third-rail'
  group.add(thirdRail)
  
  return group
}

export function createPlatformEdges(_materials: ArenaMaterials, config: ArenaConfig): THREE.Group {
  const group = new THREE.Group()
  group.name = 'platform-edges'
  
  const { tracks, platformEdge, depth, colors } = config
  const edgeLength = depth - 4
  
  // Simple yellow safety lines on floor level (no raised platforms)
  const yellowMat = new THREE.MeshStandardMaterial({
    color: colors.yellowLine,
    roughness: 0.6,
    metalness: 0.0,
    emissive: colors.yellowLine,
    emissiveIntensity: 0.15,
  })
  
  const tactileMat = new THREE.MeshStandardMaterial({
    color: colors.tactileStrip,
    roughness: 0.8,
    metalness: 0.0,
  })
  
  // Create edges on both sides of track
  const sides = [
    { x: -tracks.width / 2 - platformEdge.width / 2, name: 'west' },
    { x: tracks.width / 2 + platformEdge.width / 2, name: 'east' },
  ]
  
  sides.forEach(side => {
    // Yellow line
    const lineGeo = new THREE.BoxGeometry(platformEdge.width, 0.02, edgeLength)
    const line = new THREE.Mesh(lineGeo, yellowMat)
    line.position.set(side.x, 0.01, 0)
    line.receiveShadow = true
    line.name = `yellow-line-${side.name}`
    group.add(line)
    
    // Tactile warning strip
    const tactileX = side.x + (side.name === 'west' ? -1 : 1) * (platformEdge.width / 2 + platformEdge.tactileWidth / 2)
    const tactileGeo = new THREE.BoxGeometry(platformEdge.tactileWidth, 0.03, edgeLength)
    const tactile = new THREE.Mesh(tactileGeo, tactileMat)
    tactile.position.set(tactileX, 0.015, 0)
    tactile.receiveShadow = true
    tactile.name = `tactile-${side.name}`
    group.add(tactile)
  })
  
  return group
}
