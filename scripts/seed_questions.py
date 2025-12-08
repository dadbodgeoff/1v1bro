#!/usr/bin/env python3
"""
Seed script for bulk importing trivia questions.

Usage:
    python scripts/seed_questions.py                    # Import existing Fortnite questions
    python scripts/seed_questions.py --file data.json  # Import from JSON file
    python scripts/seed_questions.py --category nfl    # Specify category

Supported formats:
    1. JSON array of questions
    2. CSV with columns: text, option_a, option_b, option_c, option_d, correct_index, difficulty
    3. Simple text format (parsed automatically)
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import List, Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()


def get_supabase_client() -> Client:
    """Get Supabase client with service role key."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    
    return create_client(url, key)


def get_or_create_category(client: Client, slug: str, name: Optional[str] = None) -> str:
    """Get category ID, creating if it doesn't exist."""
    result = client.table("question_categories").select("id").eq("slug", slug).execute()
    
    if result.data:
        return result.data[0]["id"]
    
    # Create category
    new_cat = client.table("question_categories").insert({
        "slug": slug,
        "name": name or slug.replace("_", " ").title(),
        "is_active": True,
    }).execute()
    
    return new_cat.data[0]["id"]


def get_or_create_subcategory(
    client: Client, category_id: str, slug: str, name: Optional[str] = None
) -> str:
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
        "name": name or slug.replace("_", " ").title(),
        "is_active": True,
    }).execute()
    
    return new_sub.data[0]["id"]


def parse_json_questions(data: List[dict], category_id: str) -> List[dict]:
    """Parse questions from JSON format."""
    questions = []
    
    for q in data:
        # Handle different JSON formats
        options = q.get("options")
        if not options:
            # Try option_a, option_b, etc. format
            options = [
                q.get("option_a") or q.get("optionA") or q.get("a"),
                q.get("option_b") or q.get("optionB") or q.get("b"),
                q.get("option_c") or q.get("optionC") or q.get("c"),
                q.get("option_d") or q.get("optionD") or q.get("d"),
            ]
        
        # Handle correct answer in different formats
        correct_index = q.get("correct_index")
        if correct_index is None:
            correct = q.get("correct_answer") or q.get("correct") or q.get("answer")
            if isinstance(correct, str):
                if correct.upper() in "ABCD":
                    correct_index = ord(correct.upper()) - ord('A')
                elif correct in options:
                    correct_index = options.index(correct)
                else:
                    correct_index = 0
            elif isinstance(correct, int):
                correct_index = correct
        
        questions.append({
            "category_id": category_id,
            "text": q.get("text") or q.get("question"),
            "options": options,
            "correct_index": correct_index,
            "difficulty": q.get("difficulty", "medium"),
            "explanation": q.get("explanation"),
            "source_url": q.get("source_url") or q.get("source"),
            "is_active": True,
            "is_verified": True,
        })
    
    return questions


def seed_existing_fortnite_questions(client: Client) -> int:
    """Seed the existing hardcoded Fortnite questions."""
    
    # Get or create Fortnite category
    category_id = get_or_create_category(client, "fortnite", "Fortnite")
    
    questions = [
        {
            "text": "What year was Fortnite Battle Royale released?",
            "options": ["2016", "2017", "2018", "2019"],
            "correct_index": 1,
            "difficulty": "easy",
        },
        {
            "text": "What is the name of the main island in Fortnite?",
            "options": ["Apollo", "Athena", "Artemis", "Atlas"],
            "correct_index": 0,
            "difficulty": "medium",
        },
        {
            "text": "Which company developed Fortnite?",
            "options": ["Activision", "EA Games", "Epic Games", "Ubisoft"],
            "correct_index": 2,
            "difficulty": "easy",
        },
        {
            "text": "What is the maximum number of players in a standard Battle Royale match?",
            "options": ["50", "75", "100", "150"],
            "correct_index": 2,
            "difficulty": "easy",
        },
        {
            "text": "What material provides the most health when built?",
            "options": ["Wood", "Stone", "Metal", "All equal"],
            "correct_index": 2,
            "difficulty": "medium",
        },
        {
            "text": "What is the rarest weapon rarity color in Fortnite?",
            "options": ["Purple", "Gold", "Mythic", "Exotic"],
            "correct_index": 2,
            "difficulty": "medium",
        },
        {
            "text": "What is the name of the storm that closes in during a match?",
            "options": ["The Circle", "The Storm", "The Zone", "The Ring"],
            "correct_index": 1,
            "difficulty": "easy",
        },
        {
            "text": "Which vehicle was first added to Fortnite?",
            "options": ["Car", "Shopping Cart", "Golf Cart", "Plane"],
            "correct_index": 1,
            "difficulty": "hard",
        },
        {
            "text": "What is the name of the in-game currency?",
            "options": ["V-Coins", "V-Bucks", "F-Bucks", "Battle Coins"],
            "correct_index": 1,
            "difficulty": "easy",
        },
        {
            "text": "What is the default pickaxe called?",
            "options": ["Basic Axe", "Default Pickaxe", "Harvesting Tool", "Standard Issue"],
            "correct_index": 1,
            "difficulty": "medium",
        },
        {
            "text": "Which season introduced the first Battle Pass?",
            "options": ["Season 1", "Season 2", "Season 3", "Season 4"],
            "correct_index": 1,
            "difficulty": "medium",
        },
        {
            "text": "What is the name of the cube that appeared in Season 5?",
            "options": ["Kevin", "Steve", "Bob", "Carl"],
            "correct_index": 0,
            "difficulty": "medium",
        },
        {
            "text": "How many tiers are in a standard Battle Pass?",
            "options": ["50", "75", "100", "150"],
            "correct_index": 2,
            "difficulty": "easy",
        },
        {
            "text": "What is the name of the main antagonist organization?",
            "options": ["The Seven", "The Order", "IO (Imagined Order)", "The Last Reality"],
            "correct_index": 2,
            "difficulty": "hard",
        },
        {
            "text": "Which Marvel character had their own POI in Chapter 2?",
            "options": ["Iron Man", "Thor", "Spider-Man", "Wolverine"],
            "correct_index": 0,
            "difficulty": "medium",
        },
        {
            "text": "What is the maximum shield you can have?",
            "options": ["50", "100", "150", "200"],
            "correct_index": 1,
            "difficulty": "easy",
        },
        {
            "text": "Which emote became the most iconic Fortnite dance?",
            "options": ["Floss", "Orange Justice", "Take the L", "Default Dance"],
            "correct_index": 3,
            "difficulty": "easy",
        },
        {
            "text": "What is the name of the battle bus driver?",
            "options": ["Lars", "Dennis", "Ray", "Unknown"],
            "correct_index": 3,
            "difficulty": "hard",
        },
        {
            "text": "How much health does a player start with?",
            "options": ["50", "75", "100", "150"],
            "correct_index": 2,
            "difficulty": "easy",
        },
        {
            "text": "What color is a common rarity item?",
            "options": ["White", "Green", "Gray", "Blue"],
            "correct_index": 2,
            "difficulty": "easy",
        },
    ]
    
    # Add category_id and metadata to each question
    for q in questions:
        q["category_id"] = category_id
        q["is_active"] = True
        q["is_verified"] = True
        q["created_at"] = datetime.utcnow().isoformat()
        q["updated_at"] = datetime.utcnow().isoformat()
    
    # Check for existing questions to avoid duplicates
    existing = client.table("questions").select("text").eq("category_id", category_id).execute()
    existing_texts = {q["text"] for q in (existing.data or [])}
    
    # Filter out duplicates
    new_questions = [q for q in questions if q["text"] not in existing_texts]
    
    if not new_questions:
        print("All questions already exist in database")
        return 0
    
    # Insert questions
    result = client.table("questions").insert(new_questions).execute()
    
    return len(result.data) if result.data else 0


def seed_from_file(client: Client, filepath: str, category_slug: str) -> int:
    """Seed questions from a JSON file."""
    
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    # Handle both array and object with 'questions' key
    if isinstance(data, dict):
        data = data.get("questions", [])
    
    if not data:
        print("No questions found in file")
        return 0
    
    # Get or create category
    category_id = get_or_create_category(client, category_slug)
    
    # Parse questions
    questions = parse_json_questions(data, category_id)
    
    # Check for existing questions
    existing = client.table("questions").select("text").eq("category_id", category_id).execute()
    existing_texts = {q["text"] for q in (existing.data or [])}
    
    # Filter out duplicates
    new_questions = [q for q in questions if q["text"] not in existing_texts]
    
    if not new_questions:
        print("All questions already exist in database")
        return 0
    
    # Add timestamps
    now = datetime.utcnow().isoformat()
    for q in new_questions:
        q["created_at"] = now
        q["updated_at"] = now
    
    # Insert in batches of 100
    total_inserted = 0
    batch_size = 100
    
    for i in range(0, len(new_questions), batch_size):
        batch = new_questions[i:i + batch_size]
        result = client.table("questions").insert(batch).execute()
        total_inserted += len(result.data) if result.data else 0
        print(f"Inserted batch {i // batch_size + 1}: {len(batch)} questions")
    
    return total_inserted


def seed_generated_fortnite_questions(client: Client) -> int:
    """Seed the generated Fortnite questions from JSON file."""
    import os
    
    # Try merged file first, fall back to generated-only
    json_path = os.path.join(os.path.dirname(__file__), "data", "fortnite_questions_all.json")
    
    if not os.path.exists(json_path):
        json_path = os.path.join(os.path.dirname(__file__), "data", "fortnite_questions_generated.json")
    
    if not os.path.exists(json_path):
        print(f"Questions file not found. Run one of:")
        print("  python scripts/generate_fortnite_questions.py")
        print("  python scripts/parse_chapter6_questions.py")
        return 0
    
    print(f"Loading questions from: {json_path}")
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    questions_data = data.get("questions", [])
    if not questions_data:
        print("No questions found in generated file")
        return 0
    
    # Get or create Fortnite category
    category_id = get_or_create_category(client, "fortnite", "Fortnite")
    
    # Get subcategory IDs
    subcategory_ids = {}
    subcategories = ["history", "seasons", "weapons", "map", "cosmetics", "events", "collabs"]
    for sub in subcategories:
        subcategory_ids[sub] = get_or_create_subcategory(client, category_id, sub)
    
    # Check for existing questions
    existing = client.table("questions").select("text").eq("category_id", category_id).execute()
    existing_texts = {q["text"] for q in (existing.data or [])}
    
    # Prepare questions for insertion
    now = datetime.utcnow().isoformat()
    new_questions = []
    
    for q in questions_data:
        if q["text"] in existing_texts:
            continue
        
        subcategory = q.get("subcategory", "history")
        new_questions.append({
            "category_id": category_id,
            "subcategory_id": subcategory_ids.get(subcategory),
            "text": q["text"],
            "options": q["options"],
            "correct_index": q["correct_index"],
            "difficulty": q.get("difficulty", "medium"),
            "explanation": q.get("explanation"),
            "is_active": True,
            "is_verified": True,
            "created_at": now,
            "updated_at": now,
        })
    
    if not new_questions:
        print("All questions already exist in database")
        return 0
    
    # Insert in batches of 100
    total_inserted = 0
    batch_size = 100
    
    for i in range(0, len(new_questions), batch_size):
        batch = new_questions[i:i + batch_size]
        result = client.table("questions").insert(batch).execute()
        total_inserted += len(result.data) if result.data else 0
        print(f"Inserted batch {i // batch_size + 1}: {len(batch)} questions")
    
    return total_inserted


def main():
    parser = argparse.ArgumentParser(description="Seed trivia questions to database")
    parser.add_argument("--file", "-f", help="JSON file to import")
    parser.add_argument("--category", "-c", default="fortnite", help="Category slug")
    parser.add_argument("--generated", "-g", action="store_true", help="Import generated Fortnite questions")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually insert")
    
    args = parser.parse_args()
    
    print("Connecting to Supabase...")
    client = get_supabase_client()
    
    if args.generated:
        print("Importing generated Fortnite questions...")
        count = seed_generated_fortnite_questions(client)
    elif args.file:
        print(f"Importing from {args.file} to category '{args.category}'...")
        count = seed_from_file(client, args.file, args.category)
    else:
        print("Seeding existing Fortnite questions...")
        count = seed_existing_fortnite_questions(client)
    
    print(f"\n✅ Successfully inserted {count} questions")
    
    # Show category stats
    categories = client.table("question_categories").select("slug, name, question_count").execute()
    print("\nCategory Statistics:")
    for cat in (categories.data or []):
        print(f"  {cat['name']}: {cat['question_count']} questions")


if __name__ == "__main__":
    main()
