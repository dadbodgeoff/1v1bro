-- Migration: Add playercard cosmetic type
-- Description: Adds 'playercard' to the allowed cosmetic types for lobby banners

-- Drop the existing constraint
ALTER TABLE cosmetics_catalog DROP CONSTRAINT IF EXISTS cosmetics_catalog_type_check;

-- Add the new constraint with playercard included
ALTER TABLE cosmetics_catalog ADD CONSTRAINT cosmetics_catalog_type_check 
    CHECK (type IN ('skin', 'emote', 'banner', 'nameplate', 'effect', 'trail', 'playercard'));
