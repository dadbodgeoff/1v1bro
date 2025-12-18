/**
 * MapRegistry - Singleton service for map definition management
 *
 * Stores and retrieves map definitions by ID.
 * Provides map discovery and selection capabilities.
 *
 * @module maps/MapRegistry
 */

import type { MapDefinition } from './types';

/**
 * Error thrown when attempting to register a map with a duplicate ID
 */
export class DuplicateMapIdError extends Error {
  readonly mapId: string;

  constructor(mapId: string) {
    super(`Map with id "${mapId}" is already registered`);
    this.name = 'DuplicateMapIdError';
    this.mapId = mapId;
  }
}

/**
 * MapRegistry singleton for managing map definitions
 *
 * Usage:
 * ```typescript
 * const registry = MapRegistry.getInstance();
 * registry.register(myMapDefinition);
 * const map = registry.get('my_map_id');
 * ```
 */
export class MapRegistry {
  private static instance: MapRegistry | null = null;
  private maps: Map<string, MapDefinition> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of MapRegistry
   */
  static getInstance(): MapRegistry {
    if (!MapRegistry.instance) {
      MapRegistry.instance = new MapRegistry();
    }
    return MapRegistry.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    MapRegistry.instance = null;
  }

  /**
   * Register a map definition
   * @throws DuplicateMapIdError if a map with the same id already exists
   */
  register(definition: MapDefinition): void {
    if (this.maps.has(definition.id)) {
      throw new DuplicateMapIdError(definition.id);
    }
    this.maps.set(definition.id, definition);
  }

  /**
   * Get a map definition by id
   * @returns The map definition or undefined if not found
   */
  get(id: string): MapDefinition | undefined {
    return this.maps.get(id);
  }

  /**
   * Check if a map id exists in the registry
   */
  has(id: string): boolean {
    return this.maps.has(id);
  }

  /**
   * Get all registered map definitions
   */
  getAll(): MapDefinition[] {
    return Array.from(this.maps.values());
  }

  /**
   * Get all registered map ids
   */
  getIds(): string[] {
    return Array.from(this.maps.keys());
  }

  /**
   * Get the number of registered maps
   */
  size(): number {
    return this.maps.size;
  }

  /**
   * Clear all registered maps (useful for testing)
   */
  clear(): void {
    this.maps.clear();
  }
}
