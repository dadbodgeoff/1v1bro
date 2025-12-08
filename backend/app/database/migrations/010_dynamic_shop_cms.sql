-- 010_dynamic_shop_cms.sql
-- Dynamic Shop CMS: Extensions for dynamic asset loading and shop rotations
-- Requirements: 2.1, 2.4, 3.1, 3.3, 3.4, 6.3

-- ============================================
-- Cosmetics Catalog Extensions
-- ============================================

-- Add new columns for dynamic asset loading and shop features
ALTER TABLE cosmetics_catalog 
    ADD COLUMN IF NOT EXISTS sprite_sheet_url TEXT,
    ADD COLUMN IF NOT EXISTS sprite_meta_url TEXT,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rotation_group VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Indexes for featured and availability queries
CREATE INDEX IF NOT EXISTS idx_cosmetics_featured 
    ON cosmetics_catalog(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_cosmetics_availability 
    ON cosmetics_catalog(available_from, available_until);

CREATE INDEX IF NOT EXISTS idx_cosmetics_rotation_group 
    ON cosmetics_catalog(rotation_group) WHERE rotation_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cosmetics_sort_order 
    ON cosmetics_catalog(sort_order);

-- ============================================
-- Asset Metadata Table
-- ============================================

CREATE TABLE IF NOT EXISTS asset_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cosmetic_id UUID REFERENCES cosmetics_catalog(id) ON DELETE CASCADE,
    asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('image', 'sprite_sheet', 'sprite_meta', 'video')),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    frame_count INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES user_profiles(id)
);

-- Enable RLS
ALTER TABLE asset_metadata ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view asset metadata
CREATE POLICY "Authenticated users can view asset metadata" ON asset_metadata
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update/delete (admin operations via backend)
CREATE POLICY "Service role can manage asset metadata" ON asset_metadata
    FOR ALL USING (auth.role() = 'service_role');

-- Indexes for asset metadata queries
CREATE INDEX IF NOT EXISTS idx_asset_metadata_cosmetic 
    ON asset_metadata(cosmetic_id);

CREATE INDEX IF NOT EXISTS idx_asset_metadata_type 
    ON asset_metadata(asset_type);

-- ============================================
-- Shop Rotations Table
-- ============================================

CREATE TABLE IF NOT EXISTS shop_rotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    rotation_type VARCHAR(20) NOT NULL CHECK (rotation_type IN ('daily', 'weekly', 'event', 'manual')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    featured_cosmetic_ids UUID[] DEFAULT '{}',
    rotation_rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Enable RLS
ALTER TABLE shop_rotations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view rotations
CREATE POLICY "Authenticated users can view rotations" ON shop_rotations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can manage rotations (admin operations via backend)
CREATE POLICY "Service role can manage rotations" ON shop_rotations
    FOR ALL USING (auth.role() = 'service_role');

-- Indexes for rotation queries
CREATE INDEX IF NOT EXISTS idx_rotations_active 
    ON shop_rotations(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_rotations_dates 
    ON shop_rotations(starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_rotations_type 
    ON shop_rotations(rotation_type);

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- DROP TABLE IF EXISTS shop_rotations;
-- DROP TABLE IF EXISTS asset_metadata;
-- ALTER TABLE cosmetics_catalog 
--     DROP COLUMN IF EXISTS sprite_sheet_url,
--     DROP COLUMN IF EXISTS sprite_meta_url,
--     DROP COLUMN IF EXISTS is_featured,
--     DROP COLUMN IF EXISTS available_from,
--     DROP COLUMN IF EXISTS rotation_group,
--     DROP COLUMN IF EXISTS sort_order;
-- DROP INDEX IF EXISTS idx_cosmetics_featured;
-- DROP INDEX IF EXISTS idx_cosmetics_availability;
-- DROP INDEX IF EXISTS idx_cosmetics_rotation_group;
-- DROP INDEX IF EXISTS idx_cosmetics_sort_order;
