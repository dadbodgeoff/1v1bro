#!/usr/bin/env python3
"""
Deep review of trivia questions - checks both question text AND answer options
for opinionated/unsuitable content.
"""

import json
import csv
import re
from pathlib import Path

# Patterns for question text
QUESTION_PATTERNS = [
    (r'\b(best|greatest|favorite|favourite|most iconic|most popular|coolest|lamest|most fun|most exciting)\b', 'SUBJECTIVE'),
    (r'\b(should|would you|do you think|in your opinion)\b', 'OPINION'),
    (r'\b(better than|worse than|superior to|inferior to)\b', 'COMPARATIVE_OPINION'),
    (r'\bbetter\b.*\?$', 'COMPARATIVE_OPINION'),
    (r'\b(controversial|debatable|disputed|divisive)\b', 'CONTROVERSIAL'),
    (r'\b(will be|going to be|expected to be|expected to)\b', 'PREDICTION'),
    (r'\b(prefer|like more|enjoy more|fan-favorite|fan favorite)\b', 'PREFERENCE'),
    (r'\b(is considered|was considered|are considered)\b', 'OPINION'),
    (r'\bdo you (think|believe|feel)\b', 'OPINION'),
    (r'\bwhat do you\b', 'OPINION'),
    (r'\bmost (loved|hated|liked|disliked)\b', 'SUBJECTIVE'),
    (r'\b(overrated|underrated)\b', 'SUBJECTIVE'),
]

# Problematic answer options that indicate subjective questions
BAD_ANSWER_OPTIONS = [
    'opinion-dependent',
    'depends on preference',
    'uncertain',
    'debatable',
    'subjective',
    'varies by person',
    'personal choice',
    'divisive opinions',
    'mixed opinions',
    'too early to tell',
    'unknown',  # sometimes okay, but flag for review
    'maybe',
    'possibly',
    'arguably',
]

# Specific question patterns
SPECIFIC_FLAGS = [
    'most iconic', 'became the most', 'best season', 'worst season',
    'best player', 'worst player', 'best team', 'worst team',
    'best defense', 'best offense', 'worst defense', 'worst offense',
    'best record', 'worst record', 'worst division', 'best division',
    'most memorable', 'most impressive', 'most disappointing',
    'biggest disappointment', 'biggest surprise', 'fan favorite',
    'fan-favorite', 'opinion-dependent', 'depends on preference',
]

def check_question(text: str, options: list) -> list[tuple[str, str]]:
    """Check question text and options for problems."""
    issues = []
    text_lower = text.lower()
    
    # Check question text
    for pattern, issue_type in QUESTION_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            issues.append((issue_type, f"Question: {pattern}"))
    
    for flag in SPECIFIC_FLAGS:
        if flag in text_lower:
            issues.append(('SPECIFIC_FLAG', f"Question: {flag}"))
    
    # Check answer options
    for opt in options:
        opt_lower = opt.lower().strip()
        for bad_opt in BAD_ANSWER_OPTIONS:
            if bad_opt in opt_lower:
                issues.append(('BAD_OPTION', f"Option contains: {bad_opt}"))
    
    return issues

def review_fortnite():
    """Review all Fortnite question files."""
    print("\n" + "="*80)
    print("FORTNITE DEEP REVIEW")
    print("="*80)
    
    files = [
        'scripts/data/fortnite_questions_merged.json',
        'scripts/data/fortnite_ch1_5_questions.json',
        'scripts/data/fortnite_chapter6_questions.json',
    ]
    
    flagged = []
    total = 0
    
    for filepath in files:
        path = Path(filepath)
        if not path.exists():
            continue
        
        with open(path, 'r') as f:
            data = json.load(f)
        
        questions = data.get('questions', [])
        total += len(questions)
        
        for i, q in enumerate(questions):
            text = q.get('text', '')
            options = q.get('options', [])
            issues = check_question(text, options)
            
            if issues:
                flagged.append({
                    'file': filepath,
                    'index': i,
                    'text': text,
                    'options': options,
                    'issues': issues,
                    'correct_index': q.get('correct_index'),
                    'subcategory': q.get('subcategory', ''),
                })
    
    print(f"Total questions: {total}")
    print(f"Flagged: {len(flagged)}")
    return flagged

def review_nfl():
    """Review all NFL question files."""
    print("\n" + "="*80)
    print("NFL DEEP REVIEW")
    print("="*80)
    
    files = [
        '.kiro/specs/vortex-arena-map/nfl_trivia_500_questions.csv',
        '.kiro/specs/vortex-arena-map/nfl_trivia_500_questions_part2.csv',
    ]
    
    flagged = []
    total = 0
    
    for filepath in files:
        path = Path(filepath)
        if not path.exists():
            continue
        
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            questions = list(reader)
        
        total += len(questions)
        
        for i, q in enumerate(questions):
            text = q.get('Question', '')
            options = [q.get('Option A', ''), q.get('Option B', ''),
                      q.get('Option C', ''), q.get('Option D', '')]
            issues = check_question(text, options)
            
            if issues:
                flagged.append({
                    'file': filepath,
                    'index': i,
                    'id': q.get('ID', ''),
                    'category': q.get('Category', ''),
                    'text': text,
                    'options': options,
                    'issues': issues,
                    'correct': q.get('Correct Answer', ''),
                })
    
    print(f"Total questions: {total}")
    print(f"Flagged: {len(flagged)}")
    return flagged

def print_flagged(flagged: list, title: str):
    """Print flagged questions."""
    print(f"\n{'='*80}")
    print(f"{title} - FLAGGED ({len(flagged)})")
    print("="*80)
    
    for i, q in enumerate(flagged, 1):
        print(f"\n[{i}] {q['text']}")
        print(f"    Options: {q['options']}")
        print(f"    Issues: {[f'{t}: {d}' for t, d in q['issues']]}")
        if 'id' in q:
            print(f"    ID: {q['id']}, File: {Path(q['file']).name}")
        else:
            print(f"    Index: {q['index']}, File: {Path(q['file']).name}")

def main():
    print("="*80)
    print("DEEP TRIVIA REVIEW - Questions AND Answer Options")
    print("="*80)
    
    fortnite_flagged = review_fortnite()
    nfl_flagged = review_nfl()
    
    print_flagged(fortnite_flagged, "FORTNITE")
    print_flagged(nfl_flagged, "NFL")
    
    # Export
    output = {
        'fortnite': fortnite_flagged,
        'nfl': nfl_flagged,
        'summary': {
            'fortnite_count': len(fortnite_flagged),
            'nfl_count': len(nfl_flagged),
        }
    }
    
    with open('scripts/data/questions_to_remove.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n\nTotal to remove: {len(fortnite_flagged) + len(nfl_flagged)}")

if __name__ == '__main__':
    main()
