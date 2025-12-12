-- 034_achievement_system_extension.sql
-- Achievement System Extension: Add coin rewards and new achievement categories
-- Requirements: 5.1, 5.2, 5.3, 5.5 - Achievement Categories and Definitions

-- ============================================
-- Add coin_reward column to achievements table
-- ============================================
ALTER TABLE achievements
ADD COLUMN IF NOT EXISTS coin_reward INTEGER DEFAULT 3;

-- Update existing achievements to have coin_reward = 3
UPDATE achievements SET coin_reward = 3 WHERE coin_reward IS NULL;

-- ============================================
-- Add new achievement categories: combat, accuracy, social
-- ============================================

-- Combat Category (5 achievements)
INSERT INTO achievements (name, description, icon_url, rarity, category, criteria_type, criteria_value, sort_order, coin_reward) VALUES
    ('First Blood', 'Get your first kill', '/achievements/first_blood.png', 'common', 'combat', 'total_kills', 1, 30, 3),
    ('Warrior', 'Get 50 kills', '/achievements/warrior.png', 'uncommon', 'combat', 'total_kills', 50, 31, 3),
    ('Slayer', 'Get 200 kills', '/achievements/slayer.png', 'rare', 'combat', 'total_kills', 200, 32, 3),
    ('Destroyer', 'Get 500 kills', '/achievements/destroyer.png', 'epic', 'combat', 'total_kills', 500, 33, 3),
    ('Annihilator', 'Get 1000 kills', '/achievements/annihilator.png', 'legendary', 'combat', 'total_kills', 1000, 34, 3)
ON CONFLICT DO NOTHING;

-- Accuracy Category (4 achievements)
INSERT INTO achievements (name, description, icon_url, rarity, category, criteria_type, criteria_value, sort_order, coin_reward) VALUES
    ('Sharpshooter', 'Achieve 60% accuracy', '/achievements/sharpshooter.png', 'uncommon', 'accuracy', 'accuracy', 60, 40, 3),
    ('Marksman', 'Achieve 70% accuracy', '/achievements/marksman.png', 'rare', 'accuracy', 'accuracy', 70, 41, 3),
    ('Sniper', 'Achieve 80% accuracy', '/achievements/sniper.png', 'epic', 'accuracy', 'accuracy', 80, 42, 3),
    ('Perfect Aim', 'Achieve 90% accuracy', '/achievements/perfect_aim.png', 'legendary', 'accuracy', 'accuracy', 90, 43, 3)
ON CONFLICT DO NOTHING;

-- Social Category (5 achievements)
-- Note: friends_count is calculated from friendships table where status='accepted'
INSERT INTO achievements (name, description, icon_url, rarity, category, criteria_type, criteria_value, sort_order, coin_reward) VALUES
    ('Friendly', 'Add your first friend', '/achievements/friendly.png', 'common', 'social', 'friends_count', 1, 50, 3),
    ('Social', 'Have 5 friends', '/achievements/social.png', 'uncommon', 'social', 'friends_count', 5, 51, 3),
    ('Popular', 'Have 10 friends', '/achievements/popular.png', 'rare', 'social', 'friends_count', 10, 52, 3),
    ('Celebrity', 'Have 25 friends', '/achievements/celebrity.png', 'epic', 'social', 'friends_count', 25, 53, 3),
    ('Influencer', 'Have 50 friends', '/achievements/influencer.png', 'legendary', 'social', 'friends_count', 50, 54, 3)
ON CONFLICT DO NOTHING;

-- Add a bonus achievement for completing all achievements in a category
INSERT INTO achievements (name, description, icon_url, rarity, category, criteria_type, criteria_value, sort_order, coin_reward) VALUES
    ('Completionist', 'Earn all achievements in any category', '/achievements/completionist.png', 'legendary', 'special', 'category_complete', 1, 100, 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- Create helper function to count friends
-- ============================================
CREATE OR REPLACE FUNCTION get_friend_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM friendships
        WHERE (user_id = p_user_id OR friend_id = p_user_id)
          AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_friend_count TO authenticated;

-- ============================================
-- Create helper function to calculate accuracy
-- ============================================
CREATE OR REPLACE FUNCTION get_player_accuracy(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_shots_fired INTEGER;
    v_shots_hit INTEGER;
BEGIN
    SELECT shots_fired, shots_hit INTO v_shots_fired, v_shots_hit
    FROM user_profiles
    WHERE id = p_user_id;
    
    IF v_shots_fired IS NULL OR v_shots_fired = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN FLOOR((v_shots_hit::FLOAT / v_shots_fired::FLOAT) * 100)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_player_accuracy TO authenticated;

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- DELETE FROM achievements WHERE category IN ('combat', 'accuracy', 'social', 'special');
-- ALTER TABLE achievements DROP COLUMN IF EXISTS coin_reward;
-- DROP FUNCTION IF EXISTS get_friend_count;
-- DROP FUNCTION IF EXISTS get_player_accuracy;
