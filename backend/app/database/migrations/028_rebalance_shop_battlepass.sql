-- 028_rebalance_shop_battlepass.sql
-- Rebalance shop pricing and battle pass rewards
-- 
-- Pricing Structure:
-- - Battle Pass: 650 coins ($4.99)
-- - Skins: 200-350 coins based on rarity
-- - Banners: 50-150 coins based on rarity
-- - Emotes: 75-200 coins based on rarity
-- - Player Cards: 50-100 coins based on rarity

-- ============================================
-- Update Cosmetic Prices by Rarity
-- ============================================

-- Skins: 200-350 coins
UPDATE cosmetics_catalog SET price_coins = 200 WHERE type = 'skin' AND rarity = 'common';
UPDATE cosmetics_catalog SET price_coins = 225 WHERE type = 'skin' AND rarity = 'uncommon';
UPDATE cosmetics_catalog SET price_coins = 275 WHERE type = 'skin' AND rarity = 'rare';
UPDATE cosmetics_catalog SET price_coins = 325 WHERE type = 'skin' AND rarity = 'epic';
UPDATE cosmetics_catalog SET price_coins = 350 WHERE type = 'skin' AND rarity = 'legendary';

-- Banners: 50-150 coins
UPDATE cosmetics_catalog SET price_coins = 50 WHERE type = 'banner' AND rarity = 'common';
UPDATE cosmetics_catalog SET price_coins = 75 WHERE type = 'banner' AND rarity = 'uncommon';
UPDATE cosmetics_catalog SET price_coins = 100 WHERE type = 'banner' AND rarity = 'rare';
UPDATE cosmetics_catalog SET price_coins = 125 WHERE type = 'banner' AND rarity = 'epic';
UPDATE cosmetics_catalog SET price_coins = 150 WHERE type = 'banner' AND rarity = 'legendary';

-- Emotes: 75-200 coins
UPDATE cosmetics_catalog SET price_coins = 75 WHERE type = 'emote' AND rarity = 'common';
UPDATE cosmetics_catalog SET price_coins = 100 WHERE type = 'emote' AND rarity = 'uncommon';
UPDATE cosmetics_catalog SET price_coins = 150 WHERE type = 'emote' AND rarity = 'rare';
UPDATE cosmetics_catalog SET price_coins = 175 WHERE type = 'emote' AND rarity = 'epic';
UPDATE cosmetics_catalog SET price_coins = 200 WHERE type = 'emote' AND rarity = 'legendary';

-- Player Cards: 50-100 coins
UPDATE cosmetics_catalog SET price_coins = 50 WHERE type = 'playercard' AND rarity = 'common';
UPDATE cosmetics_catalog SET price_coins = 60 WHERE type = 'playercard' AND rarity = 'uncommon';
UPDATE cosmetics_catalog SET price_coins = 75 WHERE type = 'playercard' AND rarity = 'rare';
UPDATE cosmetics_catalog SET price_coins = 90 WHERE type = 'playercard' AND rarity = 'epic';
UPDATE cosmetics_catalog SET price_coins = 100 WHERE type = 'playercard' AND rarity = 'legendary';

-- Effects/Trails: 100-250 coins
UPDATE cosmetics_catalog SET price_coins = 100 WHERE type IN ('effect', 'trail') AND rarity = 'common';
UPDATE cosmetics_catalog SET price_coins = 125 WHERE type IN ('effect', 'trail') AND rarity = 'uncommon';
UPDATE cosmetics_catalog SET price_coins = 175 WHERE type IN ('effect', 'trail') AND rarity = 'rare';
UPDATE cosmetics_catalog SET price_coins = 225 WHERE type IN ('effect', 'trail') AND rarity = 'epic';
UPDATE cosmetics_catalog SET price_coins = 250 WHERE type IN ('effect', 'trail') AND rarity = 'legendary';

-- Nameplates: 75-175 coins
UPDATE cosmetics_catalog SET price_coins = 75 WHERE type = 'nameplate' AND rarity = 'common';
UPDATE cosmetics_catalog SET price_coins = 100 WHERE type = 'nameplate' AND rarity = 'uncommon';
UPDATE cosmetics_catalog SET price_coins = 125 WHERE type = 'nameplate' AND rarity = 'rare';
UPDATE cosmetics_catalog SET price_coins = 150 WHERE type = 'nameplate' AND rarity = 'epic';
UPDATE cosmetics_catalog SET price_coins = 175 WHERE type = 'nameplate' AND rarity = 'legendary';
