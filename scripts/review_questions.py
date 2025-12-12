#!/usr/bin/env python3
"""
Script to review NFL and Fortnite trivia questions for opinionated or unsuitable content.
Flags questions that are:
- Subjective/opinionated (best, favorite, most iconic, etc.)
- Too vague or ambiguous
- Not factual trivia
- Potentially controversial
"""

import json
import csv
import re
from pathlib import Path

# Patterns that indicate potentially problematic questions
PROBLEMATIC_PATTERNS = [
    # Subjective/Opinion words
    (r'\b(best|worst|greatest|favorite|favourite|most iconic|most popular|coolest|lamest)\b', 'SUBJECTIVE'),
    (r'\b(should|would you|do you think|in your opinion)\b', 'OPINION'),
    (r'\b(better|worse|superior|inferior)\b', 'COMPARATIVE_OPINION'),
    
    # Vague/Ambiguous
    (r'\b(some|many|few|several|various|multiple)\b.*\?$', 'VAGUE'),
    (r'\b(approximately|around|about|roughly)\b', 'IMPRECISE'),
    
    # Controversial/Debatable
    (r'\b(controversial|debatable|disputed|argued)\b', 'CONTROVERSIAL'),
    
    # Future predictions
    (r'\b(will be|going to be|expected to)\b', 'PREDICTION'),
    
    # Personal preference
    (r'\b(prefer|like more|enjoy)\b', 'PREFERENCE'),
]

# Specific question patterns to flag
SPECIFIC_FLAGS = [
    'most iconic',
    'became the most',
    'considered the',
    'is considered',
    'was considered',
]

def check_question(text: str) -> list[tuple[str, str]]:
    """Check a question for problematic patterns."""
    issues = []
    text_lower = text.lower()
    
    for pattern, issue_type in PROBLEMATIC_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            issues.append((issue_type, pattern))
    
    for flag in SPECIFIC_FLAGS:
        if flag in text_lower:
            issues.append(('SPECIFIC_FLAG', flag))
    
    return issues

def review_fortnite_questions():
    """Review Fortnite questions from JSON files."""
    print("\n" + "="*80)
    print("FORTNITE QUESTIONS REVIEW")
    print("="*80)
    
    fortnite_files = [
        'scripts/data/fortnite_questions_merged.json',
        'scripts/data/fortnite_ch1_5_questions.json',
        'scripts/data/fortnite_chapter6_questions.json',
    ]
    
    flagged_questions = []
    
    for filepath in fortnite_files:
        path = Path(filepath)
        if not path.exists():
            print(f"File not found: {filepath}")
            continue
            
        print(f"\n--- Reviewing: {filepath} ---")
        
        with open(path, 'r') as f:
            data = json.load(f)
        
        questions = data.get('questions', [])
        print(f"Total questions: {len(questions)}")
        
        for i, q in enumerate(questions):
            text = q.get('text', '')
            issues = check_question(text)
            
            if issues:
                flagged_questions.append({
                    'file': filepath,
                    'index': i,
                    'text': text,
                    'issues': issues,
                    'options': q.get('options', []),
                    'correct_index': q.get('correct_index'),
                    'subcategory': q.get('subcategory', ''),
                    'difficulty': q.get('difficulty', '')
                })
    
    return flagged_questions

def review_nfl_questions():
    """Review NFL questions from CSV files."""
    print("\n" + "="*80)
    print("NFL QUESTIONS REVIEW")
    print("="*80)
    
    nfl_files = [
        '.kiro/specs/vortex-arena-map/nfl_trivia_500_questions.csv',
        '.kiro/specs/vortex-arena-map/nfl_trivia_500_questions_part2.csv',
    ]
    
    flagged_questions = []
    
    for filepath in nfl_files:
        path = Path(filepath)
        if not path.exists():
            print(f"File not found: {filepath}")
            continue
            
        print(f"\n--- Reviewing: {filepath} ---")
        
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            questions = list(reader)
        
        print(f"Total questions: {len(questions)}")
        
        for i, q in enumerate(questions):
            text = q.get('Question', '')
            issues = check_question(text)
            
            if issues:
                flagged_questions.append({
                    'file': filepath,
                    'index': i,
                    'id': q.get('ID', ''),
                    'category': q.get('Category', ''),
                    'text': text,
                    'issues': issues,
                    'options': [q.get('Option A', ''), q.get('Option B', ''), 
                               q.get('Option C', ''), q.get('Option D', '')],
                    'correct': q.get('Correct Answer', '')
                })
    
    return flagged_questions

def print_flagged_questions(flagged: list, title: str):
    """Print flagged questions in a readable format."""
    print(f"\n{'='*80}")
    print(f"FLAGGED {title} QUESTIONS ({len(flagged)} total)")
    print("="*80)
    
    for i, q in enumerate(flagged, 1):
        print(f"\n[{i}] {q['text']}")
        print(f"    File: {q['file']}")
        if 'id' in q:
            print(f"    ID: {q['id']}, Category: {q.get('category', 'N/A')}")
        else:
            print(f"    Index: {q['index']}, Subcategory: {q.get('subcategory', 'N/A')}")
        print(f"    Issues: {[issue[0] for issue in q['issues']]}")
        print(f"    Options: {q['options']}")
        if 'correct_index' in q:
            print(f"    Correct: Option {q['correct_index']} - {q['options'][q['correct_index']] if q['correct_index'] < len(q['options']) else 'N/A'}")
        else:
            print(f"    Correct: {q.get('correct', 'N/A')}")

def main():
    print("="*80)
    print("TRIVIA QUESTION REVIEW TOOL")
    print("Scanning for opinionated, subjective, or unsuitable questions")
    print("="*80)
    
    # Review Fortnite questions
    fortnite_flagged = review_fortnite_questions()
    
    # Review NFL questions
    nfl_flagged = review_nfl_questions()
    
    # Print results
    print_flagged_questions(fortnite_flagged, "FORTNITE")
    print_flagged_questions(nfl_flagged, "NFL")
    
    # Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Fortnite flagged questions: {len(fortnite_flagged)}")
    print(f"NFL flagged questions: {len(nfl_flagged)}")
    print(f"Total flagged: {len(fortnite_flagged) + len(nfl_flagged)}")
    
    # Export to JSON for easier processing
    output = {
        'fortnite': fortnite_flagged,
        'nfl': nfl_flagged,
        'summary': {
            'fortnite_count': len(fortnite_flagged),
            'nfl_count': len(nfl_flagged),
            'total': len(fortnite_flagged) + len(nfl_flagged)
        }
    }
    
    output_path = Path('scripts/data/flagged_questions.json')
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\nFlagged questions exported to: {output_path}")

if __name__ == '__main__':
    main()
