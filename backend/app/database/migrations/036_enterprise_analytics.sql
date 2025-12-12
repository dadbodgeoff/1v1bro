-- 036_enterprise_analytics.sql
-- Enterprise Analytics Suite: User Journeys, Performance, Cohorts, Heatmaps, A/B Tests

-- ============================================
-- 1. USER JOURNEY / FUNNEL TRACKING
-- ============================================

-- Track complete user journeys (sequence of pages/actions)
CREATE TABLE IF NOT EXISTS analytics_user_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id VARCHAR(64) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    user_id UUID,
    journey_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    journey_end TIMESTAMPTZ,
    entry_page VARCHAR(512) NOT NULL,
    exit_page VARCHAR(512),
    total_pages INT DEFAULT 1,
    total_events INT DEFAULT 0,
    total_duration_ms INT DEFAULT 0,
    converted BOOLEAN DEFAULT false,
    conversion_type VARCHAR(64), -- 'signup', 'purchase', 'game_played', etc.
    device_type VARCHAR(32),
    utm_source VARCHAR(128),
    utm_campaign VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey steps (ordered sequence of actions)
CREATE TABLE IF NOT EXISTS analytics_journey_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES analytics_user_journeys(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    step_type VARCHAR(32) NOT NULL, -- 'pageview', 'event', 'click'
    page VARCHAR(512),
    event_name VARCHAR(128),
    element_id VARCHAR(256),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INT, -- time spent on this step
    metadata JSONB
);

-- Funnel definitions (admin-configurable)
CREATE TABLE IF NOT EXISTS analytics_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL, -- [{step: 1, type: 'pageview', match: '/landing'}, ...]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funnel completion tracking (daily aggregates)
CREATE TABLE IF NOT EXISTS analytics_funnel_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES analytics_funnels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    step_number INT NOT NULL,
    entered_count INT DEFAULT 0,
    completed_count INT DEFAULT 0,
    drop_off_count INT DEFAULT 0,
    avg_time_to_next_ms INT,
    UNIQUE(funnel_id, date, step_number)
);

-- ============================================
-- 2. PERFORMANCE METRICS (Core Web Vitals)
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL,
    visitor_id VARCHAR(64),
    page VARCHAR(512) NOT NULL,
    
    -- Core Web Vitals
    lcp_ms INT, -- Largest Contentful Paint
    fid_ms INT, -- First Input Delay
    cls DECIMAL(6,4), -- Cumulative Layout Shift (0.0 - 1.0+)
    
    -- Additional metrics
    ttfb_ms INT, -- Time to First Byte
    fcp_ms INT, -- First Contentful Paint
    dom_interactive_ms INT,
    dom_complete_ms INT,
    load_time_ms INT,
    
    -- Resource metrics
    resource_count INT,
    total_transfer_kb INT,
    js_heap_mb DECIMAL(8,2),
    
    -- Connection info
    connection_type VARCHAR(32), -- '4g', '3g', 'wifi', etc.
    effective_bandwidth_mbps DECIMAL(8,2),
    rtt_ms INT, -- Round trip time
    
    device_type VARCHAR(32),
    browser VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- JS Error tracking
CREATE TABLE IF NOT EXISTS analytics_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL,
    visitor_id VARCHAR(64),
    user_id UUID,
    
    error_type VARCHAR(64) NOT NULL, -- 'js_error', 'api_error', 'resource_error'
    error_message TEXT NOT NULL,
    error_stack TEXT,
    error_source VARCHAR(512), -- file/url
    error_line INT,
    error_column INT,
    
    page VARCHAR(512),
    user_agent TEXT,
    browser VARCHAR(64),
    os VARCHAR(64),
    
    -- Context
    component VARCHAR(128), -- React component if available
    action VARCHAR(128), -- What user was doing
    metadata JSONB,
    
    is_fatal BOOLEAN DEFAULT false,
    occurrence_count INT DEFAULT 1,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. HEATMAP / INTERACTION DATA
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL,
    visitor_id VARCHAR(64),
    page VARCHAR(512) NOT NULL,
    
    -- Click position (relative to viewport)
    x_percent DECIMAL(5,2) NOT NULL, -- 0-100
    y_percent DECIMAL(5,2) NOT NULL,
    
    -- Absolute position
    x_px INT,
    y_px INT,
    viewport_width INT,
    viewport_height INT,
    scroll_y INT,
    
    -- Element info
    element_tag VARCHAR(32),
    element_id VARCHAR(256),
    element_class VARCHAR(512),
    element_text VARCHAR(256), -- First 256 chars of text content
    element_href VARCHAR(512),
    
    -- Click type
    click_type VARCHAR(32) DEFAULT 'click', -- 'click', 'rage_click', 'dead_click'
    is_rage_click BOOLEAN DEFAULT false, -- 3+ clicks in 1 second
    is_dead_click BOOLEAN DEFAULT false, -- Click on non-interactive element
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scroll depth tracking (aggregated per page view)
CREATE TABLE IF NOT EXISTS analytics_scroll_depth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL,
    page VARCHAR(512) NOT NULL,
    
    max_scroll_percent INT NOT NULL, -- 0-100
    scroll_milestones JSONB, -- {25: timestamp, 50: timestamp, 75: timestamp, 100: timestamp}
    total_scroll_distance_px INT,
    scroll_ups INT DEFAULT 0, -- Number of times scrolled back up
    time_to_50_percent_ms INT,
    time_to_100_percent_ms INT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. COHORT ANALYSIS
-- ============================================

-- User cohort assignments
CREATE TABLE IF NOT EXISTS analytics_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id VARCHAR(64) NOT NULL,
    user_id UUID,
    
    -- Cohort dimensions
    signup_date DATE,
    signup_week DATE, -- First day of week
    signup_month DATE, -- First day of month
    acquisition_source VARCHAR(128),
    acquisition_campaign VARCHAR(128),
    first_device VARCHAR(32),
    first_country VARCHAR(64),
    
    -- Behavioral cohorts
    user_type VARCHAR(32), -- 'free', 'premium', 'whale'
    engagement_level VARCHAR(32), -- 'low', 'medium', 'high', 'power_user'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(visitor_id)
);

-- Retention tracking (daily activity per cohort member)
CREATE TABLE IF NOT EXISTS analytics_retention (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id VARCHAR(64) NOT NULL,
    user_id UUID,
    cohort_date DATE NOT NULL, -- When they joined
    activity_date DATE NOT NULL, -- When they were active
    days_since_cohort INT NOT NULL, -- 0, 1, 7, 14, 30, etc.
    
    -- Activity metrics for this day
    sessions INT DEFAULT 1,
    page_views INT DEFAULT 0,
    events INT DEFAULT 0,
    games_played INT DEFAULT 0,
    time_spent_ms INT DEFAULT 0,
    
    UNIQUE(visitor_id, activity_date)
);

-- Pre-aggregated retention curves
CREATE TABLE IF NOT EXISTS analytics_retention_curves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_date DATE NOT NULL,
    cohort_size INT NOT NULL,
    acquisition_source VARCHAR(128),
    
    -- Retention percentages at key intervals
    day_1_retained DECIMAL(5,2),
    day_3_retained DECIMAL(5,2),
    day_7_retained DECIMAL(5,2),
    day_14_retained DECIMAL(5,2),
    day_30_retained DECIMAL(5,2),
    day_60_retained DECIMAL(5,2),
    day_90_retained DECIMAL(5,2),
    
    -- Counts
    day_1_count INT,
    day_7_count INT,
    day_30_count INT,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(cohort_date, acquisition_source)
);

-- ============================================
-- 5. A/B TEST TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    hypothesis TEXT,
    
    -- Variants
    variants JSONB NOT NULL, -- [{id: 'control', name: 'Control', weight: 50}, {id: 'variant_a', ...}]
    
    -- Targeting
    target_audience JSONB, -- {device: ['mobile'], country: ['US'], etc.}
    traffic_percent INT DEFAULT 100, -- % of eligible traffic to include
    
    -- Goals
    primary_metric VARCHAR(128) NOT NULL, -- 'conversion_rate', 'time_on_site', etc.
    secondary_metrics JSONB, -- ['bounce_rate', 'pages_per_session']
    
    -- Status
    status VARCHAR(32) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    -- Results
    winner_variant VARCHAR(64),
    statistical_significance DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experiment assignments
CREATE TABLE IF NOT EXISTS analytics_experiment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES analytics_experiments(id) ON DELETE CASCADE,
    visitor_id VARCHAR(64) NOT NULL,
    session_id VARCHAR(64),
    user_id UUID,
    
    variant_id VARCHAR(64) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Outcome tracking
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2),
    converted_at TIMESTAMPTZ,
    
    UNIQUE(experiment_id, visitor_id)
);

-- Experiment results (daily aggregates per variant)
CREATE TABLE IF NOT EXISTS analytics_experiment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES analytics_experiments(id) ON DELETE CASCADE,
    variant_id VARCHAR(64) NOT NULL,
    date DATE NOT NULL,
    
    -- Counts
    visitors INT DEFAULT 0,
    conversions INT DEFAULT 0,
    
    -- Metrics
    conversion_rate DECIMAL(8,4),
    avg_time_on_site_ms INT,
    avg_pages_per_session DECIMAL(6,2),
    bounce_rate DECIMAL(5,2),
    
    -- Revenue (if applicable)
    total_revenue DECIMAL(12,2),
    avg_revenue_per_user DECIMAL(10,2),
    
    UNIQUE(experiment_id, variant_id, date)
);

-- ============================================
-- 6. REAL-TIME ANALYTICS
-- ============================================

-- Active sessions (cleaned up periodically)
CREATE TABLE IF NOT EXISTS analytics_active_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    visitor_id VARCHAR(64),
    user_id UUID,
    
    current_page VARCHAR(512),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    page_views INT DEFAULT 1,
    events INT DEFAULT 0,
    
    device_type VARCHAR(32),
    country VARCHAR(64),
    city VARCHAR(128)
);

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================

-- Journey indexes
CREATE INDEX IF NOT EXISTS idx_journeys_visitor ON analytics_user_journeys(visitor_id);
CREATE INDEX IF NOT EXISTS idx_journeys_session ON analytics_user_journeys(session_id);
CREATE INDEX IF NOT EXISTS idx_journeys_date ON analytics_user_journeys(journey_start);
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey ON analytics_journey_steps(journey_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_performance_session ON analytics_performance(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_page ON analytics_performance(page);
CREATE INDEX IF NOT EXISTS idx_performance_date ON analytics_performance(created_at);
CREATE INDEX IF NOT EXISTS idx_errors_session ON analytics_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_errors_type ON analytics_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_errors_unresolved ON analytics_errors(resolved) WHERE resolved = false;

-- Click/heatmap indexes
CREATE INDEX IF NOT EXISTS idx_clicks_page ON analytics_clicks(page);
CREATE INDEX IF NOT EXISTS idx_clicks_session ON analytics_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_clicks_rage ON analytics_clicks(is_rage_click) WHERE is_rage_click = true;
CREATE INDEX IF NOT EXISTS idx_scroll_page ON analytics_scroll_depth(page);

-- Cohort indexes
CREATE INDEX IF NOT EXISTS idx_cohorts_visitor ON analytics_cohorts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_signup ON analytics_cohorts(signup_date);
CREATE INDEX IF NOT EXISTS idx_retention_visitor ON analytics_retention(visitor_id);
CREATE INDEX IF NOT EXISTS idx_retention_cohort ON analytics_retention(cohort_date);
CREATE INDEX IF NOT EXISTS idx_retention_curves_date ON analytics_retention_curves(cohort_date);

-- Experiment indexes
CREATE INDEX IF NOT EXISTS idx_exp_assignments_exp ON analytics_experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_exp_assignments_visitor ON analytics_experiment_assignments(visitor_id);
CREATE INDEX IF NOT EXISTS idx_exp_results_exp ON analytics_experiment_results(experiment_id);

-- Real-time indexes
CREATE INDEX IF NOT EXISTS idx_active_sessions_activity ON analytics_active_sessions(last_activity);

-- ============================================
-- DOWN Migration
-- ============================================
-- DROP TABLE IF EXISTS analytics_active_sessions;
-- DROP TABLE IF EXISTS analytics_experiment_results;
-- DROP TABLE IF EXISTS analytics_experiment_assignments;
-- DROP TABLE IF EXISTS analytics_experiments;
-- DROP TABLE IF EXISTS analytics_retention_curves;
-- DROP TABLE IF EXISTS analytics_retention;
-- DROP TABLE IF EXISTS analytics_cohorts;
-- DROP TABLE IF EXISTS analytics_scroll_depth;
-- DROP TABLE IF EXISTS analytics_clicks;
-- DROP TABLE IF EXISTS analytics_errors;
-- DROP TABLE IF EXISTS analytics_performance;
-- DROP TABLE IF EXISTS analytics_funnel_stats;
-- DROP TABLE IF EXISTS analytics_funnels;
-- DROP TABLE IF EXISTS analytics_journey_steps;
-- DROP TABLE IF EXISTS analytics_user_journeys;
