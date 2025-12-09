-- Migration: Fix skin_id mappings for bundled skins
-- This updates cosmetics to use bundled sprite sheets instead of CMS URLs
-- 
-- BUNDLED SKINS: Use skin_id (loaded from frontend assets)
-- CMS SKINS: Use sprite_sheet_url (loaded dynamically from Supabase Storage)

-- ============================================
-- Ensure skin_id column exists (may be missing if migration 007 was partial)
-- ============================================
ALTER TABLE cosmetics_catalog 
    ADD COLUMN IF NOT EXISTS skin_id VARCHAR(50);

-- ============================================
-- Fix BUNDLED skins - clear sprite_sheet_url, set skin_id
-- These have sprite sheets bundled in the frontend build
-- ============================================

-- Update Tactical Banana to use bundled skin
UPDATE cosmetics_catalog 
SET skin_id = 'bananaTactical',
    sprite_sheet_url = NULL,
    sprite_meta_url = NULL
WHERE name = 'Tactical Banana' AND type = 'skin';

-- Update Armored Knight to use bundled skin
UPDATE cosmetics_catalog 
SET skin_id = 'knightGold',
    sprite_sheet_url = NULL,
    sprite_meta_url = NULL
WHERE name = 'Armored Knight' AND type = 'skin';

-- Update Armored Soldier to use bundled skin
UPDATE cosmetics_catalog 
SET skin_id = 'soldierPurple',
    sprite_sheet_url = NULL,
    sprite_meta_url = NULL
WHERE name = 'Armored Soldier' AND type = 'skin';

-- Update Matrix Wraith to use bundled skin
UPDATE cosmetics_catalog 
SET skin_id = 'wraithMatrix',
    sprite_sheet_url = NULL,
    sprite_meta_url = NULL
WHERE name = 'Matrix Wraith' AND type = 'skin';

-- Update Cyber Ninja to use bundled skin
UPDATE cosmetics_catalog 
SET skin_id = 'ninjaCyber',
    sprite_sheet_url = NULL,
    sprite_meta_url = NULL
WHERE name = 'Cyber Ninja' AND type = 'skin';

-- ============================================
-- Ensure CMS skins have sprite_sheet_url set (no skin_id)
-- These are loaded dynamically from Supabase Storage
-- ============================================

-- Note: New CMS skins will be inserted by seed_dynamic_cosmetics.py
-- This migration only fixes existing bundled skins that were misconfigured
