#!/usr/bin/env python3
"""
Generate TypeScript Fortnite quiz data file from validated JSON.
"""

import json
from pathlib import Path

INPUT_FILE = Path("scripts/data/fortnite_questions_validated.json")
OUTPUT_FILE = Path("frontend/src/data/fortnite-quiz-data.ts")


def escape_ts_string(s: str) -> str:
    """Escape string for TypeScript."""
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')


def determine_difficulty(q: dict) -> str:
    """Determine difficulty based on question content."""
    question = q.get('question', q.get('text', '')).lower()
    
    # Expert indicators
    expert_keywords = ['exact', 'specific', 'date', 'how many days', 'tier', 'level', 'percentage']
    if any(kw in question for kw in expert_keywords):
        return 'expert'
    
    # Legendary indicators
    legendary_keywords = ['first ever', 'record', 'exact date', 'exact number']
    if any(kw in question for kw in legendary_keywords):
        return 'legendary'
    
    # Casual indicators
    casual_keywords = ['what is', 'who is', 'which', 'name the', 'what year']
    if any(kw in question for kw in casual_keywords):
        return 'casual'
    
    return 'moderate'


def generate():
    """Generate the TypeScript file."""
    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found. Run fix_fortnite_questions.py first.")
        return
    
    with open(INPUT_FILE, 'r') as f:
        questions = json.load(f)
    
    print(f"Processing {len(questions)} questions...")
    
    ts_questions = []
    
    for q in questions:
        options = q.get('options', q.get('answers', []))
        # Support multiple field names for correct answer
        correct = q.get('correct_index', q.get('correct_answer', q.get('correctAnswer', 0)))
        
        # Determine correct index
        if isinstance(correct, int):
            correct_idx = correct
        else:
            try:
                correct_idx = options.index(correct)
            except ValueError:
                # Try case-insensitive match
                correct_lower = str(correct).lower()
                correct_idx = next((i for i, o in enumerate(options) if str(o).lower() == correct_lower), 0)
        
        difficulty = determine_difficulty(q)
        points = {'casual': 1, 'moderate': 2, 'expert': 3, 'legendary': 4, 'impossible': 5}.get(difficulty, 2)
        
        # Get question text (support both 'question' and 'text' fields)
        question_text = q.get('question', q.get('text', ''))
        
        # Get subcategory for explanation
        subcategory = q.get('subcategory', q.get('category', 'general'))
        
        # Map to valid QuizCategory - all fortnite questions use 'general' as main category
        # The subcategory is preserved in explanation and tags
        category = 'general'
        if 'chapter' in question_text.lower() or 'season' in question_text.lower():
            category = 'seasons'
        elif 'skin' in question_text.lower() or 'cosmetic' in question_text.lower():
            category = 'skins'
        elif 'event' in question_text.lower() or 'concert' in question_text.lower():
            category = 'events'
        elif 'weapon' in question_text.lower() or 'gun' in question_text.lower():
            category = 'weapons'
        elif 'esport' in question_text.lower() or 'fncs' in question_text.lower() or 'tournament' in question_text.lower():
            category = 'esports'
        elif 'collab' in question_text.lower() or 'crossover' in question_text.lower():
            category = 'collabs'
        elif 'map' in question_text.lower() or 'poi' in question_text.lower() or 'location' in question_text.lower():
            category = 'maps'
        
        ts_questions.append({
            'id': f"fn_{q.get('id', len(ts_questions) + 1)}",
            'question': question_text,
            'options': options[:4],  # Ensure only 4 options
            'correctAnswer': correct_idx,
            'explanation': q.get('explanation', f'Category: {subcategory}'),
            'difficulty': difficulty,
            'category': category,
            'points': points,
            'tags': ['fortnite', subcategory]
        })
    
    # Generate TypeScript content
    ts_content = f'''/**
 * Fortnite Quiz Question Database
 * Auto-generated from validated JSON data
 * Total questions: {len(ts_questions)}
 */

import type {{ QuizQuestion, TimelineQuestion, EraBattleQuestion, PersonalityQuestion, SurveyQuestion }} from '@/types/quiz'

// ============================================================================
// CLASSIC QUIZ QUESTIONS
// ============================================================================

export const quizQuestions: QuizQuestion[] = [
'''
    
    for i, q in enumerate(ts_questions):
        ts_content += f'''  {{
    id: '{q["id"]}',
    question: '{escape_ts_string(q["question"])}',
    options: [{', '.join(f"'{escape_ts_string(str(o))}'" for o in q["options"])}],
    correctAnswer: {q["correctAnswer"]},
    explanation: '{escape_ts_string(q["explanation"])}',
    difficulty: '{q["difficulty"]}',
    category: '{q["category"]}',
    points: {q["points"]},
    tags: [{', '.join(f"'{t}'" for t in q["tags"])}]
  }}'''
        if i < len(ts_questions) - 1:
            ts_content += ','
        ts_content += '\n'
    
    ts_content += ''']

// ============================================================================
// TIMELINE QUESTIONS (placeholder)
// ============================================================================

export const timelineQuestions: TimelineQuestion[] = []

// ============================================================================
// ERA BATTLE QUESTIONS (placeholder)
// ============================================================================

export const eraBattleQuestions: EraBattleQuestion[] = []

// ============================================================================
// PERSONALITY QUIZ QUESTIONS (placeholder)
// ============================================================================

export const personalityQuestions: PersonalityQuestion[] = []

// ============================================================================
// SURVEY QUESTIONS (placeholder)
// ============================================================================

export const surveyQuestions: SurveyQuestion[] = []

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsByDifficulty(difficulty: QuizQuestion['difficulty']): QuizQuestion[] {
  return quizQuestions.filter(q => q.difficulty === difficulty)
}

export function getQuestionsByCategory(category: QuizQuestion['category']): QuizQuestion[] {
  return quizQuestions.filter(q => q.category === category)
}

export function getQuestionsByChapter(chapter: number): QuizQuestion[] {
  return quizQuestions.filter(q => q.chapter === chapter)
}

export function getRandomQuestions(count: number, filters?: {
  difficulty?: QuizQuestion['difficulty']
  category?: QuizQuestion['category']
  chapter?: number
}): QuizQuestion[] {
  let pool = [...quizQuestions]
  
  if (filters?.difficulty) {
    pool = pool.filter(q => q.difficulty === filters.difficulty)
  }
  if (filters?.category) {
    pool = pool.filter(q => q.category === filters.category)
  }
  if (filters?.chapter) {
    pool = pool.filter(q => q.chapter === filters.chapter)
  }
  
  // Shuffle and take count
  const shuffled = pool.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function calculateRank(percentage: number): string {
  if (percentage >= 90) return 'Fortnite Historian'
  if (percentage >= 75) return 'Expert Player'
  if (percentage >= 60) return 'Veteran Player'
  if (percentage >= 40) return 'Experienced Player'
  return 'Casual Player'
}

export function getPersonalityResult(traits: Record<string, number>): {
  era: string
  description: string
  skins: string[]
} {
  const eraScores = {
    'Chapter 1 OG': (traits.chapter1 || 0) + (traits.og || 0) + (traits.nostalgia || 0),
    'Chapter 2 Collab Era': (traits.chapter2 || 0) + (traits.collabs || 0) + (traits.music || 0),
    'Chapter 3 Evolution': (traits.chapter3 || 0) + (traits.zerobuild || 0) + (traits.flexible || 0),
    'Modern Fortnite': (traits.chapter4 || 0) + (traits.chapter5 || 0) + (traits.gaming || 0),
  }
  
  const topEra = Object.entries(eraScores).sort((a, b) => b[1] - a[1])[0]
  
  const descriptions: Record<string, { desc: string; skins: string[] }> = {
    'Chapter 1 OG': {
      desc: 'You\\'re a true OG who values the original Fortnite experience.',
      skins: ['Black Knight', 'Renegade Raider', 'Omega', 'Drift']
    },
    'Chapter 2 Collab Era': {
      desc: 'You love when Fortnite brings in your favorite characters.',
      skins: ['Iron Man', 'Mandalorian', 'Travis Scott', 'Deadpool']
    },
    'Chapter 3 Evolution': {
      desc: 'You appreciate how Fortnite evolved and aren\\'t afraid of change.',
      skins: ['Spider-Man', 'The Foundation', 'Prowler', 'Evie']
    },
    'Modern Fortnite': {
      desc: 'You\\'re all about the latest and greatest content.',
      skins: ['Geralt', 'Kratos', 'Doom Slayer', 'Peter Griffin']
    },
  }
  
  return {
    era: topEra[0],
    description: descriptions[topEra[0]].desc,
    skins: descriptions[topEra[0]].skins
  }
}
'''
    
    # Write file
    with open(OUTPUT_FILE, 'w') as f:
        f.write(ts_content)
    
    print(f"Generated {OUTPUT_FILE} with {len(ts_questions)} questions")
    
    # Stats
    difficulties = {}
    for q in ts_questions:
        d = q['difficulty']
        difficulties[d] = difficulties.get(d, 0) + 1
    
    print(f"\nDifficulty breakdown:")
    for d, count in sorted(difficulties.items()):
        print(f"  {d}: {count}")


if __name__ == '__main__':
    generate()
