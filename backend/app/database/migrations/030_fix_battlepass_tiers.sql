-- 030_fix_battlepass_tiers.sql
-- Rebuild Battle Pass tiers with proper cosmetic distribution
-- Based on seed_battlepass_season1.py structure
--
-- YOUR REQUIREMENTS:
-- Free track: Tier 1 skin + 2 player cards + 500 coins total
-- Premium track: 1500 coins total + cosmetics
-- Keep Tier 1 and Tier 35 rewards in original positions

DO $$
DECLARE
    v_season_id UUID;
    -- Skin IDs
    v_frostborne_id UUID;
    v_plasma_id UUID;
    v_abyssal_id UUID;
    v_void_id UUID;
    v_solar_id UUID;
    v_molten_id UUID;
    -- Player Card IDs
    v_frostborne_card_id UUID;
    v_plasma_card_id UUID;
    v_abyssal_card_id UUID;
    v_void_card_id UUID;
    v_solar_card_id UUID;
    v_molten_card_id UUID;
    -- Emote IDs
    v_frost_sparkle_id UUID;
    v_crown_flex_id UUID;
    v_cyber_glitch_id UUID;
    v_ethereal_bloom_id UUID;
    v_fire_dragon_id UUID;
    v_lava_burst_id UUID;
    v_abyssal_terror_id UUID;
    v_void_laugh_id UUID;
BEGIN
    -- Get active season
    SELECT id INTO v_season_id FROM seasons WHERE is_active = true LIMIT 1;
    
    IF v_season_id IS NULL THEN
        RAISE EXCEPTION 'No active season found!';
    END IF;
    
    RAISE NOTICE 'Active season: %', v_season_id;
    
    -- Get Skin IDs by name
    SELECT id INTO v_frostborne_id FROM cosmetics_catalog WHERE name = 'Frostborne Valkyrie' AND type = 'skin';
    SELECT id INTO v_plasma_id FROM cosmetics_catalog WHERE name = 'Plasma Ranger' AND type = 'skin';
    SELECT id INTO v_abyssal_id FROM cosmetics_catalog WHERE name = 'Abyssal Leviathan' AND type = 'skin';
    SELECT id INTO v_void_id FROM cosmetics_catalog WHERE name = 'Void Sovereign' AND type = 'skin';
    SELECT id INTO v_solar_id FROM cosmetics_catalog WHERE name = 'Solar Champion' AND type = 'skin';
    SELECT id INTO v_molten_id FROM cosmetics_catalog WHERE name = 'Molten Warlord' AND type = 'skin';
    
    -- Get Player Card IDs by name
    SELECT id INTO v_frostborne_card_id FROM cosmetics_catalog WHERE name = 'Frostborne Valkyrie Card' AND type = 'playercard';
    SELECT id INTO v_plasma_card_id FROM cosmetics_catalog WHERE name = 'Plasma Ranger Card' AND type = 'playercard';
    SELECT id INTO v_abyssal_card_id FROM cosmetics_catalog WHERE name = 'Abyssal Leviathan Card' AND type = 'playercard';
    SELECT id INTO v_void_card_id FROM cosmetics_catalog WHERE name = 'Void Sovereign Card' AND type = 'playercard';
    SELECT id INTO v_solar_card_id FROM cosmetics_catalog WHERE name = 'Solar Champion Card' AND type = 'playercard';
    SELECT id INTO v_molten_card_id FROM cosmetics_catalog WHERE name = 'Molten Warlord Card' AND type = 'playercard';
    
    -- Get Emote IDs by name
    SELECT id INTO v_frost_sparkle_id FROM cosmetics_catalog WHERE name = 'Frost Sparkle' AND type = 'emote';
    SELECT id INTO v_crown_flex_id FROM cosmetics_catalog WHERE name = 'Crown Flex' AND type = 'emote';
    SELECT id INTO v_cyber_glitch_id FROM cosmetics_catalog WHERE name = 'Cyber Glitch' AND type = 'emote';
    SELECT id INTO v_ethereal_bloom_id FROM cosmetics_catalog WHERE name = 'Ethereal Bloom' AND type = 'emote';
    SELECT id INTO v_fire_dragon_id FROM cosmetics_catalog WHERE name = 'Fire Dragon' AND type = 'emote';
    SELECT id INTO v_lava_burst_id FROM cosmetics_catalog WHERE name = 'Lava Burst' AND type = 'emote';
    SELECT id INTO v_abyssal_terror_id FROM cosmetics_catalog WHERE name = 'Abyssal Terror' AND type = 'emote';
    SELECT id INTO v_void_laugh_id FROM cosmetics_catalog WHERE name = 'Void Laugh' AND type = 'emote';
    
    -- Log what we found
    RAISE NOTICE 'Skins found: Frostborne=%, Plasma=%, Abyssal=%, Void=%, Solar=%, Molten=%',
        v_frostborne_id IS NOT NULL, v_plasma_id IS NOT NULL, v_abyssal_id IS NOT NULL,
        v_void_id IS NOT NULL, v_solar_id IS NOT NULL, v_molten_id IS NOT NULL;
    
    RAISE NOTICE 'Cards found: Frostborne=%, Plasma=%, Abyssal=%, Void=%, Solar=%, Molten=%',
        v_frostborne_card_id IS NOT NULL, v_plasma_card_id IS NOT NULL, v_abyssal_card_id IS NOT NULL,
        v_void_card_id IS NOT NULL, v_solar_card_id IS NOT NULL, v_molten_card_id IS NOT NULL;
    
    -- Clear existing tiers
    DELETE FROM battlepass_tiers WHERE season_id = v_season_id;
    RAISE NOTICE 'Cleared existing tiers';
    
    -- Insert all 35 tiers
    -- FREE TRACK: Tier 1 skin + Tier 10,20 playercards + 500 coins (100+150+100+150)
    -- PREMIUM TRACK: 1500 coins + skins + emotes + playercards
    
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward) VALUES
    -- Tier 1: FREE Frostborne Valkyrie skin + Premium emote
    (v_season_id, 1, 
        jsonb_build_object('type', 'cosmetic', 'value', v_frostborne_id),
        jsonb_build_object('type', 'cosmetic', 'value', v_frost_sparkle_id)),
    
    -- Tier 2: Premium 100 coins
    (v_season_id, 2, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 3: Premium Crown Flex emote
    (v_season_id, 3, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_crown_flex_id)),
    
    -- Tier 4: Premium 100 coins
    (v_season_id, 4, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 5: FREE 100 coins + Premium Frostborne Card
    (v_season_id, 5, 
        jsonb_build_object('type', 'coins', 'value', 100),
        jsonb_build_object('type', 'cosmetic', 'value', v_frostborne_card_id)),
    
    -- Tier 6: Premium Cyber Glitch emote
    (v_season_id, 6, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_cyber_glitch_id)),
    
    -- Tier 7: Premium 100 coins
    (v_season_id, 7, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 8: Premium Plasma Ranger skin
    (v_season_id, 8, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_plasma_id)),
    
    -- Tier 9: Premium Plasma Ranger Card
    (v_season_id, 9, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_plasma_card_id)),
    
    -- Tier 10: FREE Playercard (Abyssal) + Premium 100 coins
    (v_season_id, 10, 
        jsonb_build_object('type', 'cosmetic', 'value', v_abyssal_card_id),
        jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 11: Premium Ethereal Bloom emote
    (v_season_id, 11, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_ethereal_bloom_id)),
    
    -- Tier 12: Premium 100 coins
    (v_season_id, 12, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 13: Premium Fire Dragon emote
    (v_season_id, 13, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_fire_dragon_id)),
    
    -- Tier 14: Premium 100 coins
    (v_season_id, 14, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 15: FREE 150 coins + Premium Abyssal Leviathan skin
    (v_season_id, 15, 
        jsonb_build_object('type', 'coins', 'value', 150),
        jsonb_build_object('type', 'cosmetic', 'value', v_abyssal_id)),
    
    -- Tier 16: Premium Void Sovereign Card
    (v_season_id, 16, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_void_card_id)),
    
    -- Tier 17: Premium 100 coins
    (v_season_id, 17, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 18: Premium Lava Burst emote
    (v_season_id, 18, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_lava_burst_id)),
    
    -- Tier 19: Premium 100 coins
    (v_season_id, 19, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 20: FREE Playercard (Void) + Premium 100 coins
    (v_season_id, 20, 
        jsonb_build_object('type', 'cosmetic', 'value', v_void_card_id),
        jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 21: Premium Abyssal Terror emote
    (v_season_id, 21, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_abyssal_terror_id)),
    
    -- Tier 22: Premium Void Sovereign skin
    (v_season_id, 22, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_void_id)),
    
    -- Tier 23: Premium Solar Champion Card
    (v_season_id, 23, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_solar_card_id)),
    
    -- Tier 24: Premium 100 coins
    (v_season_id, 24, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 25: FREE 100 coins + Premium 100 coins
    (v_season_id, 25, 
        jsonb_build_object('type', 'coins', 'value', 100),
        jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 26: Premium Void Laugh emote (legendary)
    (v_season_id, 26, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_void_laugh_id)),
    
    -- Tier 27: Premium 100 coins
    (v_season_id, 27, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 28: Premium 100 coins
    (v_season_id, 28, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 29: Premium Solar Champion skin
    (v_season_id, 29, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_solar_id)),
    
    -- Tier 30: FREE 150 coins + Premium Molten Warlord Card
    (v_season_id, 30, 
        jsonb_build_object('type', 'coins', 'value', 150),
        jsonb_build_object('type', 'cosmetic', 'value', v_molten_card_id)),
    
    -- Tier 31: Premium 100 coins
    (v_season_id, 31, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 32: Premium 100 coins
    (v_season_id, 32, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 33: Premium 100 coins
    (v_season_id, 33, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 34: Premium 100 coins
    (v_season_id, 34, NULL, jsonb_build_object('type', 'coins', 'value', 100)),
    
    -- Tier 35: Premium Molten Warlord skin (LEGENDARY finale)
    (v_season_id, 35, NULL, jsonb_build_object('type', 'cosmetic', 'value', v_molten_id));
    
    RAISE NOTICE 'Battle pass tiers rebuilt successfully!';
    RAISE NOTICE 'FREE TRACK: Tier 1 skin + Tier 10,20 playercards + 500 coins';
    RAISE NOTICE 'PREMIUM TRACK: 1500 coins + 5 skins + 8 emotes + 5 playercards';
    
END $$;

-- Verify the distribution
SELECT 'Free Coins' as track, SUM((free_reward->>'value')::int) as total_coins
FROM battlepass_tiers WHERE free_reward->>'type' = 'coins'
UNION ALL
SELECT 'Premium Coins' as track, SUM((premium_reward->>'value')::int) as total_coins
FROM battlepass_tiers WHERE premium_reward->>'type' = 'coins';

-- Show tier summary
SELECT tier_number, 
    CASE 
        WHEN free_reward IS NULL THEN '—'
        WHEN free_reward->>'type' = 'cosmetic' THEN 
            (SELECT name FROM cosmetics_catalog WHERE id = (free_reward->>'value')::uuid)
        ELSE (free_reward->>'type')::text || ': ' || (free_reward->>'value')::text 
    END as free_reward,
    CASE 
        WHEN premium_reward IS NULL THEN '—'
        WHEN premium_reward->>'type' = 'cosmetic' THEN 
            (SELECT name FROM cosmetics_catalog WHERE id = (premium_reward->>'value')::uuid)
        ELSE (premium_reward->>'type')::text || ': ' || (premium_reward->>'value')::text 
    END as premium_reward
FROM battlepass_tiers ORDER BY tier_number;
