/**
 * SpatialHash - Spatial partitioning for efficient collision detection
 * 
 * @module collision/SpatialHash
 */

import type { Vector2 } from '../types'

// ============================================================================
// Types
// ============================================================================

interface SpatialEntry {
  id: string
  position: Vector2
  size: Vector2
  cells: string[]  // Cell keys this entry occupies
}

// ============================================================================
// SpatialHash Class
// ============================================================================

/**
 * SpatialHash provides efficient broad-phase collision detection
 * Requirements: 10.5, 10.6
 */
export class SpatialHash {
  private cellSize: number
  private gridWidth: number
  private gridHeight: number
  private cells: Map<string, Set<string>> = new Map()  // cellKey -> Set of entry IDs
  private entries: Map<string, SpatialEntry> = new Map()  // id -> entry

  /**
   * Create a new spatial hash
   * 
   * @param cellSize - Size of each cell in pixels
   * @param gridWidth - Number of cells horizontally
   * @param gridHeight - Number of cells vertically
   */
  constructor(cellSize: number, gridWidth: number, gridHeight: number) {
    this.cellSize = cellSize
    this.gridWidth = gridWidth
    this.gridHeight = gridHeight
  }

  /**
   * Insert an object into the spatial hash
   * Requirements: 10.5
   * 
   * @param id - Unique identifier
   * @param position - Position (top-left corner)
   * @param size - Size of the object
   */
  insert(id: string, position: Vector2, size: Vector2): void {
    // Remove existing entry if present
    this.remove(id)

    // Get cells this object occupies
    const cells = this.getCellsForRect(position, size)

    // Create entry
    const entry: SpatialEntry = {
      id,
      position: { ...position },
      size: { ...size },
      cells
    }
    this.entries.set(id, entry)

    // Add to cells
    for (const cellKey of cells) {
      if (!this.cells.has(cellKey)) {
        this.cells.set(cellKey, new Set())
      }
      this.cells.get(cellKey)!.add(id)
    }
  }

  /**
   * Remove an object from the spatial hash
   * Requirements: 10.6
   * 
   * @param id - ID of object to remove
   */
  remove(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return

    // Remove from cells
    for (const cellKey of entry.cells) {
      const cell = this.cells.get(cellKey)
      if (cell) {
        cell.delete(id)
        if (cell.size === 0) {
          this.cells.delete(cellKey)
        }
      }
    }

    this.entries.delete(id)
  }

  /**
   * Update an object's position in the spatial hash
   * 
   * @param id - ID of object to update
   * @param position - New position
   * @param size - New size (optional, uses existing if not provided)
   */
  update(id: string, position: Vector2, size?: Vector2): void {
    const entry = this.entries.get(id)
    if (!entry) {
      if (size) {
        this.insert(id, position, size)
      }
      return
    }

    const newSize = size || entry.size
    this.insert(id, position, newSize)
  }

  /**
   * Query for objects near a position
   * Requirements: 10.8
   * 
   * @param position - Center position
   * @param radius - Search radius
   * @returns Array of IDs of nearby objects
   */
  query(position: Vector2, radius: number): string[] {
    const results = new Set<string>()

    // Get cells that the query circle might touch
    const minX = position.x - radius
    const minY = position.y - radius
    const maxX = position.x + radius
    const maxY = position.y + radius

    const cells = this.getCellsForRect(
      { x: minX, y: minY },
      { x: maxX - minX, y: maxY - minY }
    )

    // Collect all entries in those cells
    for (const cellKey of cells) {
      const cell = this.cells.get(cellKey)
      if (cell) {
        for (const id of cell) {
          results.add(id)
        }
      }
    }

    return Array.from(results)
  }

  /**
   * Query for objects in a rectangular area
   * 
   * @param position - Top-left corner
   * @param size - Size of rectangle
   * @returns Array of IDs of objects in area
   */
  queryRect(position: Vector2, size: Vector2): string[] {
    const results = new Set<string>()
    const cells = this.getCellsForRect(position, size)

    for (const cellKey of cells) {
      const cell = this.cells.get(cellKey)
      if (cell) {
        for (const id of cell) {
          results.add(id)
        }
      }
    }

    return Array.from(results)
  }

  /**
   * Clear all entries from the spatial hash
   */
  clear(): void {
    this.cells.clear()
    this.entries.clear()
  }

  /**
   * Get all cell keys that a rectangle occupies
   * 
   * @param position - Top-left corner
   * @param size - Size of rectangle
   * @returns Array of cell keys
   */
  getCellsForRect(position: Vector2, size: Vector2): string[] {
    const cells: string[] = []

    const startX = Math.max(0, Math.floor(position.x / this.cellSize))
    const startY = Math.max(0, Math.floor(position.y / this.cellSize))
    const endX = Math.min(this.gridWidth - 1, Math.floor((position.x + size.x) / this.cellSize))
    const endY = Math.min(this.gridHeight - 1, Math.floor((position.y + size.y) / this.cellSize))

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        cells.push(this.getCellKey(x, y))
      }
    }

    return cells
  }

  /**
   * Get cell key for grid coordinates
   * 
   * @param gridX - Grid X coordinate
   * @param gridY - Grid Y coordinate
   * @returns Cell key string
   */
  private getCellKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`
  }

  /**
   * Get entry by ID
   * 
   * @param id - Entry ID
   * @returns Entry or undefined
   */
  getEntry(id: string): SpatialEntry | undefined {
    return this.entries.get(id)
  }

  /**
   * Get number of entries
   * 
   * @returns Entry count
   */
  size(): number {
    return this.entries.size
  }

  /**
   * Get number of non-empty cells
   * 
   * @returns Cell count
   */
  cellCount(): number {
    return this.cells.size
  }
}
