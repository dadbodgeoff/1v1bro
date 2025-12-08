-- 011_shop_preview_url.sql
-- Add shop_preview_url column for custom shop preview images
-- This allows custom-designed preview images separate from sprite sheets

-- ============================================
-- Add shop_preview_url column
-- ============================================

ALTER TABLE cosmetics_catalog 
    ADD COLUMN IF NOT EXISTS shop_preview_url TEXT;

-- Comment explaining the column
COMMENT ON COLUMN cosmetics_catalog.shop_preview_url IS 
    'Custom shop preview image URL. If set, used instead of image_url in shop displays.';

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- ALTER TABLE cosmetics_catalog DROP COLUMN IF EXISTS shop_preview_url;
