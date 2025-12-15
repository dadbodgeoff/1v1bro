-- Migration: 037_survival_analytics.sql
-- Enterprise-grade analytics for Survival Mode
-- Tracks: gameplay metrics, player behavior, difficulty tuning, monetization
-- NOTE: This migration is idempotent - safe to run multiple times

-- ============================================
-- SURVIVAL SESSION ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS survival_analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    
    -- Session metadata
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_runs INTEGER DEFAULT 0,
    total_playtime_seconds NUMERIC DEFAULT 0,
    
    -- Device/performance context
    device_type TEXT,
    browser TEXT,
    avg_fps NUMERIC,
    min_fps NUMERIC,
    performance_grade TEXT, -- A-F
    
    -- Engagement metrics
    longest_run_distance NUMERIC DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    highest_combo INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sa_sessions_user ON survival_analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sa_sessions_visitor ON survival_analytics_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sa_sessions_started ON survival_analytics_sessions(started_at);

-- ============================================
-- RUN-LEVEL ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS survival_analytics_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    run_id UUID, -- Links to survival_runs if submitted
    
    -- Core metrics
    distance NUMERIC NOT NULL,
    score INTEGER NOT NULL,
    duration_seconds NUMERIC NOT NULL,
    seed INTEGER,
    
    -- Performance metrics
    max_speed NUMERIC,
    avg_speed NUMERIC,
    max_combo INTEGER,
    total_combos INTEGER,
    
    -- Skill metrics
    obstacles_cleared INTEGER DEFAULT 0,
    near_misses INTEGER DEFAULT 0,
    perfect_dodges INTEGER DEFAULT 0,
    lane_changes INTEGER DEFAULT 0,
    jumps INTEGER DEFAULT 0,
    slides INTEGER DEFAULT 0,
    
    -- Death analysis
    death_obstacle_type TEXT,
    death_position_x NUMERIC,
    death_position_z NUMERIC,
    death_lane INTEGER,
    death_during_combo BOOLEAN DEFAULT FALSE,
    death_combo_count INTEGER,
    time_since_last_input_ms INTEGER,
    
    -- Difficulty context
    difficulty_at_death NUMERIC,
    speed_at_death NUMERIC,
    pattern_at_death TEXT,
    
    -- Performance context
    avg_fps NUMERIC,
    min_fps NUMERIC,
    frame_drops INTEGER DEFAULT 0,
    input_latency_avg_ms NUMERIC,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sa_runs_session ON survival_analytics_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_sa_runs_user ON survival_analytics_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_sa_runs_distance ON survival_analytics_runs(distance DESC);
CREATE INDEX IF NOT EXISTS idx_sa_runs_created ON survival_analytics_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_sa_runs_death_type ON survival_analytics_runs(death_obstacle_type);

-- ============================================
-- INPUT ANALYTICS (for game feel tuning)
-- ============================================

CREATE TABLE IF NOT EXISTS survival_analytics_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    
    -- Input summary
    total_inputs INTEGER DEFAULT 0,
    inputs_per_second NUMERIC,
    
    -- Input breakdown
    jump_count INTEGER DEFAULT 0,
    slide_count INTEGER DEFAULT 0,
    lane_left_count INTEGER DEFAULT 0,
    lane_right_count INTEGER DEFAULT 0,
    
    -- Timing analysis
    avg_reaction_time_ms NUMERIC,
    min_reaction_time_ms NUMERIC,
    max_reaction_time_ms NUMERIC,
    
    -- Input patterns
    double_tap_count INTEGER DEFAULT 0,
    input_spam_count INTEGER DEFAULT 0, -- rapid repeated inputs
    buffered_input_count INTEGER DEFAULT 0,
    
    -- Coyote time usage
    coyote_jumps INTEGER DEFAULT 0,
    buffered_jumps INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sa_inputs_run ON survival_analytics_inputs(run_id);

-- ============================================
-- OBSTACLE ANALYTICS (for difficulty tuning)
-- ============================================

CREATE TABLE IF NOT EXISTS survival_analytics_obstacles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Aggregation period
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    obstacle_type TEXT NOT NULL,
    
    -- Encounter stats
    total_encounters INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    death_rate NUMERIC GENERATED ALWAYS AS (
        CASE WHEN total_encounters > 0 
        THEN ROUND(total_deaths::NUMERIC / total_encounters * 100, 2)
        ELSE 0 END
    ) STORED,
    
    -- Context
    avg_distance_at_encounter NUMERIC,
    avg_speed_at_encounter NUMERIC,
    avg_difficulty_at_encounter NUMERIC,
    
    -- Pattern analysis
    deaths_in_pattern INTEGER DEFAULT 0,
    deaths_standalone INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, obstacle_type)
);

CREATE INDEX IF NOT EXISTS idx_sa_obstacles_date ON survival_analytics_obstacles(date);
CREATE INDEX IF NOT EXISTS idx_sa_obstacles_type ON survival_analytics_obstacles(obstacle_type);

-- ============================================
-- COMBO ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS survival_analytics_combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    
    -- Combo details
    combo_count INTEGER NOT NULL,
    multiplier NUMERIC NOT NULL,
    score_earned INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    
    -- Context
    start_distance NUMERIC,
    end_distance NUMERIC,
    obstacles_in_combo INTEGER,
    near_misses_in_combo INTEGER,
    
    -- How it ended
    ended_by_death BOOLEAN DEFAULT FALSE,
    ended_by_timeout BOOLEAN DEFAULT FALSE,
    ended_by_hit BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sa_combos_run ON survival_analytics_combos(run_id);
CREATE INDEX IF NOT EXISTS idx_sa_combos_count ON survival_analytics_combos(combo_count DESC);

-- ============================================
-- FUNNEL ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS survival_analytics_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Funnel steps
    page_visits INTEGER DEFAULT 0,
    game_loads INTEGER DEFAULT 0,
    first_run_starts INTEGER DEFAULT 0,
    first_run_completes INTEGER DEFAULT 0,
    second_run_starts INTEGER DEFAULT 0,
    reached_100m INTEGER DEFAULT 0,
    reached_500m INTEGER DEFAULT 0,
    reached_1000m INTEGER DEFAULT 0,
    submitted_score INTEGER DEFAULT 0,
    viewed_leaderboard INTEGER DEFAULT 0,
    
    -- Retention
    returned_same_day INTEGER DEFAULT 0,
    returned_next_day INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_sa_funnels_date ON survival_analytics_funnels(date);

-- ============================================
-- DIFFICULTY CURVE ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS survival_analytics_difficulty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    distance_bucket INTEGER NOT NULL, -- 0-100, 100-200, etc.
    
    -- Player performance at this distance
    total_runs_reached INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    survival_rate NUMERIC GENERATED ALWAYS AS (
        CASE WHEN total_runs_reached > 0 
        THEN ROUND((total_runs_reached - total_deaths)::NUMERIC / total_runs_reached * 100, 2)
        ELSE 100 END
    ) STORED,
    
    -- Speed/difficulty at this point
    avg_speed NUMERIC,
    avg_difficulty NUMERIC,
    
    -- Common death causes
    top_death_obstacle TEXT,
    top_death_count INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, distance_bucket)
);

CREATE INDEX IF NOT EXISTS idx_sa_difficulty_date ON survival_analytics_difficulty(date);
CREATE INDEX IF NOT EXISTS idx_sa_difficulty_bucket ON survival_analytics_difficulty(distance_bucket);

-- ============================================
-- REAL-TIME AGGREGATES (Materialized View)
-- ============================================

-- Drop and recreate to ensure schema is correct
DROP MATERIALIZED VIEW IF EXISTS survival_analytics_daily;

CREATE MATERIALIZED VIEW survival_analytics_daily AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_runs,
    COUNT(DISTINCT user_id) as unique_players,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    ROUND(AVG(distance), 2) as avg_distance,
    ROUND(AVG(score), 2) as avg_score,
    ROUND(AVG(duration_seconds), 2) as avg_duration,
    MAX(distance) as max_distance,
    MAX(score) as max_score,
    MAX(max_combo) as max_combo,
    ROUND(AVG(max_combo), 2) as avg_max_combo,
    ROUND(AVG(obstacles_cleared), 2) as avg_obstacles_cleared,
    ROUND(AVG(near_misses), 2) as avg_near_misses,
    ROUND(AVG(avg_fps), 2) as avg_fps,
    COUNT(*) FILTER (WHERE death_obstacle_type IS NOT NULL) as deaths_with_type,
    MODE() WITHIN GROUP (ORDER BY death_obstacle_type) as most_common_death
FROM survival_analytics_runs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sa_daily_date ON survival_analytics_daily(date);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Refresh daily aggregates
CREATE OR REPLACE FUNCTION refresh_survival_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY survival_analytics_daily;
END;
$$ LANGUAGE plpgsql;

-- Get distance bucket
CREATE OR REPLACE FUNCTION get_distance_bucket(distance NUMERIC)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(distance / 100) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update obstacle analytics on run completion
CREATE OR REPLACE FUNCTION update_sa_obstacle_analytics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.death_obstacle_type IS NOT NULL THEN
        INSERT INTO survival_analytics_obstacles (
            date, obstacle_type, total_encounters, total_deaths,
            avg_distance_at_encounter, avg_speed_at_encounter
        ) VALUES (
            CURRENT_DATE, NEW.death_obstacle_type, 1, 1,
            NEW.distance, NEW.speed_at_death
        )
        ON CONFLICT (date, obstacle_type) DO UPDATE SET
            total_encounters = survival_analytics_obstacles.total_encounters + 1,
            total_deaths = survival_analytics_obstacles.total_deaths + 1,
            avg_distance_at_encounter = (
                survival_analytics_obstacles.avg_distance_at_encounter * survival_analytics_obstacles.total_encounters + NEW.distance
            ) / (survival_analytics_obstacles.total_encounters + 1),
            avg_speed_at_encounter = (
                survival_analytics_obstacles.avg_speed_at_encounter * survival_analytics_obstacles.total_encounters + COALESCE(NEW.speed_at_death, 0)
            ) / (survival_analytics_obstacles.total_encounters + 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sa_update_obstacle ON survival_analytics_runs;
CREATE TRIGGER trg_sa_update_obstacle
AFTER INSERT ON survival_analytics_runs
FOR EACH ROW EXECUTE FUNCTION update_sa_obstacle_analytics();

-- Update difficulty curve on run completion
CREATE OR REPLACE FUNCTION update_sa_difficulty_analytics()
RETURNS TRIGGER AS $$
DECLARE
    bucket INTEGER;
BEGIN
    bucket := get_distance_bucket(NEW.distance);
    
    INSERT INTO survival_analytics_difficulty (
        date, distance_bucket, total_runs_reached, total_deaths,
        avg_speed, avg_difficulty
    ) VALUES (
        CURRENT_DATE, bucket, 1, 
        CASE WHEN NEW.death_obstacle_type IS NOT NULL THEN 1 ELSE 0 END,
        NEW.avg_speed, NEW.difficulty_at_death
    )
    ON CONFLICT (date, distance_bucket) DO UPDATE SET
        total_runs_reached = survival_analytics_difficulty.total_runs_reached + 1,
        total_deaths = survival_analytics_difficulty.total_deaths + 
            CASE WHEN NEW.death_obstacle_type IS NOT NULL THEN 1 ELSE 0 END,
        avg_speed = (
            survival_analytics_difficulty.avg_speed * survival_analytics_difficulty.total_runs_reached + COALESCE(NEW.avg_speed, 0)
        ) / (survival_analytics_difficulty.total_runs_reached + 1);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sa_update_difficulty ON survival_analytics_runs;
CREATE TRIGGER trg_sa_update_difficulty
AFTER INSERT ON survival_analytics_runs
FOR EACH ROW EXECUTE FUNCTION update_sa_difficulty_analytics();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE survival_analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survival_analytics_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE survival_analytics_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE survival_analytics_combos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS sa_sessions_own ON survival_analytics_sessions;
DROP POLICY IF EXISTS sa_runs_own ON survival_analytics_runs;
DROP POLICY IF EXISTS sa_sessions_service ON survival_analytics_sessions;
DROP POLICY IF EXISTS sa_runs_service ON survival_analytics_runs;
DROP POLICY IF EXISTS sa_inputs_service ON survival_analytics_inputs;
DROP POLICY IF EXISTS sa_combos_service ON survival_analytics_combos;

-- Users can view their own analytics
CREATE POLICY sa_sessions_own ON survival_analytics_sessions
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY sa_runs_own ON survival_analytics_runs
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Service role can do everything
CREATE POLICY sa_sessions_service ON survival_analytics_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY sa_runs_service ON survival_analytics_runs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY sa_inputs_service ON survival_analytics_inputs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY sa_combos_service ON survival_analytics_combos
    FOR ALL USING (auth.role() = 'service_role');
