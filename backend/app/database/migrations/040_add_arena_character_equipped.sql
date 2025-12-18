-- Migration: Add arena_character_equipped column to loadouts table
--
-- Requirements: Support arena_character cosmetic type for arena mode 3D character skins

-- Add arena_character_equipped column to loadouts table
ALTER TABLE loadouts 
ADD COLUMN IF NOT EXISTS arena_character_equipped UUID REFERENCES cosmetics_catalog(id);

-- Add arena_animations JSONB column to cosmetics_catalog for storing animation URLs
ALTER TABLE cosmetics_catalog
ADD COLUMN IF NOT EXISTS arena_animations JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN loadouts.arena_character_equipped IS 'Equipped arena character skin for arena mode';
COMMENT ON COLUMN cosmetics_catalog.arena_animations IS 'Animation URLs for arena_character type cosmetics (idle, run, shoot, etc.)';
