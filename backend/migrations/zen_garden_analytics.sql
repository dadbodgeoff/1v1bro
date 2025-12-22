-- Zen Garden Analytics Table
-- Focused tracking for the zen garden survival map

CREATE TABLE IF NOT EXISTS zen_garden_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Identifiers
    visitor_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    
    -- Event type
    event_type TEXT NOT NULL, -- landing_view, landing_exit, game_start, game_end, play_again, signup_click, signup_complete, login_click, session_end
    
    -- Landing events
    is_returning BOOLEAN DEFAULT FALSE,
    referrer TEXT,
    device TEXT, -- mobile, desktop
    exit_type TEXT, -- back, external, close
    time_on_page_ms INTEGER,
    started_game BOOLEAN,
    
    -- Game events
    run_number INTEGER,
    is_replay BOOLEAN,
    distance FLOAT,
    score INTEGER,
    duration_ms INTEGER,
    death_cause TEXT, -- highBarrier, lowBarrier, laneBarrier, spikes, quit, unknown
    death_lane INTEGER,
    max_combo INTEGER,
    
    -- Replay events
    previous_runs INTEGER,
    best_distance FLOAT,
    total_time_ms INTEGER,
    
    -- Signup events
    runs_before_signup INTEGER,
    time_to_signup_ms INTEGER,
    runs_before_login INTEGER,
    
    -- Session end
    total_runs INTEGER,
    signed_up BOOLEAN,
    runs_data JSONB -- Array of run summaries
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_zen_garden_visitor ON zen_garden_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_zen_garden_session ON zen_garden_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_zen_garden_event ON zen_garden_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_zen_garden_created ON zen_garden_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_zen_garden_returning ON zen_garden_analytics(is_returning) WHERE is_returning = TRUE;

-- Enable RLS
ALTER TABLE zen_garden_analytics ENABLE ROW LEVEL SECURITY;

-- Allow inserts from service role (backend)
CREATE POLICY "Service role can insert zen garden analytics"
    ON zen_garden_analytics FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Allow reads from service role (backend)
CREATE POLICY "Service role can read zen garden analytics"
    ON zen_garden_analytics FOR SELECT
    TO service_role
    USING (true);

-- Comment
COMMENT ON TABLE zen_garden_analytics IS 'Focused analytics for zen garden survival map - tracks landing engagement, gameplay, and conversions';
