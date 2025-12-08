-- Migration: Add playercard_equipped column to loadouts table
-- Requirements: 5.4 - Support playercard cosmetic type in loadout

-- Add playercard_equipped column to loadouts table
ALTER TABLE loadouts 
ADD COLUMN IF NOT EXISTS playercard_equipped UUID REFERENCES cosmetics_catalog(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_loadouts_playercard_equipped ON loadouts(playercard_equipped);
