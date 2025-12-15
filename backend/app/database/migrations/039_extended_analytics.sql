-- Migration: 039_extended_analytics.sql
-- Extended analytics for survival game balance and user behavior tracking
-- Covers: trivia, auth events, milestones, shop, leaderboard, battle pass

-- ============================================
-- Trivia Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS survival_analytics_trivia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID,
    run_id TEXT,
    
    -- Question data
    question_id TEXT,
    category TEXT NOT NULL,
    difficulty TEXT,
    
    -- Answer data
    answer_given TEXT,
    correct BOOLEAN NOT NULL,
    time_to_answer_ms INTEGER,
    timed_out BOOLEAN DEFAULT FALSE,
    
    -- Context
    distance_at_question FLOAT,
    speed_at_question FLOAT,
    streak_before INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trivia_session ON survival_analytics_trivia(session_id);
CREATE INDEX IF NOT EXISTS idx_trivia_user ON survival_analytics_trivia(user_id);
CREATE INDEX IF NOT EXISTS idx_trivia_category ON survival_analytics_trivia(category);
CREATE INDEX IF NOT EXISTS idx_trivia_created ON survival_analytics_trivia(created_at);

-- ============================================
-- Auth Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_auth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    visitor_id TEXT,
    user_id UUID,
    
    event_type TEXT NOT NULL, -- login_success, login_failure, logout, signup_complete, etc.
    method TEXT, -- email, google, discord, etc.
    error_type TEXT,
    
    -- Context
    device_type TEXT,
    browser TEXT,
    ip_country TEXT,
    
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user ON analytics_auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON analytics_auth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_events_created ON analytics_auth_events(created_at);

-- ============================================
-- Milestone Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS survival_analytics_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID,
    run_id TEXT,
    
    milestone_type TEXT NOT NULL, -- distance, personal_best, rank_change, achievement
    milestone_value FLOAT,
    previous_value FLOAT,
    
    -- For rank changes
    old_rank INTEGER,
    new_rank INTEGER,
    
    -- For achievements
    achievement_id TEXT,
    achievement_name TEXT,
    
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_user ON survival_analytics_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON survival_analytics_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_milestones_created ON survival_analytics_milestones(created_at);

-- ============================================
-- Shop Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_shop_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID,
    
    event_type TEXT NOT NULL, -- view, item_view, preview, purchase_start, purchase_complete, purchase_failed
    
    -- Item data
    item_id TEXT,
    item_type TEXT,
    item_rarity TEXT,
    price INTEGER,
    currency TEXT, -- coins, premium
    
    -- For failures
    error_type TEXT,
    
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_user ON analytics_shop_events(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_type ON analytics_shop_events(event_type);
CREATE INDEX IF NOT EXISTS idx_shop_item ON analytics_shop_events(item_id);
CREATE INDEX IF NOT EXISTS idx_shop_created ON analytics_shop_events(created_at);

-- ============================================
-- Leaderboard Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_leaderboard_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID,
    
    event_type TEXT NOT NULL, -- view, scroll, player_click, filter_change, refresh
    
    user_rank INTEGER,
    max_rank_viewed INTEGER,
    target_user_id UUID,
    filter_type TEXT,
    filter_value TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_events_user ON analytics_leaderboard_events(user_id);
CREATE INDEX IF NOT EXISTS idx_lb_events_type ON analytics_leaderboard_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lb_events_created ON analytics_leaderboard_events(created_at);

-- ============================================
-- Battle Pass Analytics Table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_battlepass_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID,
    
    event_type TEXT NOT NULL, -- view, level_up, reward_claim, purchase, tier_skip
    
    current_level INTEGER,
    new_level INTEGER,
    xp_earned INTEGER,
    reward_type TEXT,
    reward_id TEXT,
    tiers_skipped INTEGER,
    cost INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bp_events_user ON analytics_battlepass_events(user_id);
CREATE INDEX IF NOT EXISTS idx_bp_events_type ON analytics_battlepass_events(event_type);
CREATE INDEX IF NOT EXISTS idx_bp_events_created ON analytics_battlepass_events(created_at);

-- ============================================
-- Extended Run Analytics (add columns)
-- ============================================
ALTER TABLE survival_analytics_runs 
ADD COLUMN IF NOT EXISTS trivia_questions_shown INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_wrong INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_timeouts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_best_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trivia_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS death_after_trivia_ms INTEGER,
ADD COLUMN IF NOT EXISTS ghost_loaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ghost_beaten BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ghost_margin FLOAT,
ADD COLUMN IF NOT EXISTS cosmetic_runner_id TEXT,
ADD COLUMN IF NOT EXISTS quick_restart_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pause_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pause_duration_ms INTEGER DEFAULT 0;

-- ============================================
-- Daily Trivia Aggregates View
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS survival_analytics_trivia_daily;

CREATE MATERIALIZED VIEW survival_analytics_trivia_daily AS
SELECT 
    DATE(created_at) as date,
    category,
    COUNT(*) as total_questions,
    COUNT(*) FILTER (WHERE correct = true) as correct_count,
    COUNT(*) FILTER (WHERE correct = false AND timed_out = false) as wrong_count,
    COUNT(*) FILTER (WHERE timed_out = true) as timeout_count,
    ROUND(AVG(time_to_answer_ms)::numeric, 0) as avg_time_ms,
    ROUND((COUNT(*) FILTER (WHERE correct = true)::float / NULLIF(COUNT(*), 0) * 100)::numeric, 2) as correct_rate,
    MAX(streak_before) as max_streak_seen
FROM survival_analytics_trivia
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), category
ORDER BY date DESC, category;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trivia_daily_date_cat ON survival_analytics_trivia_daily(date, category);

-- ============================================
-- Refresh function for trivia analytics
-- ============================================
CREATE OR REPLACE FUNCTION refresh_trivia_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY survival_analytics_trivia_daily;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE survival_analytics_trivia ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE survival_analytics_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_shop_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_leaderboard_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_battlepass_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY trivia_service ON survival_analytics_trivia FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY auth_events_service ON analytics_auth_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY milestones_service ON survival_analytics_milestones FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY shop_service ON analytics_shop_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY lb_events_service ON analytics_leaderboard_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY bp_events_service ON analytics_battlepass_events FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own data
CREATE POLICY trivia_user_select ON survival_analytics_trivia FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY auth_events_user_select ON analytics_auth_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY milestones_user_select ON survival_analytics_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY shop_user_select ON analytics_shop_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY lb_events_user_select ON analytics_leaderboard_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bp_events_user_select ON analytics_battlepass_events FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE survival_analytics_trivia IS 'Tracks every trivia question interaction for game balance';
COMMENT ON TABLE analytics_auth_events IS 'Tracks authentication events for conversion analysis';
COMMENT ON TABLE survival_analytics_milestones IS 'Tracks milestone achievements (PB, rank changes, achievements)';
COMMENT ON TABLE analytics_shop_events IS 'Tracks shop funnel for monetization analysis';
COMMENT ON TABLE analytics_leaderboard_events IS 'Tracks leaderboard engagement';
COMMENT ON TABLE analytics_battlepass_events IS 'Tracks battle pass progression and purchases';
