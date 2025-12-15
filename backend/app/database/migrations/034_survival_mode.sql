-- 034_survival_mode.sql
-- Survival Mode tables for runs, ghosts, replays, telemetry, and combos
-- Supports: Ghost replays, death telemetry, combo system, leaderboards

-- ============================================
-- SURVIVAL RUNS TABLE
-- Stores completed survival mode runs
-- ============================================
CREATE TABLE IF NOT EXISTS survival_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Run metrics
    distance INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    max_speed REAL NOT NULL DEFAULT 0,
    
    -- Combo/performance stats
    max_combo INTEGER NOT NULL DEFAULT 0,
    total_near_misses INTEGER NOT NULL DEFAULT 0,
    perfect_dodges INTEGER NOT NULL DEFAULT 0,
    obstacles_cleared INTEGER NOT NULL DEFAULT 0,
    
    -- Death info
    death_obstacle_type VARCHAR(50),
    death_position_x REAL,
    death_position_z REAL,
    death_distance INTEGER,
    
    -- Run configuration
    seed INTEGER,  -- For reproducible runs
    difficulty_tier VARCHAR(20) DEFAULT 'rookie',
    
    -- Ghost data (compressed)
    ghost_data JSONB,  -- Compressed input recording for replay
    has_ghost BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for survival_runs
CREATE INDEX IF NOT EXISTS idx_survival_runs_user_id ON survival_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_survival_runs_distance ON survival_runs(distance DESC);
CREATE INDEX IF NOT EXISTS idx_survival_runs_score ON survival_runs(score DESC);
CREATE INDEX IF NOT EXISTS idx_survival_runs_created_at ON survival_runs(created_at DESC);

-- ============================================
-- SURVIVAL PERSONAL BESTS TABLE
-- Tracks each user's best run for ghost comparison
-- ============================================
CREATE TABLE IF NOT EXISTS survival_personal_bests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES survival_runs(id) ON DELETE CASCADE,
    
    -- Best metrics (denormalized for fast queries)
    best_distance INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    best_combo INTEGER NOT NULL DEFAULT 0,
    
    -- Ghost data for this PB
    ghost_data JSONB,
    
    -- Timestamps
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)  -- One PB per user
);

-- Index for personal bests
CREATE INDEX IF NOT EXISTS idx_survival_pb_distance ON survival_personal_bests(best_distance DESC);

-- ============================================
-- SURVIVAL TELEMETRY TABLE
-- Aggregated death/obstacle analytics
-- ============================================
CREATE TABLE IF NOT EXISTS survival_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Aggregation period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Death heatmap data (position -> count)
    death_positions JSONB DEFAULT '[]',
    
    -- Obstacle type death counts
    deaths_by_obstacle JSONB DEFAULT '{}',
    
    -- Distance distribution (buckets)
    distance_distribution JSONB DEFAULT '{}',
    
    -- Difficulty progression
    avg_distance_by_tier JSONB DEFAULT '{}',
    
    -- Performance metrics
    total_runs INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    avg_distance REAL DEFAULT 0,
    avg_score REAL DEFAULT 0,
    avg_combo REAL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(period_start, period_end)
);

-- ============================================
-- SURVIVAL DEATH EVENTS TABLE
-- Individual death events for detailed analysis
-- ============================================
CREATE TABLE IF NOT EXISTS survival_death_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES survival_runs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Death details
    obstacle_type VARCHAR(50) NOT NULL,
    position_x REAL NOT NULL,
    position_z REAL NOT NULL,
    distance INTEGER NOT NULL,
    speed REAL NOT NULL,
    
    -- Player state at death
    was_jumping BOOLEAN DEFAULT FALSE,
    was_sliding BOOLEAN DEFAULT FALSE,
    current_lane INTEGER DEFAULT 0,
    combo_at_death INTEGER DEFAULT 0,
    
    -- Context
    difficulty_tier VARCHAR(20),
    pattern_id VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for death events
CREATE INDEX IF NOT EXISTS idx_survival_deaths_user ON survival_death_events(user_id);
CREATE INDEX IF NOT EXISTS idx_survival_deaths_obstacle ON survival_death_events(obstacle_type);
CREATE INDEX IF NOT EXISTS idx_survival_deaths_distance ON survival_death_events(distance);
CREATE INDEX IF NOT EXISTS idx_survival_deaths_created ON survival_death_events(created_at DESC);

-- ============================================
-- SURVIVAL LEADERBOARD VIEW
-- Materialized view for fast leaderboard queries
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS survival_leaderboard AS
SELECT 
    sr.user_id,
    up.display_name,
    up.avatar_url,
    MAX(sr.distance) as best_distance,
    MAX(sr.score) as best_score,
    MAX(sr.max_combo) as best_combo,
    COUNT(*) as total_runs,
    AVG(sr.distance) as avg_distance,
    ROW_NUMBER() OVER (ORDER BY MAX(sr.distance) DESC) as rank
FROM survival_runs sr
JOIN user_profiles up ON sr.user_id = up.id
GROUP BY sr.user_id, up.display_name, up.avatar_url
ORDER BY best_distance DESC;

-- Index for leaderboard
CREATE UNIQUE INDEX IF NOT EXISTS idx_survival_lb_user ON survival_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_survival_lb_rank ON survival_leaderboard(rank);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to refresh leaderboard (call periodically)
CREATE OR REPLACE FUNCTION refresh_survival_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY survival_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- Function to update personal best
CREATE OR REPLACE FUNCTION update_survival_personal_best()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO survival_personal_bests (user_id, run_id, best_distance, best_score, best_combo, ghost_data, achieved_at)
    VALUES (NEW.user_id, NEW.id, NEW.distance, NEW.score, NEW.max_combo, NEW.ghost_data, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        run_id = CASE WHEN NEW.distance > survival_personal_bests.best_distance THEN NEW.id ELSE survival_personal_bests.run_id END,
        best_distance = GREATEST(survival_personal_bests.best_distance, NEW.distance),
        best_score = CASE WHEN NEW.distance > survival_personal_bests.best_distance THEN NEW.score ELSE survival_personal_bests.best_score END,
        best_combo = GREATEST(survival_personal_bests.best_combo, NEW.max_combo),
        ghost_data = CASE WHEN NEW.distance > survival_personal_bests.best_distance AND NEW.ghost_data IS NOT NULL THEN NEW.ghost_data ELSE survival_personal_bests.ghost_data END,
        achieved_at = CASE WHEN NEW.distance > survival_personal_bests.best_distance THEN NOW() ELSE survival_personal_bests.achieved_at END,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update personal best
DROP TRIGGER IF EXISTS trg_survival_personal_best ON survival_runs;
CREATE TRIGGER trg_survival_personal_best
    AFTER INSERT ON survival_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_survival_personal_best();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE survival_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE survival_personal_bests ENABLE ROW LEVEL SECURITY;
ALTER TABLE survival_death_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own runs
CREATE POLICY survival_runs_select ON survival_runs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own runs
CREATE POLICY survival_runs_insert ON survival_runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Personal bests - users can read their own
CREATE POLICY survival_pb_select ON survival_personal_bests
    FOR SELECT USING (auth.uid() = user_id);

-- Death events - users can read their own
CREATE POLICY survival_deaths_select ON survival_death_events
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for API)
CREATE POLICY survival_runs_service ON survival_runs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY survival_pb_service ON survival_personal_bests
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY survival_deaths_service ON survival_death_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY survival_telemetry_service ON survival_telemetry
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE survival_runs IS 'Individual survival mode run records';
COMMENT ON TABLE survival_personal_bests IS 'Personal best runs per user with ghost data';
COMMENT ON TABLE survival_telemetry IS 'Aggregated telemetry for analytics';
COMMENT ON TABLE survival_death_events IS 'Individual death events for heatmap analysis';
COMMENT ON MATERIALIZED VIEW survival_leaderboard IS 'Cached leaderboard for fast queries';

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- DROP TRIGGER IF EXISTS trg_survival_personal_best ON survival_runs;
-- DROP FUNCTION IF EXISTS update_survival_personal_best();
-- DROP FUNCTION IF EXISTS refresh_survival_leaderboard();
-- DROP MATERIALIZED VIEW IF EXISTS survival_leaderboard;
-- DROP TABLE IF EXISTS survival_death_events;
-- DROP TABLE IF EXISTS survival_telemetry;
-- DROP TABLE IF EXISTS survival_personal_bests;
-- DROP TABLE IF EXISTS survival_runs;
