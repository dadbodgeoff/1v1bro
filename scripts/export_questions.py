#!/usr/bin/env python3
"""
Export questions from NFL and Fortnite categories for review.
Outputs to CSV and JSON files for easy review and editing.

Usage:
    python scripts/export_questions.py

Output:
    - questions_nfl.csv
    - questions_fortnite.csv
    - questions_nfl.json
    - questions_fortnite.json
"""

import os
import sys
import json
import csv
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import asyncio
import asyncpg
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')

async def get_questions_by_category(conn, category_slug: str):
    """Fetch all questions for a category."""
    query = """
        SELECT 
            q.id,
            q.text,
            q.options,
            q.correct_index,
            q.difficulty,
            q.explanation,
            q.is_active,
            q.is_verified,
            q.times_shown,
            q.times_correct,
            q.created_at,
            sc.name as subcategory
        FROM questions q
        JOIN question_categories c ON q.category_id = c.id
        LEFT JOIN question_subcategories sc ON q.subcategory_id = sc.id
        WHERE c.slug = $1
        ORDER BY q.created_at DESC
    """
    return await conn.fetch(query, category_slug)

def format_question_for_review(row):
    """Format a question row for easy review."""
    options = row['options']
    if isinstance(options, str):
        options = json.loads(options)
    
    correct_answer = options[row['correct_index']] if row['correct_index'] < len(options) else "INVALID INDEX"
    
    # Calculate accuracy if shown
    accuracy = None
    if row['times_shown'] and row['times_shown'] > 0:
        accuracy = round(row['times_correct'] / row['times_shown'] * 100, 1)
    
    return {
        'id': str(row['id']),
        'question': row['text'],
        'option_a': options[0] if len(options) > 0 else '',
        'option_b': options[1] if len(options) > 1 else '',
        'option_c': options[2] if len(options) > 2 else '',
        'option_d': options[3] if len(options) > 3 else '',
        'correct_answer': correct_answer,
        'correct_index': row['correct_index'],
        'difficulty': row['difficulty'],
        'subcategory': row['subcategory'] or '',
        'explanation': row['explanation'] or '',
        'is_active': row['is_active'],
        'is_verified': row['is_verified'],
        'times_shown': row['times_shown'] or 0,
        'accuracy_pct': accuracy,
        'created_at': row['created_at'].isoformat() if row['created_at'] else '',
        'REMOVE': '',  # Column for you to mark questions to remove
        'NOTES': '',   # Column for your notes
    }

async def export_category(conn, category_slug: str, output_dir: str):
    """Export all questions for a category to CSV and JSON."""
    print(f"\nExporting {category_slug} questions...")
    
    rows = await get_questions_by_category(conn, category_slug)
    print(f"  Found {len(rows)} questions")
    
    if not rows:
        print(f"  No questions found for {category_slug}")
        return
    
    questions = [format_question_for_review(row) for row in rows]
    
    # Export to CSV
    csv_path = os.path.join(output_dir, f'questions_{category_slug}.csv')
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=questions[0].keys())
        writer.writeheader()
        writer.writerows(questions)
    print(f"  Exported to {csv_path}")
    
    # Export to JSON (for programmatic processing)
    json_path = os.path.join(output_dir, f'questions_{category_slug}.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"  Exported to {json_path}")
    
    # Print summary stats
    active_count = sum(1 for q in questions if q['is_active'])
    verified_count = sum(1 for q in questions if q['is_verified'])
    by_difficulty = {}
    for q in questions:
        d = q['difficulty'] or 'unknown'
        by_difficulty[d] = by_difficulty.get(d, 0) + 1
    
    print(f"\n  Summary for {category_slug}:")
    print(f"    Total: {len(questions)}")
    print(f"    Active: {active_count}")
    print(f"    Verified: {verified_count}")
    print(f"    By difficulty: {by_difficulty}")
    
    return questions

async def main():
    print("=" * 60)
    print("Question Export Tool")
    print("=" * 60)
    
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set in environment")
        sys.exit(1)
    
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'question_review')
    os.makedirs(output_dir, exist_ok=True)
    print(f"\nOutput directory: {output_dir}")
    
    # Connect to database
    print(f"\nConnecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Export NFL and Fortnite questions
        await export_category(conn, 'nfl', output_dir)
        await export_category(conn, 'fortnite', output_dir)
        
        print("\n" + "=" * 60)
        print("INSTRUCTIONS FOR REVIEW:")
        print("=" * 60)
        print("""
1. Open the CSV files in Excel or Google Sheets
2. Review each question for:
   - Factual accuracy
   - Opinion-based content (should be removed)
   - Outdated information
   - Unclear wording
   - Incorrect answers

3. Mark questions to remove by putting 'X' in the REMOVE column
4. Add notes in the NOTES column if needed

5. Save the CSV and run the delete script:
   python scripts/delete_flagged_questions.py

Common issues to look for:
- "Who is the best..." (opinion)
- "What is your favorite..." (opinion)
- Questions about current season stats (may be outdated)
- Questions with multiple correct answers
- Questions that are too easy or too hard
""")
        
    finally:
        await conn.close()
    
    print("\nDone!")

if __name__ == '__main__':
    asyncio.run(main())
