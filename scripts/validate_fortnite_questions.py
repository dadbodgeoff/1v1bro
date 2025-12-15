#!/usr/bin/env python3
"""
Validate Fortnite quiz questions for yes/no and other issues.
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple

INPUT_FILE = Path("frontend/src/data/fortnite-quiz-data.ts")


def extract_questions_from_ts(content: str) -> List[Dict]:
    """Extract questions from TypeScript file."""
    questions = []
    
    # Find all question blocks
    pattern = r"\{\s*id:\s*'([^']+)',\s*question:\s*'([^']+)',\s*options:\s*\[([^\]]+)\],\s*correctAnswer:\s*(\d+)"
    
    matches = re.findall(pattern, content, re.DOTALL)
    
    for match in matches:
        qid, question, options_str, correct_idx = match
        # Parse options
        options = re.findall(r"'([^']*)'", options_str)
        
        questions.append({
            'id': qid,
            'question': question,
            'options': options,
            'correctAnswer': int(correct_idx)
        })
    
    return questions


def is_yesno_question(q: Dict) -> bool:
    """Check if question has yes/no options."""
    options_lower = [o.lower().strip() for o in q['options']]
    return 'yes' in options_lower or 'no' in options_lower


def has_bad_answer(q: Dict) -> Tuple[bool, str]:
    """Check for problematic answers."""
    options = q['options']
    correct_idx = q['correctAnswer']
    
    if correct_idx >= len(options):
        return True, "Invalid correct answer index"
    
    correct = options[correct_idx].lower().strip()
    
    # Bad patterns
    bad_answers = ['all', 'none', 'both', 'neither', 'n/a', 'unknown']
    if correct in bad_answers:
        return True, f"Bad answer: {correct}"
    
    # Check for duplicates
    if len(set(o.lower() for o in options)) < len(options):
        return True, "Duplicate options"
    
    return False, ""


def validate():
    """Main validation."""
    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found")
        return
    
    content = INPUT_FILE.read_text()
    questions = extract_questions_from_ts(content)
    
    print(f"Found {len(questions)} questions in Fortnite quiz data\n")
    
    issues = []
    
    for q in questions:
        # Check yes/no
        if is_yesno_question(q):
            issues.append({
                'id': q['id'],
                'question': q['question'],
                'issue': 'Contains Yes/No options',
                'options': q['options']
            })
            continue
        
        # Check bad answers
        is_bad, reason = has_bad_answer(q)
        if is_bad:
            issues.append({
                'id': q['id'],
                'question': q['question'],
                'issue': reason,
                'options': q['options']
            })
    
    if issues:
        print(f"Found {len(issues)} issues:\n")
        for i, issue in enumerate(issues, 1):
            print(f"{i}. [{issue['id']}] {issue['issue']}")
            print(f"   Q: {issue['question']}")
            print(f"   Options: {issue['options']}")
            print()
    else:
        print("✓ All Fortnite questions are valid!")
    
    # Stats
    print(f"\n{'='*50}")
    print(f"SUMMARY")
    print(f"{'='*50}")
    print(f"Total questions: {len(questions)}")
    print(f"Questions with issues: {len(issues)}")
    print(f"Valid questions: {len(questions) - len(issues)}")


if __name__ == '__main__':
    validate()
