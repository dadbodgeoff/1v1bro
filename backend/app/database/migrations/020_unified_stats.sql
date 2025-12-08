-- ============================================
-- Unified Stats Migration
-- Version: 020
-- Description: Consolidates ELO ratings into user_profiles table
--              for single source of truth
-- ============================================

-- ============================================
-- PHASE 1: Add ELO columns to user_profiles
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS current_elo INTEGER DEFAULT 1200;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS peak_elo INTEGER DEFAULT 1200;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS current_tier VARCHAR(20) DEFAULT 'Gold';

-- ============================================
-- PHASE 2: Migrate existing data from player_ratings
-- ============================================
UPDATE user_profiles up
SET 
    current_elo = COALESCE(pr.current_elo, 1200),
    peak_elo = COALESCE(pr.peak_elo, 1200),
    current_tier = COALESCE(pr.current_tier, 'Gold')
FROM player_ratings pr
WHERE up.id = pr.user_id;

-- ============================================
-- PHASE 3: Create index for ELO leaderboard queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_elo 
ON user_profiles(current_elo DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tier 
ON user_profiles(current_tier);

-- Composite index for regional ELO leaderboards
CREATE INDEX IF NOT EXISTS idx_user_profiles_country_elo 
ON user_profiles(country, current_elo DESC);

-- ============================================
-- PHASE 4: Update stored procedure to include ELO
-- ============================================
CREATE OR REPLACE FUNCTION increment_player_stats(
    p_user_id UUID,
    p_games_played_delta INTEGER DEFAULT 0,
    p_games_won_delta INTEGER DEFAULT 0,
    p_score_delta INTEGER DEFAULT 0,
    p_questions_delta INTEGER DEFAULT 0,
    p_correct_delta INTEGER DEFAULT 0,
    p_answer_time_delta BIGINT DEFAULT 0,
    p_kills_delta INTEGER DEFAULT 0,
    p_deaths_delta INTEGER DEFAULT 0,
    p_damage_dealt_delta INTEGER DEFAULT 0,
    p_damage_taken_delta INTEGER DEFAULT 0,
    p_shots_fired_delta INTEGER DEFAULT 0,
    p_shots_hit_delta INTEGER DEFAULT 0,
    p_powerups_delta INTEGER DEFAULT 0,
    p_elo_delta INTEGER DEFAULT 0,
    p_new_tier VARCHAR DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_new_elo INTEGER;
    v_current_peak INTEGER;
BEGIN
    SELECT current_elo, peak_elo INTO v_new_elo, v_current_peak
    FROM user_profiles WHERE id = p_user_id;
    
    v_new_elo := GREATEST(100, LEAST(3000, COALESCE(v_new_elo, 1200) + p_elo_delta));
    
    UPDATE user_profiles SET
        games_played = games_played + p_games_played_delta,
        games_won = games_won + p_games_won_delta,
        total_score = total_score + p_score_delta,
        total_questions_answered = total_questions_answered + p_questions_delta,
        total_correct_answers = total_correct_answers + p_correct_delta,
        total_answer_time_ms = total_answer_time_ms + p_answer_time_delta,
        total_kills = total_kills + p_kills_delta,
        total_deaths = total_deaths + p_deaths_delta,
        total_damage_dealt = total_damage_dealt + p_damage_dealt_delta,
        total_damage_taken = total_damage_taken + p_damage_taken_delta,
        shots_fired = shots_fired + p_shots_fired_delta,
        shots_hit = shots_hit + p_shots_hit_delta,
        total_powerups_collected = total_powerups_collected + p_powerups_delta,
        current_elo = v_new_elo,
        peak_elo = GREATEST(COALESCE(peak_elo, v_new_elo), v_new_elo),
        current_tier = COALESCE(p_new_tier, current_tier),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 5: Create ELO leaderboard function
-- ============================================
CREATE OR REPLACE FUNCTION get_leaderboard_elo(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC,
    tier VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY up.current_elo DESC, up.games_won DESC)::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        up.current_elo::NUMERIC as stat_value,
        up.games_played::NUMERIC as secondary_stat,
        up.current_tier as tier
    FROM user_profiles up
    WHERE up.current_elo IS NOT NULL
    ORDER BY up.current_elo DESC, up.games_won DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Regional ELO leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard_elo_regional(p_country VARCHAR, p_limit INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC,
    tier VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY up.current_elo DESC, up.games_won DESC)::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        up.current_elo::NUMERIC as stat_value,
        up.games_played::NUMERIC as secondary_stat,
        up.current_tier as tier
    FROM user_profiles up
    WHERE up.country = UPPER(p_country)
      AND up.current_elo IS NOT NULL
    ORDER BY up.current_elo DESC, up.games_won DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 6: Deprecate legacy table
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_ratings') THEN
        ALTER TABLE player_ratings RENAME TO player_ratings_deprecated;
        COMMENT ON TABLE player_ratings_deprecated IS 
            'DEPRECATED: Data migrated to user_profiles on 2025-12-08. Remove after 2025-03-01';
    END IF;
END $$;

-- ============================================
-- PHASE 7: Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_leaderboard_elo TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_elo TO service_role;
GRANT EXECUTE ON FUNCTION get_leaderboard_elo_regional TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_elo_regional TO service_role;
