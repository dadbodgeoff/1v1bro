-- Migration: Add recap_data column to games table
-- Requirements: 7.3 - Persist recap data to games table
-- Created: December 2024

-- Add recap_data JSONB column to store per-player recap payloads
ALTER TABLE games ADD COLUMN IF NOT EXISTS recap_data JSONB;

-- Index for efficient match history queries with recap data
CREATE INDEX IF NOT EXISTS idx_games_recap_data ON games USING GIN (recap_data);

-- Comment for documentation
COMMENT ON COLUMN games.recap_data IS 'JSONB containing per-player RecapPayload for match history. Structure: { player_id: RecapPayload, ... }';
