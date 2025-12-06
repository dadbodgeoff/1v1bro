-- 009_elo_ratings.sql
-- ELO rating system: player ratings, match results, leaderboards
-- Requirements: 5.1, 5.2, 5.4, 5.5

-- ============================================
-- Player ELO Ratings
-- ============================================
CREATE TABLE IF NOT EXISTS player_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    current_elo INTEGER DEFAULT 1200,
    peak_elo INTEGER DEFAULT 1200,
    current_tier VARCHAR(20) DEFAULT 'Gold' CHECK (current_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster')),
    tier_rank INTEGER,
    win_rate FLOAT DEFAULT 0.0,
    last_match_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view ratings (for leaderboards)
CREATE POLICY "Authenticated users can view ratings" ON player_ratings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own rating (via service)
CREATE POLICY "Users can update own rating" ON player_ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own rating
CREATE POLICY "Users can create own rating" ON player_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Match Results (ELO history)
-- ============================================
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    player1_id UUID NOT NULL REFERENCES user_profiles(id),
    player2_id UUID NOT NULL REFERENCES user_profiles(id),
    winner_id UUID REFERENCES user_profiles(id),
    duration_seconds INTEGER,
    player1_pre_elo INTEGER,
    player2_pre_elo INTEGER,
    player1_post_elo INTEGER,
    player2_post_elo INTEGER,
    elo_delta_p1 INTEGER,
    elo_delta_p2 INTEGER,
    played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Players can view matches they participated in
CREATE POLICY "Players can view their matches" ON match_results
    FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- ============================================
-- Indexes for Query Performance
-- ============================================
-- Leaderboard queries (sorted by ELO)
CREATE INDEX IF NOT EXISTS idx_player_ratings_elo ON player_ratings(current_elo DESC);
CREATE INDEX IF NOT EXISTS idx_player_ratings_tier ON player_ratings(current_tier);
CREATE INDEX IF NOT EXISTS idx_player_ratings_user ON player_ratings(user_id);

-- Match history queries
CREATE INDEX IF NOT EXISTS idx_match_results_player1 ON match_results(player1_id);
CREATE INDEX IF NOT EXISTS idx_match_results_player2 ON match_results(player2_id);
CREATE INDEX IF NOT EXISTS idx_match_results_winner ON match_results(winner_id);
CREATE INDEX IF NOT EXISTS idx_match_results_played_at ON match_results(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_results_match ON match_results(match_id);

-- ============================================
-- Trigger to update player_ratings.updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_player_ratings_updated_at ON player_ratings;
CREATE TRIGGER update_player_ratings_updated_at
    BEFORE UPDATE ON player_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to initialize rating for new users
-- ============================================
CREATE OR REPLACE FUNCTION public.initialize_player_rating()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.player_ratings (user_id, current_elo, peak_elo, current_tier)
    VALUES (NEW.id, 1200, 1200, 'Gold')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create rating when profile is created
DROP TRIGGER IF EXISTS on_profile_created_init_rating ON user_profiles;
CREATE TRIGGER on_profile_created_init_rating
    AFTER INSERT ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.initialize_player_rating();

-- ============================================
-- Backfill existing users with default rating
-- ============================================
INSERT INTO player_ratings (user_id, current_elo, peak_elo, current_tier)
SELECT id, 1200, 1200, 'Gold'
FROM user_profiles
WHERE id NOT IN (SELECT user_id FROM player_ratings)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- DROP TRIGGER IF EXISTS on_profile_created_init_rating ON user_profiles;
-- DROP FUNCTION IF EXISTS public.initialize_player_rating();
-- DROP TABLE IF EXISTS match_results;
-- DROP TABLE IF EXISTS player_ratings;
