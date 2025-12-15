-- Migration 038: Add model_url column for 3D skin previews
-- 
-- Adds support for 3D GLB model previews in the shop.
-- When a cosmetic has a model_url, the shop will show an interactive
-- 3D preview on hover instead of the 2D sprite preview.

-- Add model_url column to cosmetics_catalog
ALTER TABLE cosmetics_catalog 
    ADD COLUMN IF NOT EXISTS model_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN cosmetics_catalog.model_url IS '3D GLB model URL for interactive shop preview';
