-- Migration: 004_death_replays
-- Description: Add death_replays table for telemetry replay storage

-- Create death_replays table
CREATE TABLE IF NOT EXISTS death_replays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID NOT NULL,
    victim_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    killer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    death_tick INTEGER NOT NULL,
    death_timestamp TIMESTAMPTZ NOT NULL,
    
    -- Compressed replay data (JSONB with base64-encoded zlib data)
    frames JSONB NOT NULL,
    
    -- Flagging for extended retention
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    flagged_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Validation
    CONSTRAINT valid_expiry CHECK (expires_at > created_at),
    CONSTRAINT valid_death_tick CHECK (death_tick >= 0)
);

-- Index for cleanup job (find expired, non-flagged replays)
CREATE INDEX IF NOT EXISTS idx_death_replays_expires 
    ON death_replays(expires_at) 
    WHERE NOT flagged;

-- Index for player lookup (victim)
CREATE INDEX IF NOT EXISTS idx_death_replays_victim 
    ON death_replays(victim_id, created_at DESC);

-- Index for player lookup (killer)
CREATE INDEX IF NOT EXISTS idx_death_replays_killer 
    ON death_replays(killer_id, created_at DESC);

-- Index for lobby lookup
CREATE INDEX IF NOT EXISTS idx_death_replays_lobby 
    ON death_replays(lobby_id);

-- Enable Row Level Security
ALTER TABLE death_replays ENABLE ROW LEVEL SECURITY;

-- Policy: Players can view replays they're involved in
CREATE POLICY "Players can view own replays"
    ON death_replays FOR SELECT
    USING (auth.uid() = victim_id OR auth.uid() = killer_id);

-- Policy: Players can flag their own deaths
CREATE POLICY "Players can flag own deaths"
    ON death_replays FOR UPDATE
    USING (auth.uid() = victim_id)
    WITH CHECK (auth.uid() = victim_id);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role full access"
    ON death_replays FOR ALL
    USING (auth.role() = 'service_role');
