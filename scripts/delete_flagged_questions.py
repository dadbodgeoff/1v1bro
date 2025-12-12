#!/usr/bin/env python3
"""
Script to delete flagged opinionated/unsuitable trivia questions.
Reads from scripts/data/questions_to_remove.json and removes them from source files.
"""

import json
import csv
from pathlib import Path
from datetime import datetime

def delete_fortnite_questions():
    """Delete flagged Fortnite questions from JSON files."""
    print("\n" + "="*80)
    print("DELETING FORTNITE QUESTIONS")
    print("="*80)
    
    # Load flagged questions
    with open('scripts/data/questions_to_remove.json', 'r') as f:
        data = json.load(f)
    
    fortnite_flagged = data.get('fortnite', [])
    
    # Group by file
    by_file = {}
    for q in fortnite_flagged:
        filepath = q['file']
        if filepath not in by_file:
            by_file[filepath] = []
        by_file[filepath].append(q['index'])
    
    total_deleted = 0
    
    for filepath, indices in by_file.items():
        path = Path(filepath)
        if not path.exists():
            print(f"File not found: {filepath}")
            continue
        
        # Read current data
        with open(path, 'r') as f:
            file_data = json.load(f)
        
        questions = file_data.get('questions', [])
        original_count = len(questions)
        
        # Sort indices in reverse order to delete from end first
        indices_to_delete = sorted(set(indices), reverse=True)
        
        print(f"\n{filepath}:")
        print(f"  Original questions: {original_count}")
        print(f"  Deleting indices: {sorted(indices_to_delete)}")
        
        # Delete questions
        deleted_texts = []
        for idx in indices_to_delete:
            if idx < len(questions):
                deleted_texts.append(questions[idx].get('text', 'Unknown'))
                del questions[idx]
        
        # Update counts
        file_data['questions'] = questions
        file_data['total_questions'] = len(questions)
        
        # Recalculate by_difficulty and by_subcategory
        by_difficulty = {}
        by_subcategory = {}
        for q in questions:
            diff = q.get('difficulty', 'unknown')
            subcat = q.get('subcategory', 'unknown')
            by_difficulty[diff] = by_difficulty.get(diff, 0) + 1
            by_subcategory[subcat] = by_subcategory.get(subcat, 0) + 1
        
        file_data['by_difficulty'] = by_difficulty
        file_data['by_subcategory'] = by_subcategory
        file_data['last_modified'] = datetime.now().isoformat()
        
        # Write back
        with open(path, 'w') as f:
            json.dump(file_data, f, indent=2)
        
        deleted_count = original_count - len(questions)
        total_deleted += deleted_count
        print(f"  Deleted: {deleted_count}")
        print(f"  Remaining: {len(questions)}")
        print(f"  Deleted questions:")
        for text in deleted_texts:
            print(f"    - {text[:60]}...")
    
    return total_deleted

def delete_nfl_questions():
    """Delete flagged NFL questions from CSV files."""
    print("\n" + "="*80)
    print("DELETING NFL QUESTIONS")
    print("="*80)
    
    # Load flagged questions
    with open('scripts/data/questions_to_remove.json', 'r') as f:
        data = json.load(f)
    
    nfl_flagged = data.get('nfl', [])
    
    # Group by file
    by_file = {}
    for q in nfl_flagged:
        filepath = q['file']
        if filepath not in by_file:
            by_file[filepath] = []
        by_file[filepath].append(q['id'])
    
    total_deleted = 0
    
    for filepath, ids_to_delete in by_file.items():
        path = Path(filepath)
        if not path.exists():
            print(f"File not found: {filepath}")
            continue
        
        # Read current data
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            questions = list(reader)
        
        original_count = len(questions)
        ids_set = set(ids_to_delete)
        
        print(f"\n{filepath}:")
        print(f"  Original questions: {original_count}")
        print(f"  Deleting IDs: {sorted(ids_to_delete, key=int)}")
        
        # Filter out flagged questions
        deleted_texts = []
        remaining = []
        for q in questions:
            if q.get('ID') in ids_set:
                deleted_texts.append(q.get('Question', 'Unknown'))
            else:
                remaining.append(q)
        
        # Write back
        with open(path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(remaining)
        
        deleted_count = original_count - len(remaining)
        total_deleted += deleted_count
        print(f"  Deleted: {deleted_count}")
        print(f"  Remaining: {len(remaining)}")
        print(f"  Deleted questions:")
        for text in deleted_texts:
            print(f"    - {text[:60]}...")
    
    return total_deleted

def main():
    print("="*80)
    print("DELETING FLAGGED TRIVIA QUESTIONS")
    print("="*80)
    
    # Check if flagged questions file exists
    flagged_path = Path('scripts/data/questions_to_remove.json')
    if not flagged_path.exists():
        print("ERROR: Run review_questions_strict.py first to generate questions_to_remove.json")
        return
    
    # Delete Fortnite questions
    fortnite_deleted = delete_fortnite_questions()
    
    # Delete NFL questions
    nfl_deleted = delete_nfl_questions()
    
    # Summary
    print("\n" + "="*80)
    print("DELETION COMPLETE")
    print("="*80)
    print(f"Fortnite questions deleted: {fortnite_deleted}")
    print(f"NFL questions deleted: {nfl_deleted}")
    print(f"Total deleted: {fortnite_deleted + nfl_deleted}")

if __name__ == '__main__':
    main()
