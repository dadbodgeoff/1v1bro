/**
 * WallBuilder - Creates solid end walls (north/south only)
 * East/West sides are open (train platform style)
 */

import * as THREE from 'three'
import type { ArenaMaterials } from '../materials/ArenaMaterials'
import type { ArenaConfig } from '../maps/types'

export function createWalls(materials: ArenaMaterials, config: ArenaConfig): THREE.Group {
  const group = new THREE.Group()
  group.name = 'walls'
  
  const { width, depth, wallHeight, wallThickness } = config
  const halfW = width / 2
  const halfD = depth / 2
  
  // OPTIMIZATION: Share geometry between same-sized walls
  // N/S walls share one geometry, E/W walls share another
  const nsWallGeo = new THREE.BoxGeometry(width, wallHeight, wallThickness)
  const ewWallGeo = new THREE.BoxGeometry(depth, wallHeight, wallThickness)
  
  // North wall - walls only receive shadows, don't cast (nothing behind them)
  const north = new THREE.Mesh(nsWallGeo, materials.wall)
  north.position.set(0, wallHeight / 2, -halfD)
  north.receiveShadow = true
  north.name = 'wall-north'
  group.add(north)
  
  // South wall - reuses N/S geometry
  const south = new THREE.Mesh(nsWallGeo, materials.wall)
  south.position.set(0, wallHeight / 2, halfD)
  south.receiveShadow = true
  south.name = 'wall-south'
  group.add(south)
  
  // East wall
  const east = new THREE.Mesh(ewWallGeo, materials.wall)
  east.position.set(halfW, wallHeight / 2, 0)
  east.rotation.y = Math.PI / 2
  east.receiveShadow = true
  east.name = 'wall-east'
  group.add(east)
  
  // West wall - reuses E/W geometry
  const west = new THREE.Mesh(ewWallGeo, materials.wall)
  west.position.set(-halfW, wallHeight / 2, 0)
  west.rotation.y = Math.PI / 2
  west.receiveShadow = true
  west.name = 'wall-west'
  group.add(west)
  
  return group
}
