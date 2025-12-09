-- Migration: Ensure update_win_streak function exists
-- Fixes: Error processing game end - function not found in schema cache
-- This function is required for match completion to work properly

CREATE OR REPLACE FUNCTION update_win_streak(p_user_id UUID, p_won BOOLEAN)
RETURNS void AS $$
BEGIN
    IF p_won THEN
        UPDATE user_profiles SET
            current_win_streak = current_win_streak + 1,
            best_win_streak = GREATEST(best_win_streak, current_win_streak + 1),
            updated_at = NOW()
        WHERE id = p_user_id;
    ELSE
        UPDATE user_profiles SET
            current_win_streak = 0,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_win_streak TO authenticated;
GRANT EXECUTE ON FUNCTION update_win_streak TO service_role;
