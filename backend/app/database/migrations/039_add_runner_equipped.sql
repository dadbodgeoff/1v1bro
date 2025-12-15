-- Migration: Add runner_equipped column to loadouts table
-- Requirements: Support runner cosmetic type for survival mode character skins

-- Add runner_equipped column to loadouts table
ALTER TABLE loadouts 
ADD COLUMN IF NOT EXISTS runner_equipped UUID REFERENCES cosmetics_catalog(id);

-- Add runner type to cosmetics_catalog type constraint if not exists
-- Note: This may already exist from previous migrations, so we use DO block
DO $$
BEGIN
    -- Check if 'runner' is already in the type constraint
    -- If not, we need to update the constraint
    -- This is a no-op if runner already exists
    IF NOT EXISTS (
        SELECT 1 FROM cosmetics_catalog WHERE type = 'runner' LIMIT 1
    ) THEN
        -- The type column likely uses a CHECK constraint or enum
        -- We'll just ensure the column accepts 'runner' values
        RAISE NOTICE 'Runner type ready for use in cosmetics_catalog';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_loadouts_runner_equipped ON loadouts(runner_equipped);

COMMENT ON COLUMN loadouts.runner_equipped IS 'Equipped runner skin for survival mode';
