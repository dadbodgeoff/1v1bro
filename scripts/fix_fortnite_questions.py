#!/usr/bin/env python3
"""
Fix Fortnite quiz questions - remove yes/no questions and validate.
"""

import json
from pathlib import Path
from typing import Dict, List, Tuple

INPUT_FILE = Path("scripts/data/fortnite_questions_all.json")
OUTPUT_FILE = Path("scripts/data/fortnite_questions_validated.json")
REMOVED_FILE = Path("scripts/data/fortnite_questions_removed.json")


def is_yesno_question(q: Dict) -> bool:
    """Check if question has yes/no options."""
    options = q.get('options', q.get('answers', []))
    if isinstance(options, list):
        options_lower = [str(o).lower().strip() for o in options]
        return 'yes' in options_lower or 'no' in options_lower
    return False


def has_bad_answer(q: Dict) -> Tuple[bool, str]:
    """Check for problematic answers."""
    options = q.get('options', q.get('answers', []))
    correct = q.get('correct_answer', q.get('correctAnswer', ''))
    
    if isinstance(correct, int):
        if correct < len(options):
            correct = str(options[correct])
        else:
            return True, "Invalid correct answer index"
    
    correct_lower = str(correct).lower().strip()
    
    # Bad patterns
    bad_answers = ['all', 'none', 'both', 'neither', 'n/a', 'unknown', 'all of the above', 'none of the above']
    for bad in bad_answers:
        if correct_lower == bad:
            return True, f"Bad answer: {correct}"
    
    # Check for duplicates
    if isinstance(options, list):
        options_lower = [str(o).lower().strip() for o in options]
        if len(set(options_lower)) < len(options_lower):
            return True, "Duplicate options"
    
    # Check all 4 options exist
    if len(options) < 4:
        return True, f"Only {len(options)} options"
    
    return False, ""


def validate_question(q: Dict) -> Tuple[bool, str]:
    """Full validation."""
    if is_yesno_question(q):
        return False, "Contains Yes/No options"
    
    is_bad, reason = has_bad_answer(q)
    if is_bad:
        return False, reason
    
    # Check question text exists
    question_text = q.get('question', q.get('text', ''))
    if not question_text or len(question_text) < 10:
        return False, "Missing or too short question"
    
    # Check question ends with ?
    if not question_text.strip().endswith('?'):
        return False, "Question doesn't end with ?"
    
    return True, "Valid"


def main():
    """Main processing."""
    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found")
        return
    
    with open(INPUT_FILE, 'r') as f:
        data = json.load(f)
    
    # Handle different structures
    if isinstance(data, list):
        questions = data
    elif isinstance(data, dict) and 'questions' in data:
        questions = data['questions']
    else:
        print(f"Unknown structure")
        return
    
    print(f"Processing {len(questions)} questions...")
    
    valid_questions = []
    removed_questions = []
    
    for i, q in enumerate(questions):
        is_valid, reason = validate_question(q)
        
        if is_valid:
            # Renumber
            q_copy = q.copy()
            q_copy['id'] = len(valid_questions) + 1
            valid_questions.append(q_copy)
        else:
            removed_questions.append({
                'original_index': i,
                'reason': reason,
                **q
            })
    
    # Write valid questions
    print(f"\nWriting {len(valid_questions)} valid questions to {OUTPUT_FILE}")
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(valid_questions, f, indent=2)
    
    # Write removed questions
    print(f"Writing {len(removed_questions)} removed questions to {REMOVED_FILE}")
    with open(REMOVED_FILE, 'w') as f:
        json.dump(removed_questions, f, indent=2)
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Original questions: {len(questions)}")
    print(f"Valid questions: {len(valid_questions)}")
    print(f"Removed questions: {len(removed_questions)}")
    
    # Breakdown by reason
    reasons = {}
    for q in removed_questions:
        r = q['reason']
        reasons[r] = reasons.get(r, 0) + 1
    
    print(f"\nRemoval reasons:")
    for reason, count in sorted(reasons.items(), key=lambda x: -x[1]):
        print(f"  {reason}: {count}")


if __name__ == '__main__':
    main()
