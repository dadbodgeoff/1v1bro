-- 013_achievements.sql
-- Achievements system: achievement definitions and user earned achievements
-- Requirements: Profile Enterprise - Achievements Section

-- ============================================
-- Achievement Definitions Table
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    category VARCHAR(50) DEFAULT 'general',
    -- Unlock criteria (JSON for flexibility)
    criteria_type VARCHAR(50) NOT NULL, -- 'games_played', 'games_won', 'win_streak', 'level', 'custom'
    criteria_value INTEGER DEFAULT 1,
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view achievements
CREATE POLICY "Authenticated users can view achievements" ON achievements
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- User Earned Achievements Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate achievements
    UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view other users' achievements (for profile display)
CREATE POLICY "Users can view others achievements" ON user_achievements
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- Indexes for Query Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at DESC);

-- ============================================
-- Trigger to update achievements.updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;
CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed Initial Achievements
-- ============================================
INSERT INTO achievements (name, description, icon_url, rarity, category, criteria_type, criteria_value, sort_order) VALUES
    -- Games Played Achievements
    ('First Steps', 'Play your first game', '/achievements/first_steps.png', 'common', 'games', 'games_played', 1, 1),
    ('Getting Started', 'Play 10 games', '/achievements/getting_started.png', 'common', 'games', 'games_played', 10, 2),
    ('Regular Player', 'Play 50 games', '/achievements/regular_player.png', 'uncommon', 'games', 'games_played', 50, 3),
    ('Dedicated', 'Play 100 games', '/achievements/dedicated.png', 'rare', 'games', 'games_played', 100, 4),
    ('Veteran', 'Play 500 games', '/achievements/veteran.png', 'epic', 'games', 'games_played', 500, 5),
    ('Legend', 'Play 1000 games', '/achievements/legend.png', 'legendary', 'games', 'games_played', 1000, 6),
    
    -- Wins Achievements
    ('First Victory', 'Win your first game', '/achievements/first_victory.png', 'common', 'wins', 'games_won', 1, 10),
    ('Winner', 'Win 10 games', '/achievements/winner.png', 'uncommon', 'wins', 'games_won', 10, 11),
    ('Champion', 'Win 50 games', '/achievements/champion.png', 'rare', 'wins', 'games_won', 50, 12),
    ('Master', 'Win 100 games', '/achievements/master.png', 'epic', 'wins', 'games_won', 100, 13),
    ('Unstoppable', 'Win 500 games', '/achievements/unstoppable.png', 'legendary', 'wins', 'games_won', 500, 14),
    
    -- Win Streak Achievements
    ('Hot Streak', 'Win 3 games in a row', '/achievements/hot_streak.png', 'uncommon', 'streaks', 'win_streak', 3, 20),
    ('On Fire', 'Win 5 games in a row', '/achievements/on_fire.png', 'rare', 'streaks', 'win_streak', 5, 21),
    ('Dominator', 'Win 10 games in a row', '/achievements/dominator.png', 'epic', 'streaks', 'win_streak', 10, 22),
    ('Invincible', 'Win 20 games in a row', '/achievements/invincible.png', 'legendary', 'streaks', 'win_streak', 20, 23)
ON CONFLICT DO NOTHING;

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- DROP TABLE IF EXISTS user_achievements;
-- DROP TABLE IF EXISTS achievements;
