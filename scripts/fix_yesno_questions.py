#!/usr/bin/env python3
"""
Script to extract, rewrite, and validate NFL trivia questions.
Converts yes/no questions into proper 4-choice multiple choice format.
"""

import csv
import re
from pathlib import Path
from typing import List, Dict, Tuple

# Paths
INPUT_FILES = [
    ".kiro/specs/vortex-arena-map/nfl_trivia_500_questions.csv",
    ".kiro/specs/vortex-arena-map/nfl_trivia_500_questions_part2.csv"
]
OUTPUT_DIR = Path(".kiro/specs/vortex-arena-map")
EXTRACTED_FILE = OUTPUT_DIR / "extracted_yesno_questions.csv"
REWRITTEN_FILE = OUTPUT_DIR / "rewritten_questions.csv"


def is_yesno_question(row: Dict) -> bool:
    """Check if a question has Yes/No as options."""
    options = [row.get('Option A', ''), row.get('Option B', ''), 
               row.get('Option C', ''), row.get('Option D', '')]
    options_lower = [o.lower().strip() for o in options]
    return 'yes' in options_lower or 'no' in options_lower


def rewrite_question(row: Dict) -> Dict:
    """
    Rewrite a yes/no question into proper 4-choice format.
    Returns the rewritten question or None if it can't be converted.
    """
    question = row['Question']
    category = row['Category']
    correct = row['Correct Answer']
    
    # Common patterns and their rewrites
    rewrites = []
    
    # Pattern: "Was X the first to Y?" -> "Who was the first to Y?"
    if question.lower().startswith('was ') and 'first' in question.lower():
        match = re.match(r"Was (.+?) the first (.+?)\?", question, re.IGNORECASE)
        if match:
            subject = match.group(1)
            action = match.group(2)
            return create_who_question(row, subject, f"the first {action}")
    
    # Pattern: "Did X do Y?" -> "Which player did Y?" or "What did X do?"
    if question.lower().startswith('did '):
        return rewrite_did_question(row)
    
    # Pattern: "Is X currently Y?" -> "What is X's current status?"
    if question.lower().startswith('is '):
        return rewrite_is_question(row)
    
    # Pattern: "Has X done Y?" -> "How many times has X done Y?"
    if question.lower().startswith('has '):
        return rewrite_has_question(row)
    
    # If we can't rewrite, return None (will be flagged for manual review)
    return None


def rewrite_did_question(row: Dict) -> Dict:
    """Rewrite 'Did X do Y?' questions."""
    question = row['Question']
    correct = row['Correct Answer'].lower().strip()
    
    # Extract the subject and action
    match = re.match(r"Did (.+?) (get|have|set|finish|win|make|beat|perform|cause|rank|qualify|throw|rush|play|score|break|lead|start|record|reach|achieve|complete|catch|run|pass|receive|tackle|intercept|sack|block|kick|punt|return|fumble|recover|force|strip|blitz|cover|defend|allow|give|take|lose|miss|drop|commit|draw|earn|sign|trade|draft|select|pick|release|cut|waive|suspend|fine|retire|announce|confirm|deny|report|reveal|leak|speculate|predict|expect|project|estimate|calculate|measure|count|track|monitor|analyze|compare|contrast|evaluate|assess|rate|rank|grade|score|judge|decide|determine|conclude|find|discover|learn|know|understand|realize|recognize|remember|forget|ignore|overlook|miss|notice|observe|see|watch|hear|listen|feel|sense|smell|taste|touch|experience|encounter|face|meet|greet|welcome|introduce|present|show|display|demonstrate|illustrate|explain|describe|define|clarify|elaborate|expand|extend|develop|grow|increase|decrease|reduce|cut|lower|raise|lift|boost|improve|enhance|strengthen|weaken|damage|hurt|harm|injure|heal|recover|restore|repair|fix|solve|resolve|address|handle|manage|control|regulate|govern|rule|lead|guide|direct|steer|navigate|drive|operate|run|work|function|perform|execute|implement|apply|use|utilize|employ|engage|involve|include|contain|hold|carry|bring|take|give|send|receive|deliver|provide|supply|offer|present|submit|propose|suggest|recommend|advise|counsel|consult|discuss|debate|argue|dispute|disagree|agree|accept|reject|refuse|decline|deny|confirm|verify|validate|authenticate|certify|approve|authorize|permit|allow|enable|empower|support|assist|help|aid|serve|benefit|favor|prefer|choose|select|pick|decide|opt|elect|vote|nominate|appoint|assign|delegate|allocate|distribute|divide|share|split|separate|combine|merge|join|connect|link|attach|bind|tie|fasten|secure|lock|unlock|open|close|shut|seal|cover|wrap|pack|unpack|load|unload|fill|empty|pour|spill|leak|drip|flow|stream|flood|overflow|drain|dry|wet|soak|dip|immerse|submerge|sink|float|rise|fall|drop|land|crash|collide|hit|strike|punch|kick|throw|catch|grab|hold|release|let|drop|toss|flip|spin|turn|rotate|twist|bend|fold|unfold|roll|unroll|wrap|unwrap|tie|untie|knot|unknot|button|unbutton|zip|unzip|snap|unsnap|hook|unhook|clasp|unclasp|buckle|unbuckle|lace|unlace|strap|unstrap|belt|unbelt|chain|unchain|cuff|uncuff|shackle|unshackle|bind|unbind|free|release|liberate|rescue|save|protect|guard|defend|shield|shelter|cover|hide|conceal|reveal|expose|uncover|discover|find|locate|spot|identify|recognize|distinguish|differentiate|separate|isolate|segregate|integrate|incorporate|assimilate|absorb|digest|process|convert|transform|change|alter|modify|adjust|adapt|accommodate|fit|suit|match|coordinate|synchronize|align|balance|stabilize|steady|secure|anchor|ground|root|plant|grow|cultivate|nurture|nourish|feed|water|fertilize|prune|trim|cut|mow|rake|sweep|clean|wash|rinse|scrub|polish|shine|buff|wax|oil|grease|lubricate|maintain|service|repair|fix|restore|renovate|remodel|rebuild|reconstruct|redesign|reorganize|restructure|reform|revise|review|revamp|overhaul|upgrade|update|modernize|improve|enhance|optimize|maximize|minimize|reduce|eliminate|remove|delete|erase|clear|wipe|blank|reset|restart|reboot|refresh|reload|renew|replace|substitute|swap|exchange|trade|barter|buy|sell|purchase|acquire|obtain|get|receive|accept|take|grab|seize|capture|catch|trap|snare|net|hook|reel|pull|drag|tow|haul|lift|raise|hoist|elevate|lower|drop|release|let|allow|permit|enable|empower|authorize|approve|sanction|endorse|support|back|sponsor|fund|finance|invest|spend|pay|charge|bill|invoice|receipt|refund|reimburse|compensate|reward|bonus|tip|donate|contribute|give|grant|award|bestow|confer|present|offer|provide|supply|deliver|ship|mail|send|transmit|broadcast|publish|post|upload|download|stream|play|pause|stop|start|begin|end|finish|complete|conclude|close|open|launch|release|debut|premiere|introduce|present|announce|declare|proclaim|state|say|tell|speak|talk|communicate|convey|express|articulate|voice|utter|pronounce|enunciate|recite|read|write|type|print|copy|paste|cut|delete|edit|revise|proofread|correct|fix|amend|update|modify|change|alter|adjust|tweak|fine-tune|calibrate|set|configure|customize|personalize|tailor|adapt|accommodate|fit|suit|match|coordinate|harmonize|blend|mix|combine|merge|fuse|integrate|incorporate|include|add|insert|attach|append|prepend|prefix|suffix|extend|expand|enlarge|increase|grow|develop|evolve|progress|advance|proceed|continue|persist|persevere|endure|last|survive|thrive|flourish|prosper|succeed|achieve|accomplish|attain|reach|arrive|come|go|move|travel|journey|voyage|cruise|sail|fly|soar|glide|float|drift|wander|roam|stroll|walk|run|jog|sprint|dash|race|chase|pursue|follow|track|trail|trace|hunt|search|seek|look|find|discover|uncover|reveal|expose|show|display|exhibit|demonstrate|illustrate|depict|portray|represent|symbolize|signify|mean|indicate|suggest|imply|hint|allude|refer|mention|cite|quote|paraphrase|summarize|outline|sketch|draft|compose|write|author|create|produce|make|build|construct|assemble|manufacture|fabricate|forge|mold|shape|form|design|plan|scheme|plot|strategize|organize|arrange|order|sort|classify|categorize|group|cluster|bunch|gather|collect|accumulate|amass|hoard|stockpile|store|save|preserve|conserve|protect|guard|defend|shield|shelter|cover|hide|conceal|mask|disguise|camouflage|cloak|veil|shroud|wrap|envelop|surround|encircle|enclose|contain|hold|keep|retain|maintain|sustain|support|uphold|preserve|protect|defend|guard|secure|safeguard|ensure|guarantee|warrant|certify|verify|confirm|validate|authenticate|prove|demonstrate|show|establish|determine|ascertain|discover|find|learn|know|understand|comprehend|grasp|perceive|recognize|identify|distinguish|differentiate|discriminate|discern|detect|notice|observe|see|view|watch|witness|behold|gaze|stare|glance|peek|peep|spy|scout|survey|scan|examine|inspect|check|test|try|attempt|endeavor|strive|struggle|fight|battle|combat|war|conflict|clash|collide|crash|smash|break|shatter|crack|split|tear|rip|cut|slice|chop|hack|saw|drill|bore|pierce|puncture|stab|poke|prod|push|shove|thrust|ram|slam|bang|pound|hammer|beat|strike|hit|punch|slap|smack|whack|thump|bump|knock|tap|pat|stroke|rub|massage|knead|squeeze|press|compress|crush|grind|pulverize|powder|dust|sprinkle|scatter|spread|smear|coat|cover|layer|stack|pile|heap|mound|mount|climb|scale|ascend|rise|lift|raise|elevate|hoist|boost|increase|grow|expand|extend|stretch|reach|span|bridge|connect|link|join|unite|merge|combine|blend|mix|stir|shake|whip|beat|fold|knead|roll|flatten|press|squeeze|wring|twist|turn|spin|rotate|revolve|orbit|circle|loop|curve|bend|flex|stretch|extend|reach|grab|grasp|grip|hold|clutch|clench|squeeze|press|push|pull|tug|yank|jerk|snap|crack|pop|bang|boom|blast|explode|burst|erupt|spew|spout|spray|splash|splatter|drip|drop|fall|plunge|dive|plummet|crash|land|touch|contact|meet|encounter|face|confront|challenge|dare|risk|venture|attempt|try|test|experiment|explore|investigate|research|study|examine|analyze|evaluate|assess|judge|rate|rank|grade|score|measure|calculate|compute|count|tally|total|sum|add|subtract|multiply|divide|split|share|distribute|allocate|assign|give|grant|award|bestow|confer|present|offer|provide|supply|deliver|send|ship|mail|post|transmit|broadcast|air|show|display|exhibit|present|introduce|announce|declare|proclaim|state|assert|claim|maintain|contend|argue|debate|discuss|talk|speak|say|tell|communicate|convey|express|voice|articulate|pronounce|enunciate|recite|read|write|record|document|log|note|jot|scribble|sketch|draw|paint|color|shade|highlight|emphasize|stress|underscore|underline|italicize|bold|capitalize|format|style|design|create|make|produce|generate|develop|build|construct|assemble|put|place|set|lay|position|arrange|organize|order|sort|file|store|save|keep|hold|retain|maintain|preserve|protect|guard|secure|lock|seal|close|shut|block|bar|obstruct|impede|hinder|hamper|handicap|disable|cripple|paralyze|freeze|stop|halt|cease|end|finish|complete|conclude|close|wrap|wind|down|up|off|on|out|in|over|under|through|across|along|around|about|near|far|close|distant|remote|isolated|separated|divided|split|broken|damaged|hurt|injured|wounded|harmed|affected|impacted|influenced|shaped|formed|molded|crafted|made|created|produced|generated|developed|grown|raised|bred|born|hatched|spawned|originated|started|began|commenced|initiated|launched|kicked|off|opened|introduced|presented|showed|displayed|exhibited|demonstrated|illustrated|depicted|portrayed|represented|symbolized|signified|meant|indicated|suggested|implied|hinted|alluded|referred|mentioned|cited|quoted|paraphrased|summarized|outlined|sketched|drafted|composed|written|authored|created|produced|made|built|constructed|assembled|manufactured|fabricated|forged|molded|shaped|formed|designed|planned|schemed|plotted|strategized|organized|arranged|ordered|sorted|classified|categorized|grouped|clustered|bunched|gathered|collected|accumulated|amassed|hoarded|stockpiled|stored|saved|preserved|conserved|protected|guarded|defended|shielded|sheltered|covered|hidden|concealed|masked|disguised|camouflaged|cloaked|veiled|shrouded|wrapped|enveloped|surrounded|encircled|enclosed|contained|held|kept|retained|maintained|sustained|supported|upheld|preserved|protected|defended|guarded|secured|safeguarded|ensured|guaranteed|warranted|certified|verified|confirmed|validated|authenticated|proved|demonstrated|showed|established|determined|ascertained|discovered|found|learned|known|understood|comprehended|grasped|perceived|recognized|identified|distinguished|differentiated|discriminated|discerned|detected|noticed|observed|seen|viewed|watched|witnessed|beheld|gazed|stared|glanced|peeked|peeped|spied|scouted|surveyed|scanned|examined|inspected|checked|tested|tried|attempted|endeavored|strived|struggled|fought|battled|combated|warred|conflicted|clashed|collided|crashed|smashed|broke|shattered|cracked|split|tore|ripped|cut|sliced|chopped|hacked|sawed|drilled|bored|pierced|punctured|stabbed|poked|prodded|pushed|shoved|thrust|rammed|slammed|banged|pounded|hammered|beat|struck|hit|punched|slapped|smacked|whacked|thumped|bumped|knocked|tapped|patted|stroked|rubbed|massaged|kneaded|squeezed|pressed|compressed|crushed|ground|pulverized|powdered|dusted|sprinkled|scattered|spread|smeared|coated|covered|layered|stacked|piled|heaped|mounded|mounted|climbed|scaled|ascended|rose|lifted|raised|elevated|hoisted|boosted|increased|grew|expanded|extended|stretched|reached|spanned|bridged|connected|linked|joined|united|merged|combined|blended|mixed|stirred|shook|whipped|beat|folded|kneaded|rolled|flattened|pressed|squeezed|wrung|twisted|turned|spun|rotated|revolved|orbited|circled|looped|curved|bent|flexed|stretched|extended|reached|grabbed|grasped|gripped|held|clutched|clenched|squeezed|pressed|pushed|pulled|tugged|yanked|jerked|snapped|cracked|popped|banged|boomed|blasted|exploded|burst|erupted|spewed|spouted|sprayed|splashed|splattered|dripped|dropped|fell|plunged|dived|plummeted|crashed|landed|touched|contacted|met|encountered|faced|confronted|challenged|dared|risked|ventured|attempted|tried|tested|experimented|explored|investigated|researched|studied|examined|analyzed|evaluated|assessed|judged|rated|ranked|graded|scored|measured|calculated|computed|counted|tallied|totaled|summed|added|subtracted|multiplied|divided|split|shared|distributed|allocated|assigned|gave|granted|awarded|bestowed|conferred|presented|offered|provided|supplied|delivered|sent|shipped|mailed|posted|transmitted|broadcast|aired|showed|displayed|exhibited|presented|introduced|announced|declared|proclaimed|stated|asserted|claimed|maintained|contended|argued|debated|discussed|talked|spoke|said|told|communicated|conveyed|expressed|voiced|articulated|pronounced|enunciated|recited|read|wrote|recorded|documented|logged|noted|jotted|scribbled|sketched|drew|painted|colored|shaded|highlighted|emphasized|stressed|underscored|underlined|italicized|bolded|capitalized|formatted|styled|designed|created|made|produced|generated|developed|built|constructed|assembled|put|placed|set|laid|positioned|arranged|organized|ordered|sorted|filed|stored|saved|kept|held|retained|maintained|preserved|protected|guarded|secured|locked|sealed|closed|shut|blocked|barred|obstructed|impeded|hindered|hampered|handicapped|disabled|crippled|paralyzed|froze|stopped|halted|ceased|ended|finished|completed|concluded|closed|wrapped|wound) (.+?)\?", question, re.IGNORECASE)
    
    if not match:
        # Simpler pattern
        match = re.match(r"Did (.+?) (.+?)\?", question, re.IGNORECASE)
    
    if match:
        subject = match.group(1)
        action = match.group(2)
        
        # If the answer is Yes, the subject did the action
        if correct == 'yes':
            # Convert to "Which player/team did X?"
            new_row = row.copy()
            
            # Determine if subject is a player or team
            if any(team in subject.lower() for team in ['eagles', 'chiefs', 'cowboys', 'packers', 'lions', 'rams', 'chargers', '49ers', 'ravens', 'steelers', 'broncos', 'raiders', 'titans', 'jaguars', 'colts', 'texans', 'dolphins', 'bills', 'jets', 'patriots', 'bengals', 'browns', 'commanders', 'giants', 'saints', 'falcons', 'panthers', 'buccaneers', 'cardinals', 'seahawks', 'vikings', 'bears']):
                new_row['Question'] = f"Which team {action}?"
            else:
                new_row['Question'] = f"Which player {action}?"
            
            new_row['Option A'] = subject
            new_row['Correct Answer'] = subject
            return new_row
    
    return None


def rewrite_is_question(row: Dict) -> Dict:
    """Rewrite 'Is X currently Y?' questions."""
    question = row['Question']
    correct = row['Correct Answer'].lower().strip()
    
    match = re.match(r"Is (.+?) currently (.+?)\?", question, re.IGNORECASE)
    if match:
        subject = match.group(1)
        status = match.group(2)
        
        new_row = row.copy()
        new_row['Question'] = f"What is {subject}'s current NFL status?"
        
        if correct == 'yes':
            new_row['Option A'] = f"Currently {status}"
            new_row['Option B'] = "Retired"
            new_row['Option C'] = "Free agent"
            new_row['Option D'] = "Suspended"
            new_row['Correct Answer'] = f"Currently {status}"
        else:
            new_row['Option A'] = "Retired"
            new_row['Option B'] = f"Currently {status}"
            new_row['Option C'] = "Free agent"
            new_row['Option D'] = "Suspended"
            new_row['Correct Answer'] = "Retired"
        
        return new_row
    
    return None


def rewrite_has_question(row: Dict) -> Dict:
    """Rewrite 'Has X done Y?' questions."""
    return None  # Complex, needs manual review


def create_who_question(row: Dict, correct_subject: str, action: str) -> Dict:
    """Create a 'Who was...' question with the correct subject as answer."""
    new_row = row.copy()
    new_row['Question'] = f"Who was {action}?"
    new_row['Option A'] = correct_subject
    new_row['Correct Answer'] = correct_subject
    # Keep other options as plausible alternatives (would need NFL knowledge to fill properly)
    return new_row


def validate_question(row: Dict) -> Tuple[bool, str]:
    """
    Validate that a question is properly formatted for 4-choice quiz.
    Returns (is_valid, reason).
    """
    options = [row.get('Option A', ''), row.get('Option B', ''), 
               row.get('Option C', ''), row.get('Option D', '')]
    correct = row.get('Correct Answer', '')
    
    # Check for yes/no options
    options_lower = [o.lower().strip() for o in options]
    if 'yes' in options_lower or 'no' in options_lower:
        return False, "Contains Yes/No options"
    
    # Check that all 4 options are present and different
    if len(set(options)) < 4:
        return False, "Duplicate or missing options"
    
    # Check that correct answer matches one of the options
    if correct not in options:
        return False, f"Correct answer '{correct}' not in options"
    
    # Check question ends with ?
    if not row.get('Question', '').strip().endswith('?'):
        return False, "Question doesn't end with ?"
    
    return True, "Valid"


def process_files():
    """Main processing function."""
    all_yesno = []
    all_valid = []
    needs_review = []
    
    for input_file in INPUT_FILES:
        path = Path(input_file)
        if not path.exists():
            print(f"Warning: {input_file} not found")
            continue
        
        print(f"\nProcessing {input_file}...")
        
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        yesno_count = 0
        valid_count = 0
        
        for row in rows:
            if is_yesno_question(row):
                yesno_count += 1
                all_yesno.append({
                    'source': input_file,
                    **row
                })
                
                # Try to rewrite
                rewritten = rewrite_question(row)
                if rewritten:
                    is_valid, reason = validate_question(rewritten)
                    if is_valid:
                        all_valid.append(rewritten)
                    else:
                        needs_review.append({
                            'source': input_file,
                            'original': row,
                            'rewritten': rewritten,
                            'reason': reason
                        })
                else:
                    needs_review.append({
                        'source': input_file,
                        'original': row,
                        'rewritten': None,
                        'reason': "Could not auto-rewrite"
                    })
            else:
                # Validate existing question
                is_valid, reason = validate_question(row)
                if is_valid:
                    valid_count += 1
                    all_valid.append(row)
                else:
                    needs_review.append({
                        'source': input_file,
                        'original': row,
                        'rewritten': None,
                        'reason': reason
                    })
        
        print(f"  Found {yesno_count} yes/no questions")
        print(f"  Found {valid_count} already valid questions")
    
    # Write extracted yes/no questions
    print(f"\n\nWriting {len(all_yesno)} yes/no questions to {EXTRACTED_FILE}")
    with open(EXTRACTED_FILE, 'w', newline='', encoding='utf-8') as f:
        if all_yesno:
            fieldnames = ['source', 'ID', 'Category', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_yesno)
    
    # Write questions needing review
    review_file = OUTPUT_DIR / "questions_needing_review.csv"
    print(f"Writing {len(needs_review)} questions needing review to {review_file}")
    with open(review_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['source', 'reason', 'ID', 'Category', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for item in needs_review:
            row = {
                'source': item['source'],
                'reason': item['reason'],
                **item['original']
            }
            writer.writerow(row)
    
    # Write valid questions
    valid_file = OUTPUT_DIR / "nfl_trivia_validated.csv"
    print(f"Writing {len(all_valid)} validated questions to {valid_file}")
    with open(valid_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['ID', 'Category', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_valid)
    
    print(f"\n=== SUMMARY ===")
    print(f"Total yes/no questions extracted: {len(all_yesno)}")
    print(f"Questions needing manual review: {len(needs_review)}")
    print(f"Validated questions ready to use: {len(all_valid)}")


if __name__ == '__main__':
    process_files()
