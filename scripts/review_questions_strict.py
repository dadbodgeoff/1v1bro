#!/usr/bin/env python3
"""
Script to review NFL and Fortnite trivia questions for TRULY opinionated or unsuitable content.
More strict filtering - focuses on genuinely problematic questions.
"""

import json
import csv
import re
from pathlib import Path

# Patterns that indicate TRULY problematic questions (not just "how many")
PROBLEMATIC_PATTERNS = [
    # Subjective/Opinion words - these are the real problems
    (r'\b(best|greatest|favorite|favourite|most iconic|most popular|coolest|lamest|most fun|most exciting)\b', 'SUBJECTIVE'),
    (r'\b(should|would you|do you think|in your opinion)\b', 'OPINION'),
    (r'\b(better than|worse than|superior to|inferior to)\b', 'COMPARATIVE_OPINION'),
    (r'\bbetter\b.*\?$', 'COMPARATIVE_OPINION'),  # Questions ending with "better?"
    
    # Controversial/Debatable
    (r'\b(controversial|debatable|disputed|divisive)\b', 'CONTROVERSIAL'),
    
    # Future predictions (not factual)
    (r'\b(will be|going to be|expected to be)\b', 'PREDICTION'),
    (r'\bexpected to\b', 'PREDICTION'),
    (r'\bwill likely\b', 'PREDICTION'),
    
    # Personal preference
    (r'\b(prefer|like more|enjoy more|fan-favorite|fan favorite)\b', 'PREFERENCE'),
    
    # "Considered" implies opinion
    (r'\bis considered\b', 'OPINION'),
    (r'\bwas considered\b', 'OPINION'),
    (r'\bare considered\b', 'OPINION'),
    
    # Vague opinion-based
    (r'\bdo you (think|believe|feel)\b', 'OPINION'),
    (r'\bwhat do you\b', 'OPINION'),
    
    # Ranking without clear metric
    (r'\bmost (loved|hated|liked|disliked)\b', 'SUBJECTIVE'),
    (r'\b(overrated|underrated)\b', 'SUBJECTIVE'),
]

# Specific question text patterns to flag
SPECIFIC_FLAGS = [
    'most iconic',
    'became the most',
    'best season',
    'worst season',
    'best player',
    'worst player',
    'best team',
    'worst team',
    'best defense',
    'best offense',
    'worst defense', 
    'worst offense',
    'best record',
    'worst record',
    'worst division',
    'best division',
    'most memorable',
    'most impressive',
    'most disappointing',
    'biggest disappointment',
    'biggest surprise',
    'fan favorite',
    'fan-favorite',
    'opinion-dependent',
    'depends on preference',
    'uncertain',  # vague answer options
    'debatable',
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
    print("FORTNITE QUESTIONS - TRULY PROBLEMATIC")
    print("="*80)
    
    fortnite_files = [
        'scripts/data/fortnite_questions_merged.json',
        'scripts/data/fortnite_ch1_5_questions.json',
        'scripts/data/fortnite_chapter6_questions.json',
    ]
    
    flagged_questions = []
    total_questions = 0
    
    for filepath in fortnite_files:
        path = Path(filepath)
        if not path.exists():
            print(f"File not found: {filepath}")
            continue
            
        with open(path, 'r') as f:
            data = json.load(f)
        
        questions = data.get('questions', [])
        total_questions += len(questions)
        
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
    
    print(f"Total Fortnite questions scanned: {total_questions}")
    return flagged_questions

def review_nfl_questions():
    """Review NFL questions from CSV files."""
    print("\n" + "="*80)
    print("NFL QUESTIONS - TRULY PROBLEMATIC")
    print("="*80)
    
    nfl_files = [
        '.kiro/specs/vortex-arena-map/nfl_trivia_500_questions.csv',
        '.kiro/specs/vortex-arena-map/nfl_trivia_500_questions_part2.csv',
    ]
    
    flagged_questions = []
    total_questions = 0
    
    for filepath in nfl_files:
        path = Path(filepath)
        if not path.exists():
            print(f"File not found: {filepath}")
            continue
            
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            questions = list(reader)
        
        total_questions += len(questions)
        
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
    
    print(f"Total NFL questions scanned: {total_questions}")
    return flagged_questions

def print_flagged_questions(flagged: list, title: str):
    """Print flagged questions in a readable format."""
    print(f"\n{'='*80}")
    print(f"FLAGGED {title} QUESTIONS TO REMOVE ({len(flagged)} total)")
    print("="*80)
    
    for i, q in enumerate(flagged, 1):
        print(f"\n[{i}] {q['text']}")
        if 'id' in q:
            print(f"    ID: {q['id']}, Category: {q.get('category', 'N/A')}")
            print(f"    File: {Path(q['file']).name}")
        else:
            print(f"    Index: {q['index']}, Subcategory: {q.get('subcategory', 'N/A')}")
            print(f"    File: {Path(q['file']).name}")
        print(f"    Issues: {[issue[0] for issue in q['issues']]}")
        print(f"    Options: {q['options']}")

def main():
    print("="*80)
    print("TRIVIA QUESTION REVIEW - STRICT MODE")
    print("Finding truly opinionated/subjective questions to remove")
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
    print("SUMMARY - QUESTIONS TO REMOVE")
    print("="*80)
    print(f"Fortnite questions to remove: {len(fortnite_flagged)}")
    print(f"NFL questions to remove: {len(nfl_flagged)}")
    print(f"Total to remove: {len(fortnite_flagged) + len(nfl_flagged)}")
    
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
    
    output_path = Path('scripts/data/questions_to_remove.json')
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\nQuestions to remove exported to: {output_path}")
    
    # Print IDs for easy deletion
    print("\n" + "="*80)
    print("NFL QUESTION IDs TO DELETE:")
    print("="*80)
    nfl_ids = [q['id'] for q in nfl_flagged if 'id' in q]
    print(f"IDs: {nfl_ids}")
    
    print("\n" + "="*80)
    print("FORTNITE QUESTION INDICES TO DELETE:")
    print("="*80)
    fortnite_indices = [(Path(q['file']).name, q['index']) for q in fortnite_flagged]
    for file, idx in fortnite_indices:
        print(f"  {file}: index {idx}")

if __name__ == '__main__':
    main()
