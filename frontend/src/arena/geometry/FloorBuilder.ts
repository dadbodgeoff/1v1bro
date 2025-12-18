/**
 * FloorBuilder - Creates the terrazzo floor with track cutout
 */

import * as THREE from 'three'
import type { ArenaMaterials } from '../materials/ArenaMaterials'
import type { ArenaConfig } from '../maps/types'

export function createFloor(materials: ArenaMaterials, config: ArenaConfig): THREE.Group {
  const group = new THREE.Group()
  group.name = 'floor'
  
  const { width, depth, tracks } = config
  
  // Create floor in two sections (west and east of tracks)
  const sideWidth = (width - tracks.width) / 2
  
  // OPTIMIZATION: Share single geometry between both floor sections
  const sharedFloorGeo = new THREE.PlaneGeometry(sideWidth, depth)
  
  // West platform
  const west = new THREE.Mesh(sharedFloorGeo, materials.terrazzo)
  west.rotation.x = -Math.PI / 2
  west.position.x = -tracks.width / 2 - sideWidth / 2
  west.receiveShadow = true
  west.name = 'floor-west'
  group.add(west)
  
  // East platform - reuses same geometry
  const east = new THREE.Mesh(sharedFloorGeo, materials.terrazzo)
  east.rotation.x = -Math.PI / 2
  east.position.x = tracks.width / 2 + sideWidth / 2
  east.receiveShadow = true
  east.name = 'floor-east'
  group.add(east)
  
  // No floor in the track area - train provides its own floor
  
  return group
}

export function createCeiling(materials: ArenaMaterials, config: ArenaConfig): THREE.Mesh {
  const { width, depth, ceilingHeight } = config
  
  const geometry = new THREE.PlaneGeometry(width, depth)
  const mesh = new THREE.Mesh(geometry, materials.ceiling)
  
  mesh.rotation.x = Math.PI / 2
  mesh.position.y = ceilingHeight
  mesh.name = 'ceiling'
  
  return mesh
}
