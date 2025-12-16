-- Migration: Add geographic columns to analytics_sessions
-- Run this in Supabase SQL Editor

-- Add country columns to analytics_sessions
ALTER TABLE analytics_sessions 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index for country queries
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country ON analytics_sessions(country);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country_code ON analytics_sessions(country_code);

-- Create analytics_shop_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_shop_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID,
    event_type TEXT NOT NULL, -- view, item_view, preview, purchase_start, purchase_complete, purchase_failed
    item_id TEXT,
    item_type TEXT,
    item_rarity TEXT,
    price INTEGER, -- in cents
    currency TEXT DEFAULT 'USD',
    error_type TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for shop events
CREATE INDEX IF NOT EXISTS idx_shop_events_session ON analytics_shop_events(session_id);
CREATE INDEX IF NOT EXISTS idx_shop_events_event_type ON analytics_shop_events(event_type);
CREATE INDEX IF NOT EXISTS idx_shop_events_created_at ON analytics_shop_events(created_at);
CREATE INDEX IF NOT EXISTS idx_shop_events_user_id ON analytics_shop_events(user_id);

-- Grant permissions (adjust as needed for your Supabase setup)
-- GRANT ALL ON analytics_shop_events TO authenticated;
-- GRANT ALL ON analytics_shop_events TO service_role;
