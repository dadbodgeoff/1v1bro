#!/usr/bin/env python3
"""
Validate Fortnite quiz questions from JSON files for yes/no and other issues.
"""

import json
from pathlib import Path
from typing import Dict, List, Tuple

INPUT_FILES = [
    Path("scripts/data/fortnite_questions_all.json"),
    Path("scripts/data/fortnite_questions_merged.json"),
]


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
        if correct_lower == bad or bad in correct_lower:
            return True, f"Bad answer pattern: {correct}"
    
    # Check for duplicates
    if isinstance(options, list):
        options_lower = [str(o).lower().strip() for o in options]
        if len(set(options_lower)) < len(options_lower):
            return True, "Duplicate options"
    
    return False, ""


def validate_file(filepath: Path) -> Tuple[int, List[Dict]]:
    """Validate a single JSON file."""
    if not filepath.exists():
        print(f"  File not found: {filepath}")
        return 0, []
    
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    # Handle different structures
    if isinstance(data, list):
        questions = data
    elif isinstance(data, dict) and 'questions' in data:
        questions = data['questions']
    else:
        print(f"  Unknown structure in {filepath}")
        return 0, []
    
    issues = []
    
    for i, q in enumerate(questions):
        question_text = q.get('question', q.get('text', 'Unknown'))
        
        # Check yes/no
        if is_yesno_question(q):
            issues.append({
                'index': i,
                'id': q.get('id', i),
                'question': question_text,
                'issue': 'Contains Yes/No options',
                'options': q.get('options', q.get('answers', []))
            })
            continue
        
        # Check bad answers
        is_bad, reason = has_bad_answer(q)
        if is_bad:
            issues.append({
                'index': i,
                'id': q.get('id', i),
                'question': question_text,
                'issue': reason,
                'options': q.get('options', q.get('answers', []))
            })
    
    return len(questions), issues


def main():
    """Main validation."""
    total_questions = 0
    all_issues = []
    
    for filepath in INPUT_FILES:
        print(f"\nValidating {filepath}...")
        count, issues = validate_file(filepath)
        total_questions += count
        all_issues.extend([{**i, 'file': str(filepath)} for i in issues])
        print(f"  Found {count} questions, {len(issues)} issues")
    
    print(f"\n{'='*60}")
    print("FORTNITE VALIDATION SUMMARY")
    print(f"{'='*60}")
    print(f"Total questions scanned: {total_questions}")
    print(f"Questions with issues: {len(all_issues)}")
    
    if all_issues:
        # Group by issue type
        by_type = {}
        for issue in all_issues:
            t = issue['issue']
            if t not in by_type:
                by_type[t] = []
            by_type[t].append(issue)
        
        print(f"\nIssues by type:")
        for issue_type, items in sorted(by_type.items(), key=lambda x: -len(x[1])):
            print(f"  {issue_type}: {len(items)}")
        
        print(f"\n{'='*60}")
        print("SAMPLE ISSUES (first 10):")
        print(f"{'='*60}")
        for i, issue in enumerate(all_issues[:10], 1):
            print(f"\n{i}. [{issue['id']}] {issue['issue']}")
            print(f"   Q: {issue['question'][:80]}...")
            print(f"   Options: {issue['options'][:4]}")
    else:
        print("\n✓ All Fortnite questions are valid!")


if __name__ == '__main__':
    main()
