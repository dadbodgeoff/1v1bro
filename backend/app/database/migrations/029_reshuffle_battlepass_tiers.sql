-- 029_reshuffle_battlepass_tiers.sql
-- Reshuffle Battle Pass Tiers with systematic distribution
--
-- Structure (35 tiers):
-- FREE TRACK (500 coins total):
--   Tier 1: Keep existing skin
--   Tier 5: 100 coins
--   Tier 10: Player Card
--   Tier 15: 150 coins  
--   Tier 20: Player Card
--   Tier 25: 100 coins
--   Tier 30: 150 coins
--
-- PREMIUM TRACK (1500 coins total):
--   Distributed across tiers with cosmetics

-- First, let's clear existing tiers except tier 1 and 35 rewards
-- We'll rebuild them systematically

-- Get the active season ID
DO $$
DECLARE
    v_season_id UUID;
    v_tier1_free JSONB;
    v_tier35_premium JSONB;
    v_skin_ids UUID[];
    v_banner_ids UUID[];
    v_emote_ids UUID[];
    v_playercard_ids UUID[];
    v_idx INTEGER := 1;
BEGIN
    -- Get active season
    SELECT id INTO v_season_id FROM seasons WHERE is_active = true LIMIT 1;
    
    IF v_season_id IS NULL THEN
        RAISE NOTICE 'No active season found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Active season: %', v_season_id;
    
    -- Preserve tier 1 and tier 35 rewards
    SELECT free_reward INTO v_tier1_free 
    FROM battlepass_tiers 
    WHERE season_id = v_season_id AND tier_number = 1;
    
    SELECT premium_reward INTO v_tier35_premium 
    FROM battlepass_tiers 
    WHERE season_id = v_season_id AND tier_number = 35;
    
    RAISE NOTICE 'Tier 1 free: %', v_tier1_free;
    RAISE NOTICE 'Tier 35 premium: %', v_tier35_premium;
    
    -- Get available cosmetics (excluding battle pass exclusives if marked)
    SELECT ARRAY_AGG(id ORDER BY RANDOM()) INTO v_skin_ids
    FROM cosmetics_catalog 
    WHERE type = 'skin' 
    AND COALESCE(is_limited, false) = false;
    
    SELECT ARRAY_AGG(id ORDER BY RANDOM()) INTO v_banner_ids
    FROM cosmetics_catalog 
    WHERE type = 'banner';
    
    SELECT ARRAY_AGG(id ORDER BY RANDOM()) INTO v_emote_ids
    FROM cosmetics_catalog 
    WHERE type = 'emote';
    
    SELECT ARRAY_AGG(id ORDER BY RANDOM()) INTO v_playercard_ids
    FROM cosmetics_catalog 
    WHERE type = 'playercard'
    AND name != 'Coins';
    
    RAISE NOTICE 'Found % skins, % banners, % emotes, % playercards',
        COALESCE(array_length(v_skin_ids, 1), 0),
        COALESCE(array_length(v_banner_ids, 1), 0),
        COALESCE(array_length(v_emote_ids, 1), 0),
        COALESCE(array_length(v_playercard_ids, 1), 0);
    
    -- Delete existing tiers for this season
    DELETE FROM battlepass_tiers WHERE season_id = v_season_id;

    
    -- Insert new tiers with systematic distribution
    
    -- Tier 1: Free skin (preserved) + Premium banner
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 1, 
        v_tier1_free,
        jsonb_build_object('type', 'cosmetic', 'value', v_banner_ids[1])
    );
    
    -- Tier 2: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 2, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 3: Premium banner
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 3, NULL, 
        jsonb_build_object('type', 'cosmetic', 'value', v_banner_ids[2])
    );
    
    -- Tier 4: Premium emote
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 4, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_emote_ids[1])
    );
    
    -- Tier 5: Free 100 coins + Premium playercard
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 5, 
        jsonb_build_object('type', 'coins', 'value', 100),
        jsonb_build_object('type', 'cosmetic', 'value', v_playercard_ids[1])
    );
    
    -- Tier 6: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 6, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 7: Premium playercard
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 7, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_playercard_ids[2])
    );
    
    -- Tier 8: Premium banner
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 8, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_banner_ids[3])
    );
    
    -- Tier 9: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 9, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 10: Free playercard + Premium emote
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 10,
        jsonb_build_object('type', 'cosmetic', 'value', v_playercard_ids[3]),
        jsonb_build_object('type', 'cosmetic', 'value', v_emote_ids[2])
    );
    
    -- Tier 11: Premium emote
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 11, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_emote_ids[3])
    );
    
    -- Tier 12: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 12, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 13: Premium banner
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 13, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_banner_ids[4])
    );
    
    -- Tier 14: Premium playercard
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 14, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_playercard_ids[4])
    );
    
    -- Tier 15: Free 150 coins + Premium emote
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 15,
        jsonb_build_object('type', 'coins', 'value', 150),
        jsonb_build_object('type', 'cosmetic', 'value', v_emote_ids[4])
    );
    
    -- Tier 16: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 16, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 17: Premium emote
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 17, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_emote_ids[5])
    );
    
    -- Tier 18: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 18, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 19: Premium banner
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 19, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_banner_ids[5])
    );
    
    -- Tier 20: Free playercard + Premium skin
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 20,
        jsonb_build_object('type', 'cosmetic', 'value', v_playercard_ids[5]),
        jsonb_build_object('type', 'cosmetic', 'value', v_skin_ids[1])
    );

    
    -- Tier 21: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 21, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 22: Premium skin
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 22, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_skin_ids[2])
    );
    
    -- Tier 23: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 23, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 24: Premium emote
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 24, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_emote_ids[6])
    );
    
    -- Tier 25: Free 100 coins + Premium banner
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 25,
        jsonb_build_object('type', 'coins', 'value', 100),
        jsonb_build_object('type', 'cosmetic', 'value', v_banner_ids[6])
    );
    
    -- Tier 26: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 26, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 27: Premium banner
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 27, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_banner_ids[7])
    );
    
    -- Tier 28: Premium playercard
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 28, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_playercard_ids[6])
    );
    
    -- Tier 29: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 29, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 30: Free 150 coins + Premium skin
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 30,
        jsonb_build_object('type', 'coins', 'value', 150),
        jsonb_build_object('type', 'cosmetic', 'value', v_skin_ids[3])
    );
    
    -- Tier 31: Premium emote
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 31, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_emote_ids[7])
    );
    
    -- Tier 32: Premium 100 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 32, NULL, jsonb_build_object('type', 'coins', 'value', 100));
    
    -- Tier 33: Premium banner
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 33, NULL,
        jsonb_build_object('type', 'cosmetic', 'value', v_banner_ids[8])
    );
    
    -- Tier 34: Premium 200 coins
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 34, NULL, jsonb_build_object('type', 'coins', 'value', 200));
    
    -- Tier 35: Premium legendary (preserved)
    INSERT INTO battlepass_tiers (season_id, tier_number, free_reward, premium_reward)
    VALUES (v_season_id, 35, NULL, v_tier35_premium);
    
    RAISE NOTICE 'Battle pass tiers reshuffled successfully!';
    RAISE NOTICE 'Free track: Tier 1 skin + Tier 10,20 playercards + 500 coins (5,15,25,30)';
    RAISE NOTICE 'Premium track: 1500 coins + multiple cosmetics';
    
END $$;

-- Verify the distribution
SELECT 
    'Free Coins' as track,
    SUM((free_reward->>'value')::int) as total_coins
FROM battlepass_tiers 
WHERE free_reward->>'type' = 'coins'
UNION ALL
SELECT 
    'Premium Coins' as track,
    SUM((premium_reward->>'value')::int) as total_coins
FROM battlepass_tiers 
WHERE premium_reward->>'type' = 'coins';
