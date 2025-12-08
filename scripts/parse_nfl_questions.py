#!/usr/bin/env python3
"""
NFL Trivia Question Parser

Parses NFL trivia CSV files and imports them into the database.

Usage:
    python scripts/parse_nfl_questions.py                    # Parse and import
    python scripts/parse_nfl_questions.py --dry-run          # Parse only, no import
    python scripts/parse_nfl_questions.py --print-sample 5   # Print 5 sample questions

CSV Format Expected:
    ID, Category, Question, Option A, Option B, Option C, Option D, Correct Answer
"""

import os
import sys
import csv
import re
import argparse
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


def slugify_category(category: str) -> str:
    """
    Convert category name to slug format.
    
    Examples:
        "Recent Playoffs & Super Bowls" -> "recent_playoffs_super_bowls"
        "2024 NFL Season Awards" -> "2024_nfl_season_awards"
        "Tom Brady Career Stats" -> "tom_brady_career_stats"
    """
    # Lowercase
    slug = category.lower()
    # Replace & with and
    slug = slug.replace('&', 'and')
    # Replace spaces and special chars with underscores
    slug = re.sub(r'[^a-z0-9]+', '_', slug)
    # Remove leading/trailing underscores
    slug = slug.strip('_')
    # Collapse multiple underscores
    slug = re.sub(r'_+', '_', slug)
    return slug


def map_correct_answer(answer_text: str, options: List[str]) -> int:
    """
    Map correct answer text to index (0-3).
    
    The CSV has the full answer text in the "Correct Answer" column.
    We need to find which option (A-D) it matches.
    
    Returns:
        Index 0-3 corresponding to Option A-D
        
    Raises:
        ValueError if answer doesn't match any option
    """
    answer_text = answer_text.strip()
    
    # Try exact match first
    for i, option in enumerate(options):
        if option.strip() == answer_text:
            return i
    
    # Try case-insensitive match
    answer_lower = answer_text.lower()
    for i, option in enumerate(options):
        if option.strip().lower() == answer_lower:
            return i
    
    # Try partial match (answer might be truncated or have slight differences)
    for i, option in enumerate(options):
        opt_clean = option.strip().lower()
        if opt_clean.startswith(answer_lower[:20]) or answer_lower.startswith(opt_clean[:20]):
            return i
    
    raise ValueError(f"Answer '{answer_text}' doesn't match any option: {options}")


def parse_csv_row(row: Dict[str, str]) -> Optional[Dict]:
    """
    Parse a single CSV row into a question dict.
    
    Returns:
        Question dict or None if row is invalid
    """
    try:
        # Extract fields
        question_id = row.get('ID', '').strip()
        category = row.get('Category', '').strip()
        text = row.get('Question', '').strip()
        option_a = row.get('Option A', '').strip()
        option_b = row.get('Option B', '').strip()
        option_c = row.get('Option C', '').strip()
        option_d = row.get('Option D', '').strip()
        correct_answer = row.get('Correct Answer', '').strip()
        
        # Validate required fields
        if not text:
            logger.warning(f"Row {question_id}: Missing question text")
            return None
        
        if not all([option_a, option_b, option_c, option_d]):
            logger.warning(f"Row {question_id}: Missing one or more options")
            return None
        
        if not correct_answer:
            logger.warning(f"Row {question_id}: Missing correct answer")
            return None
        
        options = [option_a, option_b, option_c, option_d]
        
        # Map correct answer to index
        try:
            correct_index = map_correct_answer(correct_answer, options)
        except ValueError as e:
            logger.warning(f"Row {question_id}: {e}")
            return None
        
        return {
            'id': question_id,
            'category': category,
            'subcategory_slug': slugify_category(category) if category else 'general',
            'text': text,
            'options': options,
            'correct_index': correct_index,
            'difficulty': 'medium',  # Default difficulty
        }
        
    except Exception as e:
        logger.error(f"Error parsing row: {e}")
        return None


def parse_csv_file(filepath: str) -> Tuple[List[Dict], int]:
    """
    Parse a CSV file and return list of question dicts.
    
    Returns:
        Tuple of (questions list, skipped count)
    """
    questions = []
    skipped = 0
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            question = parse_csv_row(row)
            if question:
                questions.append(question)
            else:
                skipped += 1
    
    return questions, skipped


def format_question(q: Dict, show_answer: bool = True) -> str:
    """
    Pretty print a question for verification.
    """
    lines = [
        f"[{q.get('subcategory_slug', 'unknown')}] Q{q.get('id', '?')}:",
        f"  {q['text']}",
        f"  A) {q['options'][0]}",
        f"  B) {q['options'][1]}",
        f"  C) {q['options'][2]}",
        f"  D) {q['options'][3]}",
    ]
    
    if show_answer:
        correct_letter = chr(ord('A') + q['correct_index'])
        lines.append(f"  ✓ Correct: {correct_letter}) {q['options'][q['correct_index']]}")
    
    return '\n'.join(lines)



def get_supabase_client():
    """Get Supabase client with service role key."""
    from supabase import create_client
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    
    return create_client(url, key)


def get_or_create_category(client, slug: str, name: str) -> str:
    """Get category ID, creating if it doesn't exist."""
    result = client.table("question_categories").select("id").eq("slug", slug).execute()
    
    if result.data:
        return result.data[0]["id"]
    
    # Create category
    new_cat = client.table("question_categories").insert({
        "slug": slug,
        "name": name,
        "is_active": True,
    }).execute()
    
    logger.info(f"Created category: {name} ({slug})")
    return new_cat.data[0]["id"]


def get_or_create_subcategory(client, category_id: str, slug: str, name: str) -> str:
    """Get subcategory ID, creating if it doesn't exist."""
    result = (
        client.table("question_subcategories")
        .select("id")
        .eq("category_id", category_id)
        .eq("slug", slug)
        .execute()
    )
    
    if result.data:
        return result.data[0]["id"]
    
    # Create subcategory
    new_sub = client.table("question_subcategories").insert({
        "category_id": category_id,
        "slug": slug,
        "name": name,
        "is_active": True,
    }).execute()
    
    logger.info(f"Created subcategory: {name} ({slug})")
    return new_sub.data[0]["id"]


def import_questions(client, questions: List[Dict], category_id: str) -> Tuple[int, int]:
    """
    Import questions to database.
    
    Returns:
        Tuple of (imported count, skipped duplicates count)
    """
    # Get existing questions to check for duplicates
    existing = client.table("questions").select("text").eq("category_id", category_id).execute()
    existing_texts = {q["text"] for q in (existing.data or [])}
    
    # Build subcategory cache
    subcategory_cache = {}
    
    # Prepare questions for insertion
    now = datetime.utcnow().isoformat()
    new_questions = []
    skipped = 0
    
    for q in questions:
        if q["text"] in existing_texts:
            skipped += 1
            continue
        
        # Get or create subcategory
        subcat_slug = q["subcategory_slug"]
        if subcat_slug not in subcategory_cache:
            # Convert slug back to readable name
            subcat_name = q.get("category", subcat_slug.replace("_", " ").title())
            subcategory_cache[subcat_slug] = get_or_create_subcategory(
                client, category_id, subcat_slug, subcat_name
            )
        
        new_questions.append({
            "category_id": category_id,
            "subcategory_id": subcategory_cache[subcat_slug],
            "text": q["text"],
            "options": q["options"],
            "correct_index": q["correct_index"],
            "difficulty": q.get("difficulty", "medium"),
            "is_active": True,
            "is_verified": True,
            "created_at": now,
            "updated_at": now,
        })
        
        # Add to existing set to prevent duplicates within batch
        existing_texts.add(q["text"])
    
    if not new_questions:
        return 0, skipped
    
    # Insert in batches of 100
    total_inserted = 0
    batch_size = 100
    
    for i in range(0, len(new_questions), batch_size):
        batch = new_questions[i:i + batch_size]
        result = client.table("questions").insert(batch).execute()
        total_inserted += len(result.data) if result.data else 0
        logger.info(f"Inserted batch {i // batch_size + 1}: {len(batch)} questions")
    
    return total_inserted, skipped


def main():
    parser = argparse.ArgumentParser(description="Parse and import NFL trivia questions")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, don't import")
    parser.add_argument("--print-sample", type=int, default=0, help="Print N sample questions")
    parser.add_argument("--files", nargs="+", help="CSV files to parse (default: NFL files in specs)")
    
    args = parser.parse_args()
    
    # Default files
    if args.files:
        csv_files = args.files
    else:
        csv_files = [
            ".kiro/specs/vortex-arena-map/nfl_trivia_500_questions.csv",
            ".kiro/specs/vortex-arena-map/nfl_trivia_500_questions_part2.csv",
        ]
    
    # Parse all files
    all_questions = []
    total_skipped = 0
    
    for filepath in csv_files:
        if not os.path.exists(filepath):
            logger.error(f"File not found: {filepath}")
            continue
        
        logger.info(f"Parsing {filepath}...")
        questions, skipped = parse_csv_file(filepath)
        all_questions.extend(questions)
        total_skipped += skipped
        logger.info(f"  Parsed {len(questions)} questions, skipped {skipped} invalid rows")
    
    logger.info(f"\nTotal: {len(all_questions)} questions parsed, {total_skipped} rows skipped")
    
    # Print sample if requested
    if args.print_sample > 0:
        print("\n" + "=" * 60)
        print("SAMPLE QUESTIONS")
        print("=" * 60)
        for q in all_questions[:args.print_sample]:
            print(format_question(q))
            print()
    
    # Get unique subcategories
    subcategories = set(q["subcategory_slug"] for q in all_questions)
    logger.info(f"Found {len(subcategories)} unique subcategories:")
    for sub in sorted(subcategories):
        count = sum(1 for q in all_questions if q["subcategory_slug"] == sub)
        logger.info(f"  {sub}: {count} questions")
    
    if args.dry_run:
        logger.info("\nDry run complete. No database changes made.")
        return
    
    # Import to database
    logger.info("\nConnecting to Supabase...")
    client = get_supabase_client()
    
    # Get or create NFL category
    category_id = get_or_create_category(client, "nfl", "NFL Football")
    
    # Import questions
    imported, duplicates = import_questions(client, all_questions, category_id)
    
    logger.info(f"\n✅ Import complete!")
    logger.info(f"   Imported: {imported} questions")
    logger.info(f"   Skipped (duplicates): {duplicates}")
    
    # Show category stats
    categories = client.table("question_categories").select("slug, name, question_count").execute()
    print("\nCategory Statistics:")
    for cat in (categories.data or []):
        print(f"  {cat['name']}: {cat['question_count']} questions")


if __name__ == "__main__":
    main()
