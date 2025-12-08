-- 018_battlepass_shop_exclusion.sql
-- Add shop_available flag to exclude battle pass items from shop
-- Battle pass items should only be obtainable through the battle pass

-- Add shop_available column (defaults to true for existing items)
ALTER TABLE cosmetics_catalog 
    ADD COLUMN IF NOT EXISTS shop_available BOOLEAN DEFAULT true;

-- Create index for shop queries
CREATE INDEX IF NOT EXISTS idx_cosmetics_shop_available 
    ON cosmetics_catalog(shop_available) WHERE shop_available = true;

-- Mark all battle pass items as NOT shop available
-- These are the Season 1 Battle Pass items:

-- Battle Pass Skins (6)
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Frostborne Valkyrie';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Plasma Ranger';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Abyssal Leviathan';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Void Sovereign';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Solar Champion';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Molten Warlord';

-- Battle Pass Player Cards (6)
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Frostborne Valkyrie Card';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Plasma Ranger Card';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Abyssal Leviathan Card';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Void Sovereign Card';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Solar Champion Card';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Molten Warlord Card';

-- Battle Pass Emotes (8)
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Frost Sparkle';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Crown Flex';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Cyber Glitch';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Ethereal Bloom';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Fire Dragon';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Lava Burst';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Abyssal Terror';
UPDATE cosmetics_catalog SET shop_available = false WHERE name = 'Void Laugh';

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- UPDATE cosmetics_catalog SET shop_available = true;
-- ALTER TABLE cosmetics_catalog DROP COLUMN IF EXISTS shop_available;
-- DROP INDEX IF EXISTS idx_cosmetics_shop_available;
