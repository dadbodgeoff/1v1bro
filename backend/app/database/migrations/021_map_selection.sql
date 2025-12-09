-- ============================================
-- Migration: 021_map_selection.sql
-- Description: Add map_slug to lobbies for map selection in matchmaking
-- ============================================

-- Add map_slug column to lobbies table
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS 
    map_slug VARCHAR(50) DEFAULT 'nexus-arena';

-- Add index for map_slug queries (useful for matchmaking filtering)
CREATE INDEX IF NOT EXISTS idx_lobbies_map_slug ON lobbies(map_slug);

-- Comment for documentation
COMMENT ON COLUMN lobbies.map_slug IS 'Arena map slug for this lobby (e.g., nexus-arena, vortex-arena). Both players must select the same map during matchmaking.';
