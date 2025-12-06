-- ============================================
-- Player Stats & Leaderboards Migration
-- Version: 002
-- Description: Adds comprehensive statistics tracking to user_profiles
-- ============================================

-- ============================================
-- TRIVIA STATISTICS
-- Tracks question answering performance
-- ============================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_questions_answered INTEGER DEFAULT 0;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_correct_answers INTEGER DEFAULT 0;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_answer_time_ms BIGINT DEFAULT 0;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS fastest_answer_ms INTEGER;

-- ============================================
-- COMBAT STATISTICS
-- Tracks PvP combat performance
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS total_kills INTEGER DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS total_deaths INTEGER DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS total_damage_dealt INTEGER DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS total_damage_taken INTEGER DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS shots_fired INTEGER DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS shots_hit INTEGER DEFAULT 0;

-- ============================================
-- STREAK STATISTICS
-- Tracks win streaks
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS current_win_streak INTEGER DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS best_win_streak INTEGER DEFAULT 0;


-- ============================================
-- COLLECTION STATISTICS
-- Tracks power-ups and items collected
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS total_powerups_collected INTEGER DEFAULT 0;

-- ============================================
-- GAMES TABLE EXTENSION
-- Stores per-game combat summaries
-- ============================================
ALTER TABLE games
ADD COLUMN IF NOT EXISTS player1_combat_stats JSONB DEFAULT '{}';

ALTER TABLE games
ADD COLUMN IF NOT EXISTS player2_combat_stats JSONB DEFAULT '{}';

-- ============================================
-- LEADERBOARD INDEXES
-- Optimized for common leaderboard queries
-- ============================================

-- Simple sort indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_games_won 
ON user_profiles(games_won DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_total_score 
ON user_profiles(total_score DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_total_kills 
ON user_profiles(total_kills DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_best_streak 
ON user_profiles(best_win_streak DESC);

-- Partial indexes for ratio leaderboards with minimum requirements
-- Win rate: minimum 10 games played
CREATE INDEX IF NOT EXISTS idx_user_profiles_win_rate 
ON user_profiles(games_won DESC, games_played) 
WHERE games_played >= 10;

-- Accuracy: minimum 100 shots fired
CREATE INDEX IF NOT EXISTS idx_user_profiles_accuracy 
ON user_profiles(shots_hit DESC, shots_fired) 
WHERE shots_fired >= 100;

-- K/D ratio: minimum 10 deaths
CREATE INDEX IF NOT EXISTS idx_user_profiles_kd_ratio 
ON user_profiles(total_kills DESC, total_deaths) 
WHERE total_deaths >= 10;

-- Fastest thinker: minimum 50 correct answers
CREATE INDEX IF NOT EXISTS idx_user_profiles_answer_speed 
ON user_profiles(total_answer_time_ms ASC, total_correct_answers) 
WHERE total_correct_answers >= 50;

-- Answer rate: minimum 100 questions answered
CREATE INDEX IF NOT EXISTS idx_user_profiles_answer_rate 
ON user_profiles(total_correct_answers DESC, total_questions_answered) 
WHERE total_questions_answered >= 100;

-- ============================================
-- STORED PROCEDURE: Atomic Stat Increment
-- Single transaction for all stat updates
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
    p_powerups_delta INTEGER DEFAULT 0
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORED PROCEDURE: Update Win Streak
-- Handles streak increment and reset
-- ============================================
CREATE OR REPLACE FUNCTION update_win_streak(p_user_id UUID, p_won BOOLEAN)
RETURNS void AS $$
BEGIN
    IF p_won THEN
        -- Increment current streak and update best if needed
        UPDATE user_profiles SET
            current_win_streak = current_win_streak + 1,
            best_win_streak = GREATEST(best_win_streak, current_win_streak + 1),
            updated_at = NOW()
        WHERE id = p_user_id;
    ELSE
        -- Reset current streak on loss
        UPDATE user_profiles SET
            current_win_streak = 0,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORED PROCEDURE: Update Fastest Answer
-- Only updates if new time is faster
-- ============================================
CREATE OR REPLACE FUNCTION update_fastest_answer(p_user_id UUID, p_time_ms INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles SET
        fastest_answer_ms = CASE 
            WHEN fastest_answer_ms IS NULL THEN p_time_ms
            WHEN p_time_ms < fastest_answer_ms THEN p_time_ms
            ELSE fastest_answer_ms
        END,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- LEADERBOARD VIEW FUNCTIONS
-- Reusable queries for each leaderboard type
-- ============================================

-- Get wins leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard_wins(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY up.games_won DESC, up.games_played DESC)::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        up.games_won::NUMERIC as stat_value,
        up.games_played::NUMERIC as secondary_stat
    FROM user_profiles up
    WHERE up.games_played > 0
    ORDER BY up.games_won DESC, up.games_played DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get win rate leaderboard (minimum 10 games)
CREATE OR REPLACE FUNCTION get_leaderboard_win_rate(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY (up.games_won::FLOAT / up.games_played) DESC)::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        ROUND((up.games_won::FLOAT / up.games_played * 100)::NUMERIC, 2) as stat_value,
        up.games_played::NUMERIC as secondary_stat
    FROM user_profiles up
    WHERE up.games_played >= 10
    ORDER BY (up.games_won::FLOAT / up.games_played) DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get kills leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard_kills(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY up.total_kills DESC)::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        up.total_kills::NUMERIC as stat_value,
        up.total_deaths::NUMERIC as secondary_stat
    FROM user_profiles up
    WHERE up.total_kills > 0
    ORDER BY up.total_kills DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get K/D ratio leaderboard (minimum 10 deaths)
CREATE OR REPLACE FUNCTION get_leaderboard_kd_ratio(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY 
            CASE WHEN up.total_deaths = 0 THEN up.total_kills::FLOAT 
                 ELSE up.total_kills::FLOAT / up.total_deaths END DESC
        )::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        ROUND(
            CASE WHEN up.total_deaths = 0 THEN up.total_kills::FLOAT 
                 ELSE up.total_kills::FLOAT / up.total_deaths END::NUMERIC, 2
        ) as stat_value,
        up.total_kills::NUMERIC as secondary_stat
    FROM user_profiles up
    WHERE up.total_deaths >= 10
    ORDER BY stat_value DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get accuracy leaderboard (minimum 100 shots)
CREATE OR REPLACE FUNCTION get_leaderboard_accuracy(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY (up.shots_hit::FLOAT / up.shots_fired) DESC)::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        ROUND((up.shots_hit::FLOAT / up.shots_fired * 100)::NUMERIC, 2) as stat_value,
        up.shots_fired::NUMERIC as secondary_stat
    FROM user_profiles up
    WHERE up.shots_fired >= 100
    ORDER BY (up.shots_hit::FLOAT / up.shots_fired) DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get fastest thinker leaderboard (minimum 50 correct answers, ASC order)
CREATE OR REPLACE FUNCTION get_leaderboard_fastest_thinker(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY 
            (up.total_answer_time_ms::FLOAT / up.total_correct_answers) ASC
        )::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        ROUND((up.total_answer_time_ms::FLOAT / up.total_correct_answers)::NUMERIC, 0) as stat_value,
        up.total_correct_answers::NUMERIC as secondary_stat
    FROM user_profiles up
    WHERE up.total_correct_answers >= 50
    ORDER BY (up.total_answer_time_ms::FLOAT / up.total_correct_answers) ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get answer rate leaderboard (minimum 100 questions)
CREATE OR REPLACE FUNCTION get_leaderboard_answer_rate(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY 
            (up.total_correct_answers::FLOAT / up.total_questions_answered) DESC
        )::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        ROUND((up.total_correct_answers::FLOAT / up.total_questions_answered * 100)::NUMERIC, 2) as stat_value,
        up.total_questions_answered::NUMERIC as secondary_stat
    FROM user_profiles up
    WHERE up.total_questions_answered >= 100
    ORDER BY (up.total_correct_answers::FLOAT / up.total_questions_answered) DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get win streak leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard_win_streak(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY up.best_win_streak DESC)::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        up.best_win_streak::NUMERIC as stat_value,
        up.current_win_streak::NUMERIC as secondary_stat
    FROM user_profiles up
    WHERE up.best_win_streak > 0
    ORDER BY up.best_win_streak DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get total score leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard_total_score(p_limit INTEGER, p_offset INTEGER)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stat_value NUMERIC,
    secondary_stat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY up.total_score DESC)::BIGINT as rank,
        up.id as user_id,
        up.display_name,
        up.avatar_url,
        up.total_score::NUMERIC as stat_value,
        up.games_played::NUMERIC as secondary_stat
    FROM user_profiles up
    WHERE up.total_score > 0
    ORDER BY up.total_score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- Allow authenticated users to call functions
-- ============================================
GRANT EXECUTE ON FUNCTION increment_player_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_win_streak TO authenticated;
GRANT EXECUTE ON FUNCTION update_fastest_answer TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_wins TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_win_rate TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_kills TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_kd_ratio TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_accuracy TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_fastest_thinker TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_answer_rate TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_win_streak TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_total_score TO authenticated;

-- Also grant to service_role for backend operations
GRANT EXECUTE ON FUNCTION increment_player_stats TO service_role;
GRANT EXECUTE ON FUNCTION update_win_streak TO service_role;
GRANT EXECUTE ON FUNCTION update_fastest_answer TO service_role;
