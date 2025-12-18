/**
 * SpatialHashGrid - O(1) broad-phase collision queries
 * 
 * Divides world into cells for fast spatial queries.
 * Used to quickly find potential collision candidates.
 */

import type { IAABB } from './AABB';
import { AABB } from './AABB';
import type { IVector3 } from '../math/Vector3';

export interface ISpatialHashGrid {
  insert(aabb: AABB): void;
  remove(id: string): void;
  query(bounds: IAABB): AABB[];
  queryPoint(point: IVector3): AABB[];
  clear(): void;
  size(): number;
}

export class SpatialHashGrid implements ISpatialHashGrid {
  private cells: Map<string, Set<AABB>> = new Map();
  private aabbToKeys: Map<string, Set<string>> = new Map();
  private aabbById: Map<string, AABB> = new Map();
  private readonly cellSize: number;

  constructor(cellSize: number = 4) {
    this.cellSize = cellSize;
  }

  /**
   * Hash a world position to a cell key
   */
  private hashKey(x: number, y: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  /**
   * Get all cell keys that an AABB overlaps
   */
  private getCellKeys(aabb: IAABB): Set<string> {
    const keys = new Set<string>();
    const minX = Math.floor(aabb.min.x / this.cellSize);
    const maxX = Math.floor(aabb.max.x / this.cellSize);
    const minY = Math.floor(aabb.min.y / this.cellSize);
    const maxY = Math.floor(aabb.max.y / this.cellSize);
    const minZ = Math.floor(aabb.min.z / this.cellSize);
    const maxZ = Math.floor(aabb.max.z / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          keys.add(`${x},${y},${z}`);
        }
      }
    }
    return keys;
  }

  /**
   * Insert an AABB into the grid
   */
  insert(aabb: AABB): void {
    // Remove existing entry if updating
    if (this.aabbById.has(aabb.id)) {
      this.remove(aabb.id);
    }

    const keys = this.getCellKeys(aabb);
    this.aabbToKeys.set(aabb.id, keys);
    this.aabbById.set(aabb.id, aabb);

    keys.forEach(key => {
      if (!this.cells.has(key)) {
        this.cells.set(key, new Set());
      }
      this.cells.get(key)!.add(aabb);
    });
  }

  /**
   * Remove an AABB from the grid by ID
   */
  remove(id: string): void {
    const keys = this.aabbToKeys.get(id);
    const aabb = this.aabbById.get(id);
    
    if (!keys || !aabb) return;

    keys.forEach(key => {
      const cell = this.cells.get(key);
      if (cell) {
        cell.delete(aabb);
        if (cell.size === 0) {
          this.cells.delete(key);
        }
      }
    });
    
    this.aabbToKeys.delete(id);
    this.aabbById.delete(id);
  }

  /**
   * Query all AABBs that intersect the given bounds
   */
  query(bounds: IAABB): AABB[] {
    const result: AABB[] = [];
    const seen = new Set<string>();
    const keys = this.getCellKeys(bounds);

    keys.forEach(key => {
      const cell = this.cells.get(key);
      if (cell) {
        cell.forEach(aabb => {
          if (!seen.has(aabb.id) && aabb.intersectsAABB(bounds)) {
            seen.add(aabb.id);
            result.push(aabb);
          }
        });
      }
    });
    
    return result;
  }

  /**
   * Query all AABBs that contain the given point
   */
  queryPoint(point: IVector3): AABB[] {
    const key = this.hashKey(point.x, point.y, point.z);
    const cell = this.cells.get(key);
    
    if (!cell) return [];
    
    return Array.from(cell).filter(aabb => aabb.containsPoint(point));
  }

  /**
   * Remove all AABBs from the grid
   */
  clear(): void {
    this.cells.clear();
    this.aabbToKeys.clear();
    this.aabbById.clear();
  }

  /**
   * Get number of AABBs in the grid
   */
  size(): number {
    return this.aabbById.size;
  }

  /**
   * Get an AABB by ID
   */
  get(id: string): AABB | undefined {
    return this.aabbById.get(id);
  }

  /**
   * Check if an AABB with given ID exists
   */
  has(id: string): boolean {
    return this.aabbById.has(id);
  }

  /**
   * Get all AABBs in the grid
   */
  getAll(): AABB[] {
    return Array.from(this.aabbById.values());
  }
}
