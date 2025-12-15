#!/usr/bin/env python3
"""
Generate TypeScript NFL quiz data file from cleaned CSV.
"""

import csv
import json
from pathlib import Path

INPUT_FILE = Path(".kiro/specs/vortex-arena-map/nfl_trivia_final.csv")
OUTPUT_FILE = Path("frontend/src/data/nfl-quiz-data.ts")


def escape_ts_string(s: str) -> str:
    """Escape string for TypeScript."""
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')


def generate():
    """Generate the TypeScript file."""
    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found")
        return
    
    questions = []
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Determine correct answer index
            options = [row['Option A'], row['Option B'], row['Option C'], row['Option D']]
            correct = row['Correct Answer']
            try:
                correct_index = options.index(correct)
            except ValueError:
                print(f"Warning: Correct answer '{correct}' not in options for question {row['ID']}")
                continue
            
            # Map category to difficulty
            category = row['Category']
            difficulty = 'moderate'  # Default
            if 'record' in category.lower() or 'historical' in category.lower():
                difficulty = 'expert'
            elif 'super bowl' in category.lower() or 'playoff' in category.lower():
                difficulty = 'moderate'
            elif 'award' in category.lower() or 'season' in category.lower():
                difficulty = 'casual'
            
            questions.append({
                'id': f"nfl_{row['ID']}",
                'question': row['Question'],
                'options': options,
                'correctAnswer': correct_index,
                'explanation': f"Category: {category}",
                'difficulty': difficulty,
                'category': 'nfl',
                'points': 2 if difficulty == 'casual' else 3 if difficulty == 'moderate' else 4,
                'tags': ['nfl', category.lower().replace(' ', '-')]
            })
    
    # Generate TypeScript
    ts_content = '''/**
 * NFL Quiz Question Database
 * Auto-generated from validated CSV data
 * Total questions: ''' + str(len(questions)) + '''
 */

import type { QuizQuestion } from '@/types/quiz'

export const nflQuizQuestions: QuizQuestion[] = [
'''
    
    for i, q in enumerate(questions):
        ts_content += f'''  {{
    id: '{q["id"]}',
    question: '{escape_ts_string(q["question"])}',
    options: [{', '.join(f"'{escape_ts_string(o)}'" for o in q["options"])}],
    correctAnswer: {q["correctAnswer"]},
    explanation: '{escape_ts_string(q["explanation"])}',
    difficulty: '{q["difficulty"]}',
    category: 'nfl',
    points: {q["points"]},
    tags: [{', '.join(f"'{t}'" for t in q["tags"])}]
  }}'''
        if i < len(questions) - 1:
            ts_content += ','
        ts_content += '\n'
    
    ts_content += ''']

/**
 * Get random NFL questions
 */
export function getRandomNflQuestions(count: number, filters?: {
  difficulty?: QuizQuestion['difficulty']
}): QuizQuestion[] {
  let pool = [...nflQuizQuestions]
  
  if (filters?.difficulty) {
    pool = pool.filter(q => q.difficulty === filters.difficulty)
  }
  
  // Shuffle and take count
  const shuffled = pool.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * Get all NFL questions
 */
export function getAllNflQuestions(): QuizQuestion[] {
  return [...nflQuizQuestions]
}
'''
    
    # Write file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"Generated {OUTPUT_FILE} with {len(questions)} questions")
    
    # Stats
    difficulties = {}
    for q in questions:
        d = q['difficulty']
        difficulties[d] = difficulties.get(d, 0) + 1
    
    print(f"\nDifficulty breakdown:")
    for d, count in sorted(difficulties.items()):
        print(f"  {d}: {count}")


if __name__ == '__main__':
    generate()
