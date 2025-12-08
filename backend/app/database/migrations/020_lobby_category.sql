-- ============================================
-- Migration: 020_lobby_category.sql
-- Description: Add trivia category to lobbies for category-based matchmaking
-- ============================================

-- Add category column to lobbies table
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS 
    category VARCHAR(50) DEFAULT 'fortnite';

-- Add index for category-based queries
CREATE INDEX IF NOT EXISTS idx_lobbies_category ON lobbies(category);

-- Note: We don't add a foreign key to question_categories because:
-- 1. The lobbies table may have been created before question_categories
-- 2. We want flexibility to add new categories without migration
-- 3. The application layer validates category values

COMMENT ON COLUMN lobbies.category IS 'Trivia category for this lobby (e.g., fortnite, nfl). Both players must select the same category during matchmaking.';
