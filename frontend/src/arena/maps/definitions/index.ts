/**
 * Map Definitions Index
 *
 * Exports all map definitions and registers them with the MapRegistry.
 * Import this module to ensure all maps are available.
 *
 * @module maps/definitions
 */

import { MapRegistry } from '../MapRegistry';
import { AbandonedTerminalMap } from './AbandonedTerminalMap';

// Export map definitions
export { AbandonedTerminalMap };

// Register all maps with the registry
const registry = MapRegistry.getInstance();

// Only register if not already registered (prevents duplicate registration errors)
if (!registry.has(AbandonedTerminalMap.id)) {
  registry.register(AbandonedTerminalMap);
}

// Export list of all map IDs for convenience
export const MAP_IDS = {
  ABANDONED_TERMINAL: AbandonedTerminalMap.id,
} as const;

// Export default map ID
export const DEFAULT_MAP_ID = MAP_IDS.ABANDONED_TERMINAL;
