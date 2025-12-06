-- ============================================
-- Matchmaking Queue System Migration
-- Version: 004
-- Description: Adds matchmaking queue with FIFO matching, cooldowns, and passive MMR tracking
-- ============================================

-- ============================================
-- MATCHMAKING QUEUE TABLE
-- Stores active queue tickets for players waiting to be matched
-- ============================================
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    player_name VARCHAR(100),
    game_mode VARCHAR(50) NOT NULL DEFAULT 'fortnite',
    queue_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id)
);

-- Enable RLS
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own queue tickets
CREATE POLICY "Users can view own queue tickets" ON matchmaking_queue
    FOR SELECT USING (auth.uid() = player_id);

-- Users can create their own queue tickets
CREATE POLICY "Users can create own queue tickets" ON matchmaking_queue
    FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Users can update their own queue tickets
CREATE POLICY "Users can update own queue tickets" ON matchmaking_queue
    FOR UPDATE USING (auth.uid() = player_id);

-- Users can delete their own queue tickets
CREATE POLICY "Users can delete own queue tickets" ON matchmaking_queue
    FOR DELETE USING (auth.uid() = player_id);

-- ============================================
-- QUEUE COOLDOWNS TABLE
-- Tracks temporary bans from queueing (anti-abuse)
-- ============================================
CREATE TABLE IF NOT EXISTS queue_cooldowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    cooldown_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('early_leave', 'abuse', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE queue_cooldowns ENABLE ROW LEVEL SECURITY;

-- Users can view their own cooldowns
CREATE POLICY "Users can view own cooldowns" ON queue_cooldowns
    FOR SELECT USING (auth.uid() = player_id);

-- ============================================
-- USER PROFILE EXTENSIONS
-- Add MMR and early leave tracking columns
-- ============================================

-- MMR for passive skill tracking (default 1000, range 100-3000)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS mmr INTEGER DEFAULT 1000;

-- Early leave counter for cooldown escalation
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS early_leave_count INTEGER DEFAULT 0;

-- Date to reset early leave count (daily reset at 00:00 UTC)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS early_leave_reset_date DATE DEFAULT CURRENT_DATE;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Queue indexes for fast matching queries
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_status ON matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_time ON matchmaking_queue(queue_time);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_waiting ON matchmaking_queue(queue_time) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_player ON matchmaking_queue(player_id);

-- Cooldown indexes
CREATE INDEX IF NOT EXISTS idx_queue_cooldowns_player ON queue_cooldowns(player_id);
CREATE INDEX IF NOT EXISTS idx_queue_cooldowns_until ON queue_cooldowns(cooldown_until);

-- MMR index for future ranked mode
CREATE INDEX IF NOT EXISTS idx_user_profiles_mmr ON user_profiles(mmr);


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get active cooldown for a player (returns NULL if no active cooldown)
CREATE OR REPLACE FUNCTION get_active_cooldown(p_player_id UUID)
RETURNS TABLE (
    cooldown_id UUID,
    cooldown_until TIMESTAMPTZ,
    reason VARCHAR,
    remaining_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qc.id as cooldown_id,
        qc.cooldown_until,
        qc.reason,
        GREATEST(0, EXTRACT(EPOCH FROM (qc.cooldown_until - NOW()))::INTEGER) as remaining_seconds
    FROM queue_cooldowns qc
    WHERE qc.player_id = p_player_id
      AND qc.cooldown_until > NOW()
    ORDER BY qc.cooldown_until DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if player has active queue ticket
CREATE OR REPLACE FUNCTION has_active_queue_ticket(p_player_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM matchmaking_queue
        WHERE player_id = p_player_id
          AND status = 'waiting'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get queue position for a player (1-indexed, NULL if not in queue)
CREATE OR REPLACE FUNCTION get_queue_position(p_player_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_position INTEGER;
BEGIN
    SELECT position INTO v_position
    FROM (
        SELECT 
            player_id,
            ROW_NUMBER() OVER (ORDER BY queue_time ASC) as position
        FROM matchmaking_queue
        WHERE status = 'waiting'
    ) ranked
    WHERE player_id = p_player_id;
    
    RETURN v_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up expired queue tickets (older than 10 minutes)
CREATE OR REPLACE FUNCTION cleanup_expired_queue_tickets()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE matchmaking_queue
    SET status = 'expired'
    WHERE status = 'waiting'
      AND queue_time < NOW() - INTERVAL '10 minutes';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset early leave counts (call daily at 00:00 UTC)
CREATE OR REPLACE FUNCTION reset_daily_early_leaves()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    UPDATE user_profiles
    SET early_leave_count = 0,
        early_leave_reset_date = CURRENT_DATE
    WHERE early_leave_reset_date < CURRENT_DATE
      AND early_leave_count > 0;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate MMR change using Elo formula
-- K_Factor = 32 (standard competitive value)
CREATE OR REPLACE FUNCTION calculate_mmr_change(
    p_winner_mmr INTEGER,
    p_loser_mmr INTEGER
)
RETURNS TABLE (
    winner_change INTEGER,
    loser_change INTEGER
) AS $$
DECLARE
    k_factor CONSTANT INTEGER := 32;
    expected_winner FLOAT;
    v_winner_change INTEGER;
    v_loser_change INTEGER;
BEGIN
    expected_winner := 1.0 / (1.0 + POWER(10, (p_loser_mmr - p_winner_mmr)::FLOAT / 400.0));
    v_winner_change := ROUND(k_factor * (1.0 - expected_winner))::INTEGER;
    v_loser_change := -v_winner_change;
    
    IF v_winner_change < 1 THEN v_winner_change := 1; END IF;
    IF v_loser_change > -1 THEN v_loser_change := -1; END IF;
    
    RETURN QUERY SELECT v_winner_change, v_loser_change;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update MMR for both players after a match
CREATE OR REPLACE FUNCTION update_match_mmr(
    p_winner_id UUID,
    p_loser_id UUID
)
RETURNS TABLE (
    winner_new_mmr INTEGER,
    loser_new_mmr INTEGER,
    winner_change INTEGER,
    loser_change INTEGER
) AS $$
DECLARE
    v_winner_mmr INTEGER;
    v_loser_mmr INTEGER;
    v_winner_change INTEGER;
    v_loser_change INTEGER;
    v_winner_new INTEGER;
    v_loser_new INTEGER;
BEGIN
    SELECT mmr INTO v_winner_mmr FROM user_profiles WHERE id = p_winner_id;
    SELECT mmr INTO v_loser_mmr FROM user_profiles WHERE id = p_loser_id;
    
    v_winner_mmr := COALESCE(v_winner_mmr, 1000);
    v_loser_mmr := COALESCE(v_loser_mmr, 1000);
    
    SELECT mc.winner_change, mc.loser_change 
    INTO v_winner_change, v_loser_change
    FROM calculate_mmr_change(v_winner_mmr, v_loser_mmr) mc;
    
    v_winner_new := GREATEST(100, LEAST(3000, v_winner_mmr + v_winner_change));
    v_loser_new := GREATEST(100, LEAST(3000, v_loser_mmr + v_loser_change));
    
    UPDATE user_profiles SET mmr = v_winner_new WHERE id = p_winner_id;
    UPDATE user_profiles SET mmr = v_loser_new WHERE id = p_loser_id;
    
    RETURN QUERY SELECT v_winner_new, v_loser_new, v_winner_change, v_loser_change;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_active_cooldown TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_queue_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION get_queue_position TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_queue_tickets TO service_role;
GRANT EXECUTE ON FUNCTION reset_daily_early_leaves TO service_role;
GRANT EXECUTE ON FUNCTION calculate_mmr_change TO authenticated;
GRANT EXECUTE ON FUNCTION update_match_mmr TO service_role;
