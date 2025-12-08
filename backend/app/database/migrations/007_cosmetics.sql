-- 007_cosmetics.sql
-- Cosmetics system: catalog, inventory, and loadouts
-- Requirements: 3.1, 3.2, 3.4, 3.5

-- ============================================
-- Cosmetics Catalog (read-mostly, shop items)
-- ============================================
CREATE TABLE IF NOT EXISTS cosmetics_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('skin', 'emote', 'banner', 'nameplate', 'effect', 'trail')),
    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    description TEXT,
    image_url TEXT NOT NULL,
    preview_video_url TEXT,
    price_coins INTEGER NOT NULL DEFAULT 0,
    price_premium INTEGER,
    release_date TIMESTAMPTZ DEFAULT NOW(),
    event VARCHAR(50),
    is_limited BOOLEAN DEFAULT false,
    owned_by_count INTEGER DEFAULT 0,
    skin_id VARCHAR(50),  -- Maps to frontend SkinId for sprite-based skins
    available_until TIMESTAMPTZ,  -- For limited time items
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cosmetics_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view cosmetics catalog
CREATE POLICY "Authenticated users can view cosmetics" ON cosmetics_catalog
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- Player Inventory (owned cosmetics)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    cosmetic_id UUID NOT NULL REFERENCES cosmetics_catalog(id),
    acquired_date TIMESTAMPTZ DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT false,
    UNIQUE(user_id, cosmetic_id)
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Users can view their own inventory
CREATE POLICY "Users can view own inventory" ON inventory
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert into their own inventory
CREATE POLICY "Users can add to own inventory" ON inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own inventory
CREATE POLICY "Users can update own inventory" ON inventory
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Equipped Loadout (currently equipped items)
-- ============================================
CREATE TABLE IF NOT EXISTS loadouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    skin_equipped UUID REFERENCES cosmetics_catalog(id),
    emote_equipped UUID REFERENCES cosmetics_catalog(id),
    banner_equipped UUID REFERENCES cosmetics_catalog(id),
    nameplate_equipped UUID REFERENCES cosmetics_catalog(id),
    effect_equipped UUID REFERENCES cosmetics_catalog(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE loadouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own loadout
CREATE POLICY "Users can view own loadout" ON loadouts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own loadout
CREATE POLICY "Users can create own loadout" ON loadouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own loadout
CREATE POLICY "Users can update own loadout" ON loadouts
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Indexes for Query Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cosmetics_type ON cosmetics_catalog(type);
CREATE INDEX IF NOT EXISTS idx_cosmetics_rarity ON cosmetics_catalog(rarity);
CREATE INDEX IF NOT EXISTS idx_cosmetics_is_limited ON cosmetics_catalog(is_limited) WHERE is_limited = true;
CREATE INDEX IF NOT EXISTS idx_cosmetics_release_date ON cosmetics_catalog(release_date DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_cosmetic ON inventory(cosmetic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_equipped ON inventory(user_id, is_equipped) WHERE is_equipped = true;

CREATE INDEX IF NOT EXISTS idx_loadouts_user ON loadouts(user_id);

-- ============================================
-- Trigger to update loadouts.updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_loadouts_updated_at ON loadouts;
CREATE TRIGGER update_loadouts_updated_at
    BEFORE UPDATE ON loadouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- DROP TABLE IF EXISTS loadouts;
-- DROP TABLE IF EXISTS inventory;
-- DROP TABLE IF EXISTS cosmetics_catalog;
