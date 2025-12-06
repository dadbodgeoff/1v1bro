/**
 * MapLoader - Map configuration parser and validator
 * Handles loading and validating map configurations
 * 
 * @module arena/MapLoader
 */

import type { MapConfig, ValidationResult } from '../config/maps/map-schema'
import { validateMapConfig } from '../config/maps/map-schema'
import { TileMap } from './TileMap'

// ============================================================================
// Event Types
// ============================================================================

export interface MapLoadedEvent {
  mapName: string
  version: string
  tileMap: TileMap
}

export type MapLoaderEventType = 'map_loaded'

export type MapLoaderEventCallback = (event: MapLoadedEvent) => void

// ============================================================================
// MapLoader Class
// ============================================================================

/**
 * MapLoader handles loading and validating map configurations
 * Requirements: 1.2, 1.8, 1.9
 */
export class MapLoader {
  private eventListeners: Map<MapLoaderEventType, MapLoaderEventCallback[]> = new Map()

  constructor() {
    this.eventListeners.set('map_loaded', [])
  }

  /**
   * Validate a map configuration
   * Requirements: 1.8, 9.2, 9.3
   * 
   * @param config - Map configuration to validate
   * @returns ValidationResult with valid flag and errors array
   */
  static validate(config: MapConfig): ValidationResult {
    return validateMapConfig(config)
  }

  /**
   * Load a map configuration and create a TileMap
   * Requirements: 1.2, 1.9
   * 
   * @param config - Map configuration to load
   * @returns Loaded TileMap
   * @throws Error if configuration is invalid
   */
  load(config: MapConfig): TileMap {
    // Validate configuration
    const validation = MapLoader.validate(config)
    if (!validation.valid) {
      throw new Error(`Invalid map configuration: ${validation.errors.join(', ')}`)
    }

    // Create and load tile map
    const tileMap = new TileMap()
    tileMap.load(config.tiles)

    // Emit map_loaded event
    this.emit('map_loaded', {
      mapName: config.metadata.name,
      version: config.metadata.version,
      tileMap
    })

    return tileMap
  }

  /**
   * Add an event listener
   * Requirements: 1.9
   * 
   * @param event - Event type to listen for
   * @param callback - Callback function
   */
  on(event: MapLoaderEventType, callback: MapLoaderEventCallback): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.push(callback)
    }
  }

  /**
   * Remove an event listener
   * 
   * @param event - Event type
   * @param callback - Callback function to remove
   */
  off(event: MapLoaderEventType, callback: MapLoaderEventCallback): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Emit an event to all listeners
   * 
   * @param event - Event type
   * @param data - Event data
   */
  private emit(event: MapLoaderEventType, data: MapLoadedEvent): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      for (const callback of listeners) {
        callback(data)
      }
    }
  }
}
