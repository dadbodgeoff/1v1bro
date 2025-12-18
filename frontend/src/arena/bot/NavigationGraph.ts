/**
 * NavigationGraph - Defines walkable paths for bot navigation
 * 
 * Uses a waypoint graph where nodes are safe positions and edges
 * define walkable connections between them. The bot can pathfind
 * through this graph to reach destinations.
 */

import { Vector3 } from '../math/Vector3'

/**
 * A navigation waypoint
 */
export interface NavWaypoint {
  id: string
  position: Vector3
  /** IDs of connected waypoints */
  connections: string[]
  /** Optional: area type for tactical decisions */
  area?: 'platform' | 'train' | 'cover' | 'open'
}

/**
 * Navigation graph for a map
 */
export interface NavGraph {
  waypoints: Map<string, NavWaypoint>
}

/**
 * Abandoned Terminal Navigation Graph
 * 
 * Layout:
 * - West platform (X ~ -8 to -15)
 * - East platform (X ~ 8 to 15)
 * - Train in center with doors at Z = -3 and Z = +3
 * - Track bed below (not walkable without jumping down)
 * 
 * Key positions based on scene data:
 * - Train: center at (0, 0, 0), size 4.54 x 5.95 x 13
 * - Train doors at Z = -3 and Z = +3 on both sides
 * - Luggage stacks at (-4,0,0), (4,0,0), (-10,0,-16), (10,0,16), (-14,0,8), (14,0,-8)
 * - Benches at (-10,0.46,±6), (10,0.46,±6)
 * - Fare terminals at (-8,2,-10), (8,2,10)
 */
export function createAbandonedTerminalNavGraph(): NavGraph {
  const waypoints = new Map<string, NavWaypoint>()
  
  // Helper to add waypoint
  const add = (id: string, x: number, z: number, connections: string[], area?: NavWaypoint['area']) => {
    waypoints.set(id, {
      id,
      position: new Vector3(x, 0.5, z),
      connections,
      area,
    })
  }
  
  // === WEST PLATFORM ===
  // North section
  add('wp_nw_corner', -15, -17, ['wp_w_north', 'wp_nw_mid'], 'platform')
  add('wp_w_north', -12, -14, ['wp_nw_corner', 'wp_w_north_mid'], 'platform')
  add('wp_w_north_mid', -12, -10, ['wp_w_north', 'wp_w_bench_n'], 'platform')
  
  // West platform center (near benches)
  add('wp_w_bench_n', -12, -6, ['wp_w_north_mid', 'wp_w_center'], 'cover')
  add('wp_w_center', -12, 0, ['wp_w_bench_n', 'wp_w_bench_s', 'wp_w_train_n', 'wp_w_train_s'], 'platform')
  add('wp_w_bench_s', -12, 6, ['wp_w_center', 'wp_w_south_mid'], 'cover')
  
  // South section
  add('wp_w_south_mid', -12, 10, ['wp_w_bench_s', 'wp_w_south'], 'platform')
  add('wp_w_south', -12, 14, ['wp_w_south_mid', 'wp_sw_corner'], 'platform')
  add('wp_sw_corner', -15, 17, ['wp_w_south', 'wp_sw_mid'], 'platform')
  
  // West side near train (approach to doors)
  add('wp_w_train_n', -6, -3, ['wp_w_center', 'wp_train_door_w_n'], 'open')
  add('wp_w_train_s', -6, 3, ['wp_w_center', 'wp_train_door_w_s'], 'open')
  
  // === EAST PLATFORM ===
  // North section
  add('wp_ne_corner', 15, -17, ['wp_e_north', 'wp_ne_mid'], 'platform')
  add('wp_e_north', 12, -14, ['wp_ne_corner', 'wp_e_north_mid'], 'platform')
  add('wp_e_north_mid', 12, -10, ['wp_e_north', 'wp_e_bench_n'], 'platform')
  
  // East platform center (near benches)
  add('wp_e_bench_n', 12, -6, ['wp_e_north_mid', 'wp_e_center'], 'cover')
  add('wp_e_center', 12, 0, ['wp_e_bench_n', 'wp_e_bench_s', 'wp_e_train_n', 'wp_e_train_s'], 'platform')
  add('wp_e_bench_s', 12, 6, ['wp_e_center', 'wp_e_south_mid'], 'cover')
  
  // South section
  add('wp_e_south_mid', 12, 10, ['wp_e_bench_s', 'wp_e_south'], 'platform')
  add('wp_e_south', 12, 14, ['wp_e_south_mid', 'wp_se_corner'], 'platform')
  add('wp_se_corner', 15, 17, ['wp_e_south', 'wp_se_mid'], 'platform')
  
  // East side near train (approach to doors)
  add('wp_e_train_n', 6, -3, ['wp_e_center', 'wp_train_door_e_n'], 'open')
  add('wp_e_train_s', 6, 3, ['wp_e_center', 'wp_train_door_e_s'], 'open')
  
  // === TRAIN DOORS (passthrough points) ===
  // West side doors
  add('wp_train_door_w_n', -2.5, -3, ['wp_w_train_n', 'wp_train_door_e_n'], 'train')
  add('wp_train_door_w_s', -2.5, 3, ['wp_w_train_s', 'wp_train_door_e_s'], 'train')
  
  // East side doors
  add('wp_train_door_e_n', 2.5, -3, ['wp_e_train_n', 'wp_train_door_w_n'], 'train')
  add('wp_train_door_e_s', 2.5, 3, ['wp_e_train_s', 'wp_train_door_w_s'], 'train')
  
  // === ADDITIONAL PATROL POINTS ===
  // Near luggage for cover
  add('wp_luggage_w', -6, 0, ['wp_w_center', 'wp_w_train_n', 'wp_w_train_s'], 'cover')
  add('wp_luggage_e', 6, 0, ['wp_e_center', 'wp_e_train_n', 'wp_e_train_s'], 'cover')
  
  // Corner luggage
  add('wp_sw_mid', -14, 10, ['wp_sw_corner', 'wp_w_south_mid'], 'cover')
  add('wp_ne_mid', 14, -10, ['wp_ne_corner', 'wp_e_north_mid'], 'cover')
  
  // Make connections bidirectional
  waypoints.forEach((wp) => {
    wp.connections.forEach((connId) => {
      const connected = waypoints.get(connId)
      if (connected && !connected.connections.includes(wp.id)) {
        connected.connections.push(wp.id)
      }
    })
  })
  
  return { waypoints }
}

/**
 * Find nearest waypoint to a position
 */
export function findNearestWaypoint(graph: NavGraph, position: Vector3): NavWaypoint | null {
  let nearest: NavWaypoint | null = null
  let nearestDist = Infinity
  
  graph.waypoints.forEach((wp) => {
    const dist = position.subtract(wp.position).magnitude()
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = wp
    }
  })
  
  return nearest
}

/**
 * Simple A* pathfinding between waypoints
 */
export function findPath(
  graph: NavGraph,
  startPos: Vector3,
  endPos: Vector3
): Vector3[] {
  const startWp = findNearestWaypoint(graph, startPos)
  const endWp = findNearestWaypoint(graph, endPos)
  
  if (!startWp || !endWp) return []
  if (startWp.id === endWp.id) return [endWp.position]
  
  // A* implementation
  const openSet = new Set<string>([startWp.id])
  const cameFrom = new Map<string, string>()
  const gScore = new Map<string, number>()
  const fScore = new Map<string, number>()
  
  gScore.set(startWp.id, 0)
  fScore.set(startWp.id, heuristic(startWp.position, endWp.position))
  
  while (openSet.size > 0) {
    // Get node with lowest fScore
    let current: string | null = null
    let lowestF = Infinity
    openSet.forEach((id) => {
      const f = fScore.get(id) ?? Infinity
      if (f < lowestF) {
        lowestF = f
        current = id
      }
    })
    
    if (!current) break
    
    if (current === endWp.id) {
      // Reconstruct path
      const path: Vector3[] = []
      let node: string | undefined = current
      while (node) {
        const wp = graph.waypoints.get(node)
        if (wp) path.unshift(wp.position)
        node = cameFrom.get(node)
      }
      return path
    }
    
    openSet.delete(current)
    const currentWp = graph.waypoints.get(current)!
    
    for (const neighborId of currentWp.connections) {
      const neighbor = graph.waypoints.get(neighborId)
      if (!neighbor) continue
      
      const tentativeG = (gScore.get(current) ?? Infinity) + 
        currentWp.position.subtract(neighbor.position).magnitude()
      
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, current)
        gScore.set(neighborId, tentativeG)
        fScore.set(neighborId, tentativeG + heuristic(neighbor.position, endWp.position))
        openSet.add(neighborId)
      }
    }
  }
  
  return [] // No path found
}

function heuristic(a: Vector3, b: Vector3): number {
  return a.subtract(b).magnitude()
}

/**
 * Get a random waypoint for patrol
 */
export function getRandomWaypoint(graph: NavGraph): NavWaypoint {
  const waypoints = Array.from(graph.waypoints.values())
  return waypoints[Math.floor(Math.random() * waypoints.length)]
}

/**
 * Get waypoints in a specific area
 */
export function getWaypointsInArea(
  graph: NavGraph,
  area: NavWaypoint['area']
): NavWaypoint[] {
  return Array.from(graph.waypoints.values()).filter((wp) => wp.area === area)
}
