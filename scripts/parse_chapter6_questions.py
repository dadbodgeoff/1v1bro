#!/usr/bin/env python3
"""
Parse the Chapter 6 questions from markdown format and convert to JSON.
"""

import json
import re
from datetime import datetime, timezone


def parse_questions(filepath: str) -> list:
    """Parse questions from the markdown file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    
    # Split by question markers
    # Format:
    # **Q1:** Question text
    # A) Option A
    # B) Option B  
    # C) Option C
    # D) Option D
    # **Correct Answer: B**
    
    # Find all question blocks
    lines = content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Look for question start: **Q123:**
        match = re.match(r'\*\*Q(\d+):\*\*\s*(.+)', line)
        if match:
            q_num = int(match.group(1))
            question_text = match.group(2).strip()
            
            # Get the 4 options (next 4 lines starting with A), B), C), D))
            options = []
            j = i + 1
            
            while j < len(lines) and len(options) < 4:
                opt_line = lines[j].strip()
                opt_match = re.match(r'^([ABCD])\)\s*(.+)', opt_line)
                if opt_match:
                    options.append(opt_match.group(2).strip())
                j += 1
            
            # Find correct answer
            correct_index = None
            while j < len(lines) and j < i + 10:
                ans_line = lines[j].strip()
                ans_match = re.match(r'\*\*Correct Answer:\s*([ABCD])\*\*', ans_line)
                if ans_match:
                    correct_letter = ans_match.group(1)
                    correct_index = {'A': 0, 'B': 1, 'C': 2, 'D': 3}[correct_letter]
                    break
                j += 1
            
            # Only add if we have all parts
            if len(options) == 4 and correct_index is not None:
                # Determine difficulty based on question number
                if q_num <= 100:
                    difficulty = "easy"
                elif q_num <= 200:
                    difficulty = "medium"
                else:
                    difficulty = "hard"
                
                # Determine subcategory
                subcategory = determine_subcategory(question_text.lower())
                
                questions.append({
                    "text": question_text,
                    "options": options,
                    "correct_index": correct_index,
                    "difficulty": difficulty,
                    "subcategory": subcategory
                })
            
            i = j + 1
        else:
            i += 1
    
    return questions


def determine_subcategory(text: str) -> str:
    """Determine subcategory based on question text."""
    text = text.lower()
    
    if any(word in text for word in ['skin', 'cosmetic', 'battle pass', 'pickaxe', 'glider', 'emote', 'backbling', 'wrap', 'v-bucks']):
        return "cosmetics"
    elif any(word in text for word in ['weapon', 'shotgun', 'rifle', 'smg', 'sniper', 'pistol', 'mythic', 'damage', 'grenade', 'melee', 'blade']):
        return "weapons"
    elif any(word in text for word in ['poi', 'location', 'city', 'dojo', 'wharf', 'lake', 'map', 'terrace', 'frogs', 'mosses']):
        return "map"
    elif any(word in text for word in ['event', 'concert', 'finale', 'live', 'remix']):
        return "events"
    elif any(word in text for word in ['collaboration', 'collab', 'marvel', 'star wars', 'mortal kombat', 'fast', 'furious', 'yakuza', 'dragon ball']):
        return "collabs"
    elif any(word in text for word in ['season', 'chapter', 'release', 'begin', 'end', 'theme', 'date', 'conclude', 'duration']):
        return "seasons"
    elif any(word in text for word in ['story', 'narrative', 'antagonist', 'daigo', 'shogun', 'lore', 'dark presence']):
        return "history"
    elif any(word in text for word in ['boss', 'npc', 'character', 'faction']):
        return "history"
    else:
        return "history"


def main():
    filepath = "backend/app/database/migrations/fortnite questions"
    
    print(f"Parsing questions from {filepath}...")
    questions = parse_questions(filepath)
    
    print(f"Found {len(questions)} questions")
    
    # Count by difficulty
    easy = sum(1 for q in questions if q["difficulty"] == "easy")
    medium = sum(1 for q in questions if q["difficulty"] == "medium")
    hard = sum(1 for q in questions if q["difficulty"] == "hard")
    
    # Count by subcategory
    subcategories = {}
    for q in questions:
        sub = q.get("subcategory", "unknown")
        subcategories[sub] = subcategories.get(sub, 0) + 1
    
    output = {
        "category": "fortnite",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Chapter 6 Manual Questions",
        "total_questions": len(questions),
        "by_difficulty": {
            "easy": easy,
            "medium": medium,
            "hard": hard
        },
        "by_subcategory": subcategories,
        "questions": questions
    }
    
    # Save Chapter 6 questions separately
    output_path = "scripts/data/fortnite_chapter6_questions.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\nParsed {len(questions)} Chapter 6 questions")
    print(f"  Easy: {easy}")
    print(f"  Medium: {medium}")
    print(f"  Hard: {hard}")
    print(f"\nBy subcategory:")
    for sub, count in sorted(subcategories.items()):
        print(f"  {sub}: {count}")
    print(f"\nSaved to {output_path}")
    
    # Now merge with existing generated questions
    print("\n--- Merging with existing questions ---")
    
    existing_path = "scripts/data/fortnite_questions_generated.json"
    try:
        with open(existing_path, 'r') as f:
            existing = json.load(f)
        
        existing_questions = existing.get("questions", [])
        existing_texts = {q["text"] for q in existing_questions}
        
        # Add new questions that don't already exist
        new_count = 0
        for q in questions:
            if q["text"] not in existing_texts:
                existing_questions.append(q)
                existing_texts.add(q["text"])
                new_count += 1
        
        # Update counts
        easy = sum(1 for q in existing_questions if q.get("difficulty") == "easy")
        medium = sum(1 for q in existing_questions if q.get("difficulty") == "medium")
        hard = sum(1 for q in existing_questions if q.get("difficulty") == "hard")
        
        subcategories = {}
        for q in existing_questions:
            sub = q.get("subcategory", "unknown")
            subcategories[sub] = subcategories.get(sub, 0) + 1
        
        merged = {
            "category": "fortnite",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_questions": len(existing_questions),
            "by_difficulty": {"easy": easy, "medium": medium, "hard": hard},
            "by_subcategory": subcategories,
            "questions": existing_questions
        }
        
        merged_path = "scripts/data/fortnite_questions_all.json"
        with open(merged_path, "w") as f:
            json.dump(merged, f, indent=2)
        
        print(f"Added {new_count} new Chapter 6 questions")
        print(f"Total combined: {len(existing_questions)} questions")
        print(f"\nFinal breakdown:")
        print(f"  Easy: {easy}")
        print(f"  Medium: {medium}")
        print(f"  Hard: {hard}")
        print(f"\nSaved merged file to {merged_path}")
        
    except FileNotFoundError:
        print(f"Could not find {existing_path}, saving Chapter 6 questions only")


if __name__ == "__main__":
    main()
