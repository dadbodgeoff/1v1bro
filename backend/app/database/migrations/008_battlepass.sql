-- 008_battlepass.sql
-- Battle Pass system: seasons, tiers, player progress, XP tracking
-- Requirements: 4.1, 4.2, 4.10

-- ============================================
-- Seasons (battle pass seasons)
-- ============================================
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_number INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    theme VARCHAR(100),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    xp_per_tier INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view seasons
CREATE POLICY "Authenticated users can view seasons" ON seasons
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- Battle Pass Tiers (rewards per tier)
-- ============================================
CREATE TABLE IF NOT EXISTS battlepass_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL,
    free_reward JSONB,
    premium_reward JSONB,
    UNIQUE(season_id, tier_number)
);

-- Enable RLS
ALTER TABLE battlepass_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view tiers
CREATE POLICY "Authenticated users can view tiers" ON battlepass_tiers
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- Player Battle Pass Progress
-- ============================================
CREATE TABLE IF NOT EXISTS player_battlepass (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    current_tier INTEGER DEFAULT 0,
    current_xp INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    claimed_rewards INTEGER[] DEFAULT '{}',
    purchased_tiers INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, season_id)
);

-- Enable RLS
ALTER TABLE player_battlepass ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own battlepass" ON player_battlepass
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can create own battlepass" ON player_battlepass
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own battlepass" ON player_battlepass
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- XP Logs (for analytics and auditing)
-- ============================================
CREATE TABLE IF NOT EXISTS xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL CHECK (source IN ('match_win', 'match_loss', 'season_challenge', 'daily_bonus', 'tier_purchase')),
    amount INTEGER NOT NULL,
    match_id UUID,
    challenge_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own XP logs
CREATE POLICY "Users can view own xp_logs" ON xp_logs
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Indexes for Query Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_battlepass_tiers_season ON battlepass_tiers(season_id);
CREATE INDEX IF NOT EXISTS idx_battlepass_tiers_number ON battlepass_tiers(season_id, tier_number);

CREATE INDEX IF NOT EXISTS idx_player_battlepass_user ON player_battlepass(user_id);
CREATE INDEX IF NOT EXISTS idx_player_battlepass_season ON player_battlepass(season_id);
CREATE INDEX IF NOT EXISTS idx_player_battlepass_user_season ON player_battlepass(user_id, season_id);

CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created ON xp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_logs_source ON xp_logs(source);

-- ============================================
-- Trigger to update player_battlepass.last_updated
-- ============================================
DROP TRIGGER IF EXISTS update_player_battlepass_updated_at ON player_battlepass;
CREATE TRIGGER update_player_battlepass_updated_at
    BEFORE UPDATE ON player_battlepass
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- DROP TABLE IF EXISTS xp_logs;
-- DROP TABLE IF EXISTS player_battlepass;
-- DROP TABLE IF EXISTS battlepass_tiers;
-- DROP TABLE IF EXISTS seasons;
