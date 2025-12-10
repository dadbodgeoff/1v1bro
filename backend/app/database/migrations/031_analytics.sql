-- 031_analytics.sql
-- Page analytics system for tracking visitors, events, and conversions
-- Tracks: page views, unique visitors, referrers, devices, events, scroll depth

-- ============================================
-- Analytics Sessions (unique visitors)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL UNIQUE,  -- Client-generated fingerprint
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    -- Device info
    device_type VARCHAR(20),  -- mobile, tablet, desktop
    browser VARCHAR(50),
    os VARCHAR(50),
    screen_width INTEGER,
    screen_height INTEGER,
    -- Location (from browser)
    locale VARCHAR(10),  -- e.g., 'en-US'
    timezone VARCHAR(50),
    -- Attribution
    first_referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    -- Conversion tracking
    converted_to_signup BOOLEAN DEFAULT false,
    converted_at TIMESTAMPTZ,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_analytics_sessions_first_seen ON analytics_sessions(first_seen);
CREATE INDEX idx_analytics_sessions_converted ON analytics_sessions(converted_to_signup) WHERE converted_to_signup = true;

-- ============================================
-- Page Views
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL,
    page VARCHAR(100) NOT NULL,  -- e.g., '/', '/login', '/dashboard'
    referrer TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    -- Engagement metrics
    time_on_page INTEGER,  -- seconds (updated on next page view or leave)
    scroll_depth INTEGER,  -- percentage 0-100
    -- Page load performance
    load_time_ms INTEGER
);

CREATE INDEX idx_analytics_page_views_page ON analytics_page_views(page);
CREATE INDEX idx_analytics_page_views_viewed_at ON analytics_page_views(viewed_at);
CREATE INDEX idx_analytics_page_views_session ON analytics_page_views(session_id);

-- ============================================
-- Events (clicks, interactions)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL,
    event_name VARCHAR(100) NOT NULL,  -- e.g., 'click_signup', 'play_demo', 'scroll_to_features'
    page VARCHAR(100),
    metadata JSONB,  -- Additional event data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);

-- ============================================
-- Daily Aggregates (for fast dashboard queries)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    new_visitors INTEGER DEFAULT 0,
    returning_visitors INTEGER DEFAULT 0,
    -- Device breakdown
    mobile_visitors INTEGER DEFAULT 0,
    tablet_visitors INTEGER DEFAULT 0,
    desktop_visitors INTEGER DEFAULT 0,
    -- Conversions
    signups INTEGER DEFAULT 0,
    demo_plays INTEGER DEFAULT 0,
    -- Top referrers stored as JSONB
    top_referrers JSONB,
    -- Engagement
    avg_time_on_site INTEGER,  -- seconds
    avg_pages_per_session NUMERIC(4,2),
    bounce_rate NUMERIC(5,2),  -- percentage
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_daily_stats_date ON analytics_daily_stats(date);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking before login)
CREATE POLICY "Anyone can insert sessions" ON analytics_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert page views" ON analytics_page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Allow updates to sessions (for updating last_seen, conversion status)
CREATE POLICY "Anyone can update sessions" ON analytics_sessions FOR UPDATE USING (true);

-- Only authenticated admins can read (you can adjust this)
CREATE POLICY "Authenticated can read sessions" ON analytics_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can read page views" ON analytics_page_views FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can read events" ON analytics_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can read daily stats" ON analytics_daily_stats FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- Helper function to aggregate daily stats
-- ============================================
CREATE OR REPLACE FUNCTION refresh_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO analytics_daily_stats (
        date,
        total_page_views,
        unique_visitors,
        new_visitors,
        mobile_visitors,
        tablet_visitors,
        desktop_visitors,
        demo_plays,
        signups
    )
    SELECT
        target_date,
        (SELECT COUNT(*) FROM analytics_page_views WHERE viewed_at::date = target_date),
        (SELECT COUNT(DISTINCT session_id) FROM analytics_page_views WHERE viewed_at::date = target_date),
        (SELECT COUNT(*) FROM analytics_sessions WHERE first_seen::date = target_date),
        (SELECT COUNT(DISTINCT session_id) FROM analytics_sessions s 
         JOIN analytics_page_views pv ON s.session_id = pv.session_id 
         WHERE pv.viewed_at::date = target_date AND s.device_type = 'mobile'),
        (SELECT COUNT(DISTINCT session_id) FROM analytics_sessions s 
         JOIN analytics_page_views pv ON s.session_id = pv.session_id 
         WHERE pv.viewed_at::date = target_date AND s.device_type = 'tablet'),
        (SELECT COUNT(DISTINCT session_id) FROM analytics_sessions s 
         JOIN analytics_page_views pv ON s.session_id = pv.session_id 
         WHERE pv.viewed_at::date = target_date AND s.device_type = 'desktop'),
        (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'demo_play' AND created_at::date = target_date),
        (SELECT COUNT(*) FROM analytics_sessions WHERE converted_to_signup = true AND converted_at::date = target_date)
    ON CONFLICT (date) DO UPDATE SET
        total_page_views = EXCLUDED.total_page_views,
        unique_visitors = EXCLUDED.unique_visitors,
        new_visitors = EXCLUDED.new_visitors,
        mobile_visitors = EXCLUDED.mobile_visitors,
        tablet_visitors = EXCLUDED.tablet_visitors,
        desktop_visitors = EXCLUDED.desktop_visitors,
        demo_plays = EXCLUDED.demo_plays,
        signups = EXCLUDED.signups,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- DROP FUNCTION IF EXISTS refresh_daily_analytics;
-- DROP TABLE IF EXISTS analytics_daily_stats;
-- DROP TABLE IF EXISTS analytics_events;
-- DROP TABLE IF EXISTS analytics_page_views;
-- DROP TABLE IF EXISTS analytics_sessions;
