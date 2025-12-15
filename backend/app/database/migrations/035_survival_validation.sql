-- 035_survival_validation.sql
-- Server-authoritative validation for survival runs
-- Prevents cheating through replay verification and sanity checks

-- ============================================
-- ADD VALIDATION COLUMNS TO SURVIVAL_RUNS
-- ============================================
ALTER TABLE survival_runs 
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'valid',
ADD COLUMN IF NOT EXISTS validation_flags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS validation_confidence REAL DEFAULT 1.0;

-- Index for filtering by validation status
CREATE INDEX IF NOT EXISTS idx_survival_runs_validation 
ON survival_runs(validation_status);

-- ============================================
-- POPULATION STATISTICS FUNCTION
-- Used for statistical anomaly detection
-- ============================================
CREATE OR REPLACE FUNCTION get_survival_population_stats(days_back INTEGER DEFAULT 7)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'avg_distance', COALESCE(AVG(distance), 0),
        'std_distance', COALESCE(STDDEV(distance), 0),
        'avg_score', COALESCE(AVG(score), 0),
        'std_score', COALESCE(STDDEV(score), 0),
        'avg_score_per_meter', COALESCE(AVG(CASE WHEN distance > 0 THEN score::float / distance ELSE 0 END), 0),
        'std_score_per_meter', COALESCE(STDDEV(CASE WHEN distance > 0 THEN score::float / distance ELSE 0 END), 0),
        'avg_combo', COALESCE(AVG(max_combo), 0),
        'std_combo', COALESCE(STDDEV(max_combo), 0),
        'total_runs', COUNT(*),
        'calculated_at', NOW()
    ) INTO result
    FROM survival_runs
    WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
    AND validation_status = 'valid';  -- Only use valid runs for stats
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATE LEADERBOARD VIEW TO EXCLUDE REJECTED
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS survival_leaderboard;

CREATE MATERIALIZED VIEW survival_leaderboard AS
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
WHERE sr.validation_status IN ('valid', 'suspicious')  -- Exclude rejected runs
GROUP BY sr.user_id, up.display_name, up.avatar_url
ORDER BY best_distance DESC;

-- Recreate indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_survival_lb_user ON survival_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_survival_lb_rank ON survival_leaderboard(rank);

-- ============================================
-- UPDATE PERSONAL BEST TRIGGER
-- Only update PB for valid runs
-- ============================================
CREATE OR REPLACE FUNCTION update_survival_personal_best()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update PB for valid runs (not rejected)
    IF NEW.validation_status = 'rejected' THEN
        RETURN NEW;
    END IF;
    
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

-- ============================================
-- RATE LIMITING TABLE
-- Prevents spam submissions
-- ============================================
CREATE TABLE IF NOT EXISTS survival_rate_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    submissions_today INTEGER DEFAULT 0,
    last_submission TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    daily_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_survival_rate_limit(
    p_user_id UUID,
    p_max_per_day INTEGER DEFAULT 100,
    p_min_interval_seconds INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
    v_record survival_rate_limits%ROWTYPE;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get or create rate limit record
    INSERT INTO survival_rate_limits (user_id, submissions_today, last_submission, daily_reset)
    VALUES (p_user_id, 0, v_now, v_now)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO v_record FROM survival_rate_limits WHERE user_id = p_user_id FOR UPDATE;
    
    -- Reset daily counter if needed
    IF v_record.daily_reset < DATE_TRUNC('day', v_now) THEN
        UPDATE survival_rate_limits 
        SET submissions_today = 0, daily_reset = v_now
        WHERE user_id = p_user_id;
        v_record.submissions_today := 0;
    END IF;
    
    -- Check daily limit
    IF v_record.submissions_today >= p_max_per_day THEN
        RETURN FALSE;
    END IF;
    
    -- Check minimum interval
    IF v_record.last_submission > v_now - (p_min_interval_seconds || ' seconds')::INTERVAL THEN
        RETURN FALSE;
    END IF;
    
    -- Update counters
    UPDATE survival_rate_limits 
    SET submissions_today = submissions_today + 1, last_submission = v_now
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUSPICIOUS RUN REVIEW TABLE
-- For manual review of flagged runs
-- ============================================
CREATE TABLE IF NOT EXISTS survival_flagged_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES survival_runs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flags JSONB NOT NULL,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewer_id UUID REFERENCES auth.users(id),
    review_result VARCHAR(20),  -- 'approved', 'rejected', 'banned'
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_flagged_runs_pending 
ON survival_flagged_runs(reviewed, created_at) 
WHERE reviewed = FALSE;

-- Trigger to auto-flag suspicious runs
CREATE OR REPLACE FUNCTION flag_suspicious_run()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.validation_status = 'suspicious' THEN
        INSERT INTO survival_flagged_runs (run_id, user_id, flags)
        VALUES (NEW.id, NEW.user_id, NEW.validation_flags);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_flag_suspicious ON survival_runs;
CREATE TRIGGER trg_flag_suspicious
    AFTER INSERT ON survival_runs
    FOR EACH ROW
    EXECUTE FUNCTION flag_suspicious_run();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN survival_runs.validation_status IS 'Server validation result: valid, suspicious, rejected';
COMMENT ON COLUMN survival_runs.validation_flags IS 'Array of validation warning flags';
COMMENT ON COLUMN survival_runs.validation_confidence IS 'Server confidence in run validity (0-1)';
COMMENT ON TABLE survival_flagged_runs IS 'Suspicious runs pending manual review';
COMMENT ON TABLE survival_rate_limits IS 'Rate limiting for run submissions';

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- DROP TRIGGER IF EXISTS trg_flag_suspicious ON survival_runs;
-- DROP FUNCTION IF EXISTS flag_suspicious_run();
-- DROP TABLE IF EXISTS survival_flagged_runs;
-- DROP TABLE IF EXISTS survival_rate_limits;
-- DROP FUNCTION IF EXISTS check_survival_rate_limit(UUID, INTEGER, INTEGER);
-- DROP FUNCTION IF EXISTS get_survival_population_stats(INTEGER);
-- ALTER TABLE survival_runs DROP COLUMN IF EXISTS validation_status;
-- ALTER TABLE survival_runs DROP COLUMN IF EXISTS validation_flags;
-- ALTER TABLE survival_runs DROP COLUMN IF EXISTS validation_confidence;
