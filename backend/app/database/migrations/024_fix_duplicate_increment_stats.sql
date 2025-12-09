-- ============================================
-- Fix Duplicate increment_player_stats Function
-- Version: 024
-- Description: Drops the old 14-parameter version and ensures only the 16-parameter version exists
-- ============================================

-- Drop the old 14-parameter version (without elo_delta and new_tier)
DROP FUNCTION IF EXISTS increment_player_stats(
    UUID,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    BIGINT,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER
);

-- Drop the 16-parameter version too so we can recreate it cleanly
DROP FUNCTION IF EXISTS increment_player_stats(
    UUID,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    BIGINT,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    INTEGER,
    CHARACTER VARYING
);

-- Recreate the function with 16 parameters (including elo_delta and new_tier)
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
    p_new_tier CHARACTER VARYING DEFAULT NULL
)
RETURNS void AS $$
BEGIN
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
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Note: p_elo_delta and p_new_tier are accepted but not used yet
    -- They can be used when ELO/tier columns are added to user_profiles
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_player_stats(
    UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, BIGINT,
    INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER,
    INTEGER, CHARACTER VARYING
) TO authenticated;

GRANT EXECUTE ON FUNCTION increment_player_stats(
    UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, BIGINT,
    INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER,
    INTEGER, CHARACTER VARYING
) TO service_role;
