-- 035_analytics_visitor_tracking.sql
-- Add persistent visitor tracking to distinguish unique users from sessions
-- 
-- visitor_id: Stored in localStorage, persists across browser sessions
-- session_id: Stored in sessionStorage, resets per tab/browser session
-- is_returning_visitor: True if this visitor_id has been seen before

-- Add visitor_id column for persistent tracking
ALTER TABLE analytics_sessions 
ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(64);

-- Add flag for returning visitors
ALTER TABLE analytics_sessions 
ADD COLUMN IF NOT EXISTS is_returning_visitor BOOLEAN DEFAULT false;

-- Index for efficient visitor lookups
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor_id 
ON analytics_sessions(visitor_id);

-- Index for returning visitor queries
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_returning 
ON analytics_sessions(is_returning_visitor) 
WHERE is_returning_visitor = true;

-- Update daily stats function to track true unique visitors
CREATE OR REPLACE FUNCTION refresh_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO analytics_daily_stats (
        date,
        total_page_views,
        unique_visitors,
        new_visitors,
        returning_visitors,
        mobile_visitors,
        tablet_visitors,
        desktop_visitors,
        demo_plays,
        signups
    )
    SELECT
        target_date,
        (SELECT COUNT(*) FROM analytics_page_views WHERE viewed_at::date = target_date),
        -- True unique visitors by visitor_id (falls back to session_id if no visitor_id)
        (SELECT COUNT(DISTINCT COALESCE(s.visitor_id, s.session_id)) 
         FROM analytics_sessions s 
         WHERE s.first_seen::date = target_date),
        -- New visitors (first time seeing this visitor_id)
        (SELECT COUNT(*) FROM analytics_sessions 
         WHERE first_seen::date = target_date AND is_returning_visitor = false),
        -- Returning visitors
        (SELECT COUNT(*) FROM analytics_sessions 
         WHERE first_seen::date = target_date AND is_returning_visitor = true),
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
        returning_visitors = EXCLUDED.returning_visitors,
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
-- DROP INDEX IF EXISTS idx_analytics_sessions_returning;
-- DROP INDEX IF EXISTS idx_analytics_sessions_visitor_id;
-- ALTER TABLE analytics_sessions DROP COLUMN IF EXISTS is_returning_visitor;
-- ALTER TABLE analytics_sessions DROP COLUMN IF EXISTS visitor_id;
