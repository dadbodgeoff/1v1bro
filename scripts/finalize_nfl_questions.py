#!/usr/bin/env python3
"""
Final script to create clean NFL trivia question files.
Combines validated questions and filters out problematic ones.
"""

import csv
from pathlib import Path
from typing import Dict, List, Tuple

# Paths
VALIDATED_FILE = Path(".kiro/specs/vortex-arena-map/nfl_trivia_validated.csv")
REWRITTEN_FILE = Path(".kiro/specs/vortex-arena-map/rewritten_questions.csv")
ORIGINAL_FILES = [
    Path(".kiro/specs/vortex-arena-map/nfl_trivia_500_questions.csv"),
    Path(".kiro/specs/vortex-arena-map/nfl_trivia_500_questions_part2.csv")
]
OUTPUT_FILE = Path(".kiro/specs/vortex-arena-map/nfl_trivia_final.csv")
REMOVED_FILE = Path(".kiro/specs/vortex-arena-map/nfl_trivia_removed.csv")


def is_yesno_question(row: Dict) -> bool:
    """Check if a question has Yes/No as options."""
    options = [row.get('Option A', ''), row.get('Option B', ''), 
               row.get('Option C', ''), row.get('Option D', '')]
    options_lower = [o.lower().strip() for o in options]
    return 'yes' in options_lower or 'no' in options_lower


def has_bad_answer(row: Dict) -> bool:
    """Check for problematic answers."""
    correct = row.get('Correct Answer', '').lower().strip()
    options = [row.get('Option A', ''), row.get('Option B', ''), 
               row.get('Option C', ''), row.get('Option D', '')]
    
    # Bad patterns
    bad_answers = ['all', 'none', 'both', 'neither', 'n/a', 'unknown', 'pending', 'too early']
    if correct in bad_answers:
        return True
    
    # Check if answer is too short (likely incomplete)
    if len(correct) < 2:
        return True
    
    # Check if any option contains "and" suggesting multiple subjects
    for opt in options:
        if ' and ' in opt.lower() and opt == row.get('Correct Answer', ''):
            return True
    
    return False


def has_duplicate_options(row: Dict) -> bool:
    """Check for duplicate options."""
    options = [row.get('Option A', '').lower().strip(), 
               row.get('Option B', '').lower().strip(), 
               row.get('Option C', '').lower().strip(), 
               row.get('Option D', '').lower().strip()]
    return len(set(options)) < 4


def validate_question(row: Dict) -> Tuple[bool, str]:
    """Full validation of a question."""
    # Check for yes/no
    if is_yesno_question(row):
        return False, "Contains Yes/No options"
    
    # Check for bad answers
    if has_bad_answer(row):
        return False, "Problematic answer"
    
    # Check for duplicates
    if has_duplicate_options(row):
        return False, "Duplicate options"
    
    # Check correct answer is in options
    correct = row.get('Correct Answer', '')
    options = [row.get('Option A', ''), row.get('Option B', ''), 
               row.get('Option C', ''), row.get('Option D', '')]
    if correct not in options:
        return False, "Correct answer not in options"
    
    # Check question ends with ?
    if not row.get('Question', '').strip().endswith('?'):
        return False, "Question doesn't end with ?"
    
    # Check all options are present
    if any(not o.strip() for o in options):
        return False, "Missing options"
    
    return True, "Valid"


def process():
    """Main processing."""
    valid_questions = []
    removed_questions = []
    seen_questions = set()  # Track duplicates
    
    # Process original files - only keep non-yes/no questions
    for orig_file in ORIGINAL_FILES:
        if not orig_file.exists():
            print(f"Warning: {orig_file} not found")
            continue
        
        print(f"\nProcessing {orig_file}...")
        with open(orig_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                question_key = row['Question'].lower().strip()
                
                # Skip duplicates
                if question_key in seen_questions:
                    continue
                seen_questions.add(question_key)
                
                is_valid, reason = validate_question(row)
                if is_valid:
                    valid_questions.append(row)
                else:
                    removed_questions.append({
                        'reason': reason,
                        'source': str(orig_file),
                        **row
                    })
    
    # Process rewritten questions
    if REWRITTEN_FILE.exists():
        print(f"\nProcessing rewritten questions from {REWRITTEN_FILE}...")
        with open(REWRITTEN_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                question_key = row['Question'].lower().strip()
                
                # Skip duplicates
                if question_key in seen_questions:
                    continue
                seen_questions.add(question_key)
                
                is_valid, reason = validate_question(row)
                if is_valid:
                    valid_questions.append(row)
                else:
                    removed_questions.append({
                        'reason': reason,
                        'source': 'rewritten',
                        **row
                    })
    
    # Renumber IDs
    for i, q in enumerate(valid_questions, 1):
        q['ID'] = str(i)
    
    # Write final valid questions
    print(f"\n\nWriting {len(valid_questions)} valid questions to {OUTPUT_FILE}")
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['ID', 'Category', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(valid_questions)
    
    # Write removed questions for reference
    print(f"Writing {len(removed_questions)} removed questions to {REMOVED_FILE}")
    with open(REMOVED_FILE, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['reason', 'source', 'ID', 'Category', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(removed_questions)
    
    print(f"\n{'='*50}")
    print(f"FINAL SUMMARY")
    print(f"{'='*50}")
    print(f"Valid questions ready to use: {len(valid_questions)}")
    print(f"Questions removed: {len(removed_questions)}")
    
    # Breakdown of removed reasons
    reasons = {}
    for q in removed_questions:
        r = q['reason']
        reasons[r] = reasons.get(r, 0) + 1
    
    print(f"\nRemoval reasons:")
    for reason, count in sorted(reasons.items(), key=lambda x: -x[1]):
        print(f"  {reason}: {count}")
    
    # Category breakdown
    categories = {}
    for q in valid_questions:
        cat = q.get('Category', 'Unknown')
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\nQuestions by category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:10]:
        print(f"  {cat}: {count}")


if __name__ == '__main__':
    process()
