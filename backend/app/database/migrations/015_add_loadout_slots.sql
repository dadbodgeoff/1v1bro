-- 015_add_loadout_slots.sql
-- Add missing trail and playercard slots to loadouts table
-- Requirements: 3.5 (Loadout system)

-- Add trail_equipped column
ALTER TABLE loadouts 
    ADD COLUMN IF NOT EXISTS trail_equipped UUID REFERENCES cosmetics_catalog(id);

-- Add playercard_equipped column
ALTER TABLE loadouts 
    ADD COLUMN IF NOT EXISTS playercard_equipped UUID REFERENCES cosmetics_catalog(id);

-- Update cosmetics_catalog type constraint to include playercard
-- First drop the old constraint, then add the new one
ALTER TABLE cosmetics_catalog DROP CONSTRAINT IF EXISTS cosmetics_catalog_type_check;
ALTER TABLE cosmetics_catalog ADD CONSTRAINT cosmetics_catalog_type_check 
    CHECK (type IN ('skin', 'emote', 'banner', 'nameplate', 'effect', 'trail', 'playercard'));

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- ALTER TABLE loadouts DROP COLUMN IF EXISTS trail_equipped;
-- ALTER TABLE loadouts DROP COLUMN IF EXISTS playercard_equipped;
-- ALTER TABLE cosmetics_catalog DROP CONSTRAINT IF EXISTS cosmetics_catalog_type_check;
-- ALTER TABLE cosmetics_catalog ADD CONSTRAINT cosmetics_catalog_type_check 
--     CHECK (type IN ('skin', 'emote', 'banner', 'nameplate', 'effect', 'trail'));
