-- 033_add_season_max_tier.sql
-- Add max_tier column to seasons table for configurable tier counts
-- Supports seasons with different tier counts (e.g., 35 tiers instead of 100)

-- Add max_tier column with default of 35 (current Season 1 tier count)
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS max_tier INTEGER DEFAULT 35;

-- Update existing Season 1 to have max_tier = 35
UPDATE seasons SET max_tier = 35 WHERE season_number = 1;

-- Add comment for documentation
COMMENT ON COLUMN seasons.max_tier IS 'Maximum tier number for this season (e.g., 35 for Season 1)';

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- ALTER TABLE seasons DROP COLUMN IF EXISTS max_tier;
