-- ============================================
-- Migration: 017_questions_system.sql
-- Description: Scalable trivia questions system
-- ============================================

-- ============================================
-- Question Categories (fortnite, nfl, nba, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS question_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    question_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Question Subcategories (weapons, history, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS question_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES question_categories(id) ON DELETE CASCADE,
    slug VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    question_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

-- ============================================
-- Main Questions Table
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES question_categories(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES question_subcategories(id) ON DELETE SET NULL,
    
    -- Question content
    text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index SMALLINT NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    
    -- Metadata
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    explanation TEXT,
    source_url TEXT,
    image_url TEXT,
    
    -- Time-sensitive questions (sports scores, current events)
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    
    -- Analytics
    times_shown INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    avg_answer_time_ms INTEGER,
    
    -- Admin
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- User Question History (prevent repeats)
-- ============================================
CREATE TABLE IF NOT EXISTS user_question_history (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    shown_at TIMESTAMPTZ DEFAULT NOW(),
    was_correct BOOLEAN,
    answer_time_ms INTEGER,
    match_id UUID,
    PRIMARY KEY (user_id, question_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_subcategory ON questions(subcategory_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_valid_window ON questions(valid_from, valid_until) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active, category_id);
CREATE INDEX IF NOT EXISTS idx_user_history_user ON user_question_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_recent ON user_question_history(user_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON question_subcategories(category_id);

-- ============================================
-- Function: Update question count on category
-- ============================================
CREATE OR REPLACE FUNCTION update_category_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE question_categories 
        SET question_count = question_count + 1 
        WHERE id = NEW.category_id;
        
        IF NEW.subcategory_id IS NOT NULL THEN
            UPDATE question_subcategories 
            SET question_count = question_count + 1 
            WHERE id = NEW.subcategory_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE question_categories 
        SET question_count = question_count - 1 
        WHERE id = OLD.category_id;
        
        IF OLD.subcategory_id IS NOT NULL THEN
            UPDATE question_subcategories 
            SET question_count = question_count - 1 
            WHERE id = OLD.subcategory_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.category_id != NEW.category_id THEN
            UPDATE question_categories SET question_count = question_count - 1 WHERE id = OLD.category_id;
            UPDATE question_categories SET question_count = question_count + 1 WHERE id = NEW.category_id;
        END IF;
        IF OLD.subcategory_id IS DISTINCT FROM NEW.subcategory_id THEN
            IF OLD.subcategory_id IS NOT NULL THEN
                UPDATE question_subcategories SET question_count = question_count - 1 WHERE id = OLD.subcategory_id;
            END IF;
            IF NEW.subcategory_id IS NOT NULL THEN
                UPDATE question_subcategories SET question_count = question_count + 1 WHERE id = NEW.subcategory_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for question count
DROP TRIGGER IF EXISTS trigger_update_question_count ON questions;
CREATE TRIGGER trigger_update_question_count
AFTER INSERT OR UPDATE OR DELETE ON questions
FOR EACH ROW EXECUTE FUNCTION update_category_question_count();

-- ============================================
-- Function: Update question analytics
-- ============================================
CREATE OR REPLACE FUNCTION update_question_analytics(
    p_question_id UUID,
    p_was_correct BOOLEAN,
    p_answer_time_ms INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE questions
    SET 
        times_shown = times_shown + 1,
        times_correct = times_correct + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
        avg_answer_time_ms = CASE 
            WHEN avg_answer_time_ms IS NULL THEN p_answer_time_ms
            ELSE (avg_answer_time_ms * times_shown + p_answer_time_ms) / (times_shown + 1)
        END,
        updated_at = NOW()
    WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;

-- Categories: Public read
CREATE POLICY "Anyone can view active categories"
    ON question_categories FOR SELECT
    USING (is_active = true);

-- Subcategories: Public read
CREATE POLICY "Anyone can view active subcategories"
    ON question_subcategories FOR SELECT
    USING (is_active = true);

-- Questions: Public read for active questions
CREATE POLICY "Anyone can view active questions"
    ON questions FOR SELECT
    USING (is_active = true);

-- User history: Users can only see their own
CREATE POLICY "Users can view own question history"
    ON user_question_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question history"
    ON user_question_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question history"
    ON user_question_history FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- Seed Initial Categories
-- ============================================
INSERT INTO question_categories (slug, name, description, sort_order) VALUES
    ('fortnite', 'Fortnite', 'Fortnite Battle Royale trivia', 1),
    ('nfl', 'NFL Football', 'National Football League trivia', 2),
    ('nba', 'NBA Basketball', 'National Basketball Association trivia', 3),
    ('general', 'General Knowledge', 'General trivia questions', 10)
ON CONFLICT (slug) DO NOTHING;

-- Seed Fortnite subcategories
INSERT INTO question_subcategories (category_id, slug, name) 
SELECT id, 'history', 'Game History' FROM question_categories WHERE slug = 'fortnite'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO question_subcategories (category_id, slug, name) 
SELECT id, 'weapons', 'Weapons & Items' FROM question_categories WHERE slug = 'fortnite'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO question_subcategories (category_id, slug, name) 
SELECT id, 'map', 'Map & Locations' FROM question_categories WHERE slug = 'fortnite'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO question_subcategories (category_id, slug, name) 
SELECT id, 'seasons', 'Seasons & Events' FROM question_categories WHERE slug = 'fortnite'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO question_subcategories (category_id, slug, name) 
SELECT id, 'cosmetics', 'Skins & Cosmetics' FROM question_categories WHERE slug = 'fortnite'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO question_subcategories (category_id, slug, name) 
SELECT id, 'collabs', 'Collaborations' FROM question_categories WHERE slug = 'fortnite'
ON CONFLICT (category_id, slug) DO NOTHING;
