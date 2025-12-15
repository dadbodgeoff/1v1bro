-- Migration: Add runner type to cosmetics_catalog constraint
-- This fixes the missing runner type that was needed for 039_add_runner_equipped.sql

-- Drop the existing constraint
ALTER TABLE cosmetics_catalog DROP CONSTRAINT IF EXISTS cosmetics_catalog_type_check;

-- Add the new constraint with runner included
ALTER TABLE cosmetics_catalog ADD CONSTRAINT cosmetics_catalog_type_check 
    CHECK (type IN ('skin', 'emote', 'banner', 'nameplate', 'effect', 'trail', 'playercard', 'runner'));
