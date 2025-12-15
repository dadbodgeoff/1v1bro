#!/usr/bin/env python3
"""
Intelligent rewriter for yes/no NFL trivia questions.
Converts them into proper 4-choice multiple choice format.
"""

import csv
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

INPUT_FILE = Path(".kiro/specs/vortex-arena-map/questions_needing_review.csv")
OUTPUT_FILE = Path(".kiro/specs/vortex-arena-map/rewritten_questions.csv")
MANUAL_REVIEW_FILE = Path(".kiro/specs/vortex-arena-map/manual_review_needed.csv")

# NFL Teams for generating plausible wrong answers
NFL_TEAMS = [
    "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills",
    "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns",
    "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers",
    "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs",
    "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins",
    "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants",
    "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers",
    "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders"
]

# Common QB names for wrong answers
QBS_2024 = [
    "Patrick Mahomes", "Josh Allen", "Lamar Jackson", "Jalen Hurts", "Joe Burrow",
    "Dak Prescott", "Justin Herbert", "Tua Tagovailoa", "Jayden Daniels", "Caleb Williams",
    "C.J. Stroud", "Brock Purdy", "Jared Goff", "Matthew Stafford", "Kirk Cousins",
    "Baker Mayfield", "Sam Darnold", "Jordan Love", "Trevor Lawrence", "Anthony Richardson"
]

# Common player names
PLAYERS_2024 = [
    "Saquon Barkley", "Derrick Henry", "Travis Kelce", "Tyreek Hill", "Ja'Marr Chase",
    "CeeDee Lamb", "A.J. Brown", "DeVonta Smith", "Amon-Ra St. Brown", "Puka Nacua",
    "Brock Bowers", "George Kittle", "Mark Andrews", "T.J. Watt", "Myles Garrett",
    "Micah Parsons", "Nick Bosa", "Maxx Crosby", "Trey Hendrickson", "Jared Verse",
    "Quinyon Mitchell", "Patrick Surtain II", "Sauce Gardner", "Jaire Alexander"
]


def extract_subject_from_question(question: str) -> Optional[str]:
    """Extract the main subject (player/team) from a question."""
    # Pattern: "Did [Subject] do something?"
    match = re.match(r"Did (?:the )?(.+?) (?:get|have|set|finish|win|make|beat|perform|cause|rank|qualify|throw|rush|play|score|break|lead|start|record|reach|achieve|complete|catch|run|pass|receive|tackle|intercept|sack|block|kick|punt|return|fumble|recover|force|strip|blitz|cover|defend|allow|give|take|lose|miss|drop|commit|draw|earn|sign|trade|draft|select|pick|release|cut|waive|suspend|fine|retire|announce|confirm|deny|report|reveal)", question, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # Pattern: "Was [Subject] the first..."
    match = re.match(r"Was (?:the )?(.+?) the (?:first|only|best|worst|highest|lowest)", question, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # Pattern: "Is [Subject] currently..."
    match = re.match(r"Is (?:the )?(.+?) currently", question, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    return None


def is_team(subject: str) -> bool:
    """Check if subject is likely a team."""
    team_keywords = ['eagles', 'chiefs', 'cowboys', 'packers', 'lions', 'rams', 'chargers', 
                     '49ers', 'ravens', 'steelers', 'broncos', 'raiders', 'titans', 'jaguars',
                     'colts', 'texans', 'dolphins', 'bills', 'jets', 'patriots', 'bengals',
                     'browns', 'commanders', 'giants', 'saints', 'falcons', 'panthers',
                     'buccaneers', 'cardinals', 'seahawks', 'vikings', 'bears']
    return any(t in subject.lower() for t in team_keywords)


def get_wrong_answers(correct: str, category: str, is_team_answer: bool) -> List[str]:
    """Generate plausible wrong answers."""
    if is_team_answer:
        # Return other teams
        teams = [t for t in NFL_TEAMS if correct.lower() not in t.lower()]
        import random
        random.shuffle(teams)
        return teams[:3]
    else:
        # Return other players
        players = [p for p in PLAYERS_2024 + QBS_2024 if correct.lower() not in p.lower()]
        import random
        random.shuffle(players)
        return list(set(players))[:3]


def rewrite_question(row: Dict) -> Optional[Dict]:
    """
    Rewrite a yes/no question into proper 4-choice format.
    """
    question = row['Question']
    correct_answer = row['Correct Answer'].strip().lower()
    category = row['Category']
    
    # Skip if answer is "No" - these are harder to convert meaningfully
    if correct_answer == 'no':
        return None
    
    subject = extract_subject_from_question(question)
    if not subject:
        return None
    
    new_row = row.copy()
    is_team_answer = is_team(subject)
    
    # Get wrong answers
    wrong_answers = get_wrong_answers(subject, category, is_team_answer)
    if len(wrong_answers) < 3:
        return None
    
    # Rewrite based on question pattern
    
    # Pattern 1: "Did X set a record for Y?" -> "Who set a record for Y?"
    match = re.match(r"Did (?:the )?(.+?) set (?:an? )?(.+?) record", question, re.IGNORECASE)
    if match:
        record_type = match.group(2)
        new_row['Question'] = f"Who set {record_type} record?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 2: "Did X win Y?" -> "Who won Y?"
    match = re.match(r"Did (?:the )?(.+?) win (.+?)\?", question, re.IGNORECASE)
    if match:
        what_won = match.group(2)
        entity = "Which team" if is_team_answer else "Who"
        new_row['Question'] = f"{entity} won {what_won}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 3: "Did X make the playoffs?" -> "Which team made the playoffs in 2024?"
    match = re.match(r"Did (?:the )?(.+?) make the playoffs", question, re.IGNORECASE)
    if match:
        new_row['Question'] = f"Which of these teams made the playoffs in 2024?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 4: "Did X beat Y?" -> "Who beat Y?"
    match = re.match(r"Did (?:the )?(.+?) beat (?:the )?(.+?)\?", question, re.IGNORECASE)
    if match:
        opponent = match.group(2)
        entity = "Which team" if is_team_answer else "Who"
        new_row['Question'] = f"{entity} beat the {opponent}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 5: "Did X have a strong/good season?" -> "Which player had a strong 2024 season?"
    match = re.match(r"Did (?:the )?(.+?) have a (?:strong|good|great|excellent|solid|impressive) (.+?)\?", question, re.IGNORECASE)
    if match:
        what = match.group(2)
        entity = "Which team" if is_team_answer else "Which player"
        new_row['Question'] = f"{entity} had a strong {what}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 6: "Did X get traded?" -> "Which player got traded in 2024?"
    match = re.match(r"Did (?:the )?(.+?) get traded", question, re.IGNORECASE)
    if match:
        new_row['Question'] = f"Which player got traded in 2024?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 7: "Did X finish in the top N?" -> "Who finished in the top N for Y?"
    match = re.match(r"Did (?:the )?(.+?) finish in the top (\d+)", question, re.IGNORECASE)
    if match:
        top_n = match.group(2)
        entity = "Which team" if is_team_answer else "Who"
        new_row['Question'] = f"{entity} finished in the top {top_n} for this category?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 8: "Did X qualify for Y?" -> "Which team qualified for Y?"
    match = re.match(r"Did (?:the )?(.+?) (?:both )?qualify for (.+?)\?", question, re.IGNORECASE)
    if match:
        what = match.group(2)
        new_row['Question'] = f"Which team qualified for {what}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 9: "Was X the first to Y?" -> "Who was the first to Y?"
    match = re.match(r"Was (?:the )?(.+?) the first (.+?)\?", question, re.IGNORECASE)
    if match:
        action = match.group(2)
        entity = "Which team was" if is_team_answer else "Who was"
        new_row['Question'] = f"{entity} the first {action}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 10: "Did X sign a big contract?" -> "Which player signed a big contract?"
    match = re.match(r"Did (?:the )?(.+?) sign (.+?)\?", question, re.IGNORECASE)
    if match:
        what = match.group(2)
        new_row['Question'] = f"Which player signed {what}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 11: "Did X cause/force a fumble?" -> "Who caused a fumble in this game?"
    match = re.match(r"Did (?:the )?(.+?) (?:cause|force) (.+?)\?", question, re.IGNORECASE)
    if match:
        what = match.group(2)
        new_row['Question'] = f"Who caused {what}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 12: "Did X perform well?" -> "Which player performed well?"
    match = re.match(r"Did (?:the )?(.+?) perform (.+?)\?", question, re.IGNORECASE)
    if match:
        how = match.group(2)
        entity = "Which team" if is_team_answer else "Which player"
        new_row['Question'] = f"{entity} performed {how}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 13: "Did X rank in the top N?" -> "Who ranked in the top N?"
    match = re.match(r"Did (?:the )?(.+?) rank (.+?)\?", question, re.IGNORECASE)
    if match:
        ranking = match.group(2)
        entity = "Which team" if is_team_answer else "Who"
        new_row['Question'] = f"{entity} ranked {ranking}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 14: "Did X have the longest Y?" -> "Which team had the longest Y?"
    match = re.match(r"Did (?:the )?(.+?) have the (?:longest|most|best|highest|lowest) (.+?)\?", question, re.IGNORECASE)
    if match:
        what = match.group(2)
        entity = "Which team" if is_team_answer else "Who"
        new_row['Question'] = f"{entity} had the longest {what}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    # Pattern 15: Generic "Did X do Y?" -> "Which player/team did Y?"
    match = re.match(r"Did (?:the )?(.+?) (.+?)\?", question, re.IGNORECASE)
    if match:
        action = match.group(2)
        entity = "Which team" if is_team_answer else "Which player"
        new_row['Question'] = f"{entity} {action}?"
        new_row['Option A'] = subject
        new_row['Option B'] = wrong_answers[0]
        new_row['Option C'] = wrong_answers[1]
        new_row['Option D'] = wrong_answers[2]
        new_row['Correct Answer'] = subject
        return new_row
    
    return None


def validate_question(row: Dict) -> Tuple[bool, str]:
    """Validate the rewritten question."""
    options = [row.get('Option A', ''), row.get('Option B', ''), 
               row.get('Option C', ''), row.get('Option D', '')]
    correct = row.get('Correct Answer', '')
    
    # Check for yes/no options
    options_lower = [o.lower().strip() for o in options]
    if 'yes' in options_lower or 'no' in options_lower:
        return False, "Still contains Yes/No"
    
    # Check all options are present
    if any(not o.strip() for o in options):
        return False, "Missing options"
    
    # Check for duplicates
    if len(set(o.lower() for o in options)) < 4:
        return False, "Duplicate options"
    
    # Check correct answer is in options
    if correct not in options:
        return False, "Correct answer not in options"
    
    return True, "Valid"


def process():
    """Main processing."""
    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found. Run fix_yesno_questions.py first.")
        return
    
    rewritten = []
    manual_review = []
    
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Processing {len(rows)} questions...")
    
    for row in rows:
        result = rewrite_question(row)
        
        if result:
            is_valid, reason = validate_question(result)
            if is_valid:
                # Remove source and reason columns for clean output
                clean_row = {k: v for k, v in result.items() if k not in ['source', 'reason']}
                rewritten.append(clean_row)
            else:
                manual_review.append({
                    'original_question': row['Question'],
                    'rewrite_attempt': result.get('Question', ''),
                    'reason': reason,
                    **row
                })
        else:
            manual_review.append({
                'original_question': row['Question'],
                'rewrite_attempt': '',
                'reason': row.get('reason', 'Could not rewrite'),
                **row
            })
    
    # Write rewritten questions
    print(f"\nWriting {len(rewritten)} successfully rewritten questions to {OUTPUT_FILE}")
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['ID', 'Category', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rewritten)
    
    # Write manual review needed
    print(f"Writing {len(manual_review)} questions needing manual review to {MANUAL_REVIEW_FILE}")
    with open(MANUAL_REVIEW_FILE, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['original_question', 'rewrite_attempt', 'reason', 'source', 'ID', 'Category', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manual_review)
    
    print(f"\n=== SUMMARY ===")
    print(f"Successfully rewritten: {len(rewritten)}")
    print(f"Need manual review: {len(manual_review)}")
    
    # Show some examples
    if rewritten:
        print(f"\n=== SAMPLE REWRITES ===")
        for i, q in enumerate(rewritten[:5]):
            print(f"\n{i+1}. {q['Question']}")
            print(f"   A: {q['Option A']}")
            print(f"   B: {q['Option B']}")
            print(f"   C: {q['Option C']}")
            print(f"   D: {q['Option D']}")
            print(f"   Correct: {q['Correct Answer']}")


if __name__ == '__main__':
    process()
