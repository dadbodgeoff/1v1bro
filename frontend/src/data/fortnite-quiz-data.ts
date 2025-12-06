/**
 * Fortnite Quiz Question Database
 * Generated from the comprehensive Fortnite Seasons Report
 */

import type { QuizQuestion, TimelineQuestion, EraBattleQuestion, PersonalityQuestion, SurveyQuestion } from '@/types/quiz'

// ============================================================================
// CLASSIC QUIZ QUESTIONS
// ============================================================================

export const quizQuestions: QuizQuestion[] = [
  // CASUAL (Easy) - 1-2 points
  {
    id: 'c1',
    question: 'In what year did Fortnite Battle Royale launch?',
    options: ['2016', '2017', '2018', '2019'],
    correctAnswer: 1,
    explanation: 'Fortnite BR launched September 12, 2017',
    difficulty: 'casual',
    category: 'seasons',
    points: 1,
    year: 2017,
    tags: ['launch', 'history']
  },
  {
    id: 'c2',
    question: 'What is the name of the iconic purple cube from Season 5?',
    options: ['Steve', 'Kevin', 'Bob', 'Cube-y'],
    correctAnswer: 1,
    explanation: 'The community named it Kevin, though officially it was just "The Cube"',
    difficulty: 'casual',
    category: 'events',
    points: 1,
    chapter: 1,
    season: 5,
    tags: ['kevin', 'cube', 'meme']
  },
  {
    id: 'c3',
    question: 'Which Chapter featured Spider-Man as a Battle Pass skin?',
    options: ['Chapter 2 Season 4', 'Chapter 3 Season 1', 'Chapter 4 Season 2', 'Chapter 5 Season 1'],
    correctAnswer: 1,
    explanation: 'Spider-Man was the headline skin for Chapter 3 Season 1 "Flipped"',
    difficulty: 'casual',
    category: 'skins',
    points: 1,
    chapter: 3,
    season: 1,
    tags: ['spider-man', 'marvel', 'collab']
  },
  {
    id: 'c4',
    question: 'What is the standard V-Bucks cost of a Battle Pass?',
    options: ['500 V-Bucks', '800 V-Bucks', '950 V-Bucks', '1200 V-Bucks'],
    correctAnswer: 2,
    explanation: 'The Battle Pass has cost 950 V-Bucks since its introduction',
    difficulty: 'casual',
    category: 'seasons',
    points: 1,
    tags: ['battle-pass', 'vbucks']
  },
  {
    id: 'c5',
    question: 'Which rapper performed the Astronomical concert in Fortnite?',
    options: ['Drake', 'Travis Scott', 'Marshmello', 'Eminem'],
    correctAnswer: 1,
    explanation: 'Travis Scott\'s Astronomical was a groundbreaking in-game concert in April 2020',
    difficulty: 'casual',
    category: 'events',
    points: 1,
    chapter: 2,
    season: 2,
    year: 2020,
    tags: ['concert', 'travis-scott', 'event']
  },
  {
    id: 'c6',
    question: 'How many Chapters have been released as of 2025?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    explanation: 'Fortnite has had 7 chapters from 2017 to 2025, with Chapter 7 launching in December 2025',
    difficulty: 'casual',
    category: 'seasons',
    points: 1,
    tags: ['chapters', 'history']
  },
  {
    id: 'c7',
    question: 'What major event ended Chapter 1?',
    options: ['The Flood', 'The End', 'The Flip', 'Zero Point'],
    correctAnswer: 1,
    explanation: 'The End event created a black hole that left players staring at nothing for 2+ hours',
    difficulty: 'casual',
    category: 'events',
    points: 2,
    chapter: 1,
    season: 10,
    tags: ['the-end', 'black-hole']
  },
  {
    id: 'c8',
    question: 'What is the approximate average length of a Fortnite season?',
    options: ['4-5 weeks', '7-8 weeks', '10-11 weeks', '14-15 weeks'],
    correctAnswer: 2,
    explanation: 'Seasons typically last 70-75 days, or about 10-11 weeks',
    difficulty: 'casual',
    category: 'seasons',
    points: 1,
    tags: ['season-length']
  },
  {
    id: 'c9',
    question: 'Which fruit became an iconic Fortnite skin?',
    options: ['Apple', 'Banana (Peely)', 'Orange', 'Watermelon'],
    correctAnswer: 1,
    explanation: 'Peely the banana debuted in Chapter 1 Season 8 and became a fan favorite',
    difficulty: 'casual',
    category: 'skins',
    points: 1,
    chapter: 1,
    season: 8,
    tags: ['peely', 'meme', 'iconic']
  },
  {
    id: 'c10',
    question: 'What gaming legend appeared in Chapter 4?',
    options: ['Master Chief', 'Kratos', 'Geralt of Rivia', 'All of the above'],
    correctAnswer: 3,
    explanation: 'Chapter 4 featured multiple gaming legends including Geralt, Doom Slayer, and more',
    difficulty: 'casual',
    category: 'collabs',
    points: 1,
    chapter: 4,
    tags: ['gaming-legends', 'collab']
  },

  // MODERATE - 2-3 points
  {
    id: 'm1',
    question: 'What was the longest season in Fortnite history?',
    options: ['Chapter 1 Season 7', 'Chapter 2 Season 1', 'Chapter 2 Season 2', 'Chapter 3 Season 1'],
    correctAnswer: 1,
    explanation: 'Chapter 2 Season 1 "New World" lasted 128 days due to COVID-19 delays',
    difficulty: 'moderate',
    category: 'seasons',
    points: 3,
    chapter: 2,
    season: 1,
    tags: ['longest', 'covid', 'record']
  },
  {
    id: 'm2',
    question: 'Which Chapter temporarily removed building?',
    options: ['Chapter 2 Season 8', 'Chapter 3 Season 1', 'Chapter 3 Season 2', 'Chapter 4 Season 1'],
    correctAnswer: 2,
    explanation: 'Chapter 3 Season 2 "Resistance" controversially removed building temporarily',
    difficulty: 'moderate',
    category: 'seasons',
    points: 3,
    chapter: 3,
    season: 2,
    tags: ['no-building', 'controversial']
  },
  {
    id: 'm3',
    question: 'What Mythic weapon did players vote to unvault in Chapter 1 Season 8?',
    options: ['Infinity Blade', 'Drum Gun', 'Guided Missile', 'Zapotron'],
    correctAnswer: 1,
    explanation: 'The Drum Gun won the community vote and was immediately considered overpowered',
    difficulty: 'moderate',
    category: 'weapons',
    points: 3,
    chapter: 1,
    season: 8,
    tags: ['unvaulting', 'drum-gun', 'vote']
  },
  {
    id: 'm4',
    question: 'Who was the secret Battle Pass skin in Chapter 2 Season 2?',
    options: ['Wolverine', 'Deadpool', 'Aquaman', 'Predator'],
    correctAnswer: 1,
    explanation: 'Deadpool was hidden in The Agency and unlocked through secret challenges',
    difficulty: 'moderate',
    category: 'skins',
    points: 3,
    chapter: 2,
    season: 2,
    tags: ['secret-skin', 'deadpool', 'marvel']
  },
  {
    id: 'm5',
    question: 'What was the prize pool for the 2019 Fortnite World Cup?',
    options: ['$10 million', '$20 million', '$30 million', '$50 million'],
    correctAnswer: 2,
    explanation: 'The 2019 World Cup had a $30 million prize pool, the largest in esports at the time',
    difficulty: 'moderate',
    category: 'esports',
    points: 2,
    year: 2019,
    tags: ['world-cup', 'prize-pool', 'esports']
  },

  {
    id: 'm6',
    question: 'Who won the 2019 Fortnite World Cup Solo Championship?',
    options: ['Ninja', 'Tfue', 'Bugha', 'Mongraal'],
    correctAnswer: 2,
    explanation: 'Kyle "Bugha" Giersdorf won at age 16, taking home $3 million',
    difficulty: 'moderate',
    category: 'esports',
    points: 3,
    year: 2019,
    tags: ['bugha', 'world-cup', 'champion']
  },
  {
    id: 'm7',
    question: 'What was the theme of Chapter 2 Season 2?',
    options: ['Aliens', 'Spies', 'Pirates', 'Superheroes'],
    correctAnswer: 1,
    explanation: 'Chapter 2 Season 2 "Top Secret" featured Ghost vs Shadow spy factions',
    difficulty: 'moderate',
    category: 'seasons',
    points: 2,
    chapter: 2,
    season: 2,
    tags: ['spy', 'ghost', 'shadow']
  },
  {
    id: 'm8',
    question: 'Which Star Wars character was first to appear in Fortnite?',
    options: ['Darth Vader', 'Mandalorian', 'Kylo Ren', 'Stormtrooper'],
    correctAnswer: 1,
    explanation: 'The Mandalorian was the Tier 1 skin in Chapter 2 Season 5',
    difficulty: 'moderate',
    category: 'collabs',
    points: 3,
    chapter: 2,
    season: 5,
    tags: ['star-wars', 'mandalorian', 'collab']
  },
  {
    id: 'm9',
    question: 'What new movement mechanic was introduced in Chapter 3?',
    options: ['Swimming', 'Sliding', 'Climbing', 'Gliding'],
    correctAnswer: 1,
    explanation: 'Sliding was introduced in Chapter 3 Season 1 along with mantling',
    difficulty: 'moderate',
    category: 'seasons',
    points: 2,
    chapter: 3,
    season: 1,
    tags: ['sliding', 'movement', 'mechanic']
  },
  {
    id: 'm10',
    question: 'What was the first DC character to appear in Fortnite?',
    options: ['Batman', 'Superman', 'Harley Quinn', 'The Flash'],
    correctAnswer: 1,
    explanation: 'Superman appeared in Chapter 2 Season 7 as a Battle Pass skin',
    difficulty: 'moderate',
    category: 'collabs',
    points: 3,
    chapter: 2,
    season: 7,
    tags: ['dc', 'superman', 'collab']
  },

  // EXPERT - 3-4 points
  {
    id: 'e1',
    question: 'What tier was required to obtain Golden Peely in Chapter 2 Season 1?',
    options: ['Level 200', 'Level 300', 'Level 350', 'Level 400'],
    correctAnswer: 2,
    explanation: 'Golden Peely required Level 350, nearly impossible for average players',
    difficulty: 'expert',
    category: 'skins',
    points: 4,
    chapter: 2,
    season: 1,
    tags: ['golden-peely', 'grind', 'rare']
  },
  {
    id: 'e2',
    question: 'Name the agent who dropped Midas\' Drum Gun in Chapter 2 Season 2',
    options: ['Brutus', 'Skye', 'Midas', 'TNTina'],
    correctAnswer: 2,
    explanation: 'Midas at The Agency dropped his golden Drum Gun when defeated',
    difficulty: 'expert',
    category: 'weapons',
    points: 3,
    chapter: 2,
    season: 2,
    tags: ['midas', 'mythic', 'agency']
  },
  {
    id: 'e3',
    question: 'What tier was required to obtain Black Knight in Chapter 1 Season 2?',
    options: ['Tier 50', 'Tier 70', 'Tier 100', 'Tier 120'],
    correctAnswer: 1,
    explanation: 'Black Knight was at Tier 70, making it one of the rarest OG skins',
    difficulty: 'expert',
    category: 'skins',
    points: 3,
    chapter: 1,
    season: 2,
    tags: ['black-knight', 'og', 'rare']
  },
  {
    id: 'e4',
    question: 'What event caused the entire playerbase to disconnect for 2+ hours?',
    options: ['The Device', 'The End', 'Zero Crisis', 'Collision'],
    correctAnswer: 1,
    explanation: 'The End event in Chapter 1 Season X created a black hole that shut down the game',
    difficulty: 'expert',
    category: 'events',
    points: 4,
    chapter: 1,
    season: 10,
    tags: ['the-end', 'black-hole', 'historic']
  },
  {
    id: 'e5',
    question: 'How many concurrent viewers watched The End event on Twitch?',
    options: ['5 million', '10 million', '15 million', '20 million'],
    correctAnswer: 2,
    explanation: 'Over 15 million viewers watched the black hole across all platforms',
    difficulty: 'expert',
    category: 'events',
    points: 4,
    chapter: 1,
    season: 10,
    tags: ['viewership', 'record', 'the-end']
  },
  {
    id: 'e6',
    question: 'What was the B.R.U.T.E. and why was it controversial?',
    options: ['A weapon that was too weak', 'A mech suit that was overpowered', 'A vehicle that was too slow', 'A trap that didn\'t work'],
    correctAnswer: 1,
    explanation: 'The B.R.U.T.E. mech in Season 9 was so overpowered it sparked massive community backlash',
    difficulty: 'expert',
    category: 'weapons',
    points: 3,
    chapter: 1,
    season: 9,
    tags: ['brute', 'mech', 'controversial']
  },
  {
    id: 'e7',
    question: 'What replaced building during Chapter 3 Season 2?',
    options: ['Extra shields', 'Overshield system', 'Armor plates', 'Health regen'],
    correctAnswer: 1,
    explanation: 'The Overshield system gave players 100 extra HP to compensate for no building',
    difficulty: 'expert',
    category: 'seasons',
    points: 4,
    chapter: 3,
    season: 2,
    tags: ['overshield', 'no-building']
  },

  // LEGENDARY - 4-5 points
  {
    id: 'l1',
    question: 'How many days did Chapter 2 Season 1 last?',
    options: ['100 days', '115 days', '128 days', '140 days'],
    correctAnswer: 2,
    explanation: 'Chapter 2 Season 1 lasted exactly 128 days, the longest ever',
    difficulty: 'legendary',
    category: 'seasons',
    points: 5,
    chapter: 2,
    season: 1,
    tags: ['record', 'longest']
  },
  {
    id: 'l2',
    question: 'What was the name of the first major live event in Chapter 1 Season 4?',
    options: ['The Rocket Launch', 'The Blast Off', 'Lift Off', 'Sky Crack'],
    correctAnswer: 1,
    explanation: 'The Blast Off event launched a rocket that created the first rift crack in the sky',
    difficulty: 'legendary',
    category: 'events',
    points: 4,
    chapter: 1,
    season: 4,
    tags: ['blast-off', 'rocket', 'first-event']
  },
  {
    id: 'l3',
    question: 'What was the exact date range of the Travis Scott Astronomical concert?',
    options: ['April 20-22, 2020', 'April 23-25, 2020', 'April 27-29, 2020', 'May 1-3, 2020'],
    correctAnswer: 1,
    explanation: 'Astronomical ran April 23-25, 2020 with multiple showings',
    difficulty: 'legendary',
    category: 'events',
    points: 5,
    chapter: 2,
    season: 2,
    tags: ['travis-scott', 'concert', 'date']
  },
  {
    id: 'l4',
    question: 'How many Infinity Stones appeared as Mythic items in Chapter 2 Season 4?',
    options: ['4', '5', '6', 'All 6 but only 5 at a time'],
    correctAnswer: 2,
    explanation: 'All 6 Infinity Stones (Power, Mind, Time, Space, Soul, Reality) were available',
    difficulty: 'legendary',
    category: 'weapons',
    points: 5,
    chapter: 2,
    season: 4,
    tags: ['infinity-stones', 'marvel', 'mythic']
  },
  {
    id: 'l5',
    question: 'What was the theme of Chapter 6 Season 1?',
    options: ['Norse Mythology', 'Japanese Mythology (Oni Hunters)', 'Egyptian Mythology', 'Greek Mythology'],
    correctAnswer: 1,
    explanation: 'Chapter 6 Season 1 was titled "鬼 HUNTERS" focusing on Japanese demon hunters',
    difficulty: 'legendary',
    category: 'seasons',
    points: 4,
    chapter: 6,
    season: 1,
    tags: ['oni', 'japanese', 'hunters']
  },

  // IMPOSSIBLE - 5 points
  {
    id: 'i1',
    question: 'What was the exact duration of the Pre-Season before Season 1?',
    options: ['30 days', '44 days', '50 days', '60 days'],
    correctAnswer: 1,
    explanation: 'Pre-Season ran September 12 - October 25, 2017, exactly 44 days',
    difficulty: 'impossible',
    category: 'seasons',
    points: 5,
    chapter: 1,
    tags: ['pre-season', 'exact', 'trivia']
  },
  {
    id: 'i2',
    question: 'In Chapter 1 Season 7, what emerged from Polar Peak during the Ice Storm event?',
    options: ['A dragon', 'The Ice King', 'A giant ice golem', 'Kevin the Cube'],
    correctAnswer: 1,
    explanation: 'The Ice King emerged from the ice sphere and used cube fragments to create an ice storm',
    difficulty: 'impossible',
    category: 'events',
    points: 5,
    chapter: 1,
    season: 7,
    tags: ['ice-king', 'ice-storm', 'polar-peak']
  },
  {
    id: 'i3',
    question: 'What was the shortest seasonal event in Fortnite history?',
    options: ['Fortnite OG', 'Fortnite Remix', 'Galactic Battle (36 days)', 'Winterfest'],
    correctAnswer: 2,
    explanation: 'Galactic Battle lasted only 36 days (May 2 - June 7, 2025)',
    difficulty: 'impossible',
    category: 'seasons',
    points: 5,
    year: 2025,
    tags: ['shortest', 'galactic-battle', 'record']
  },
]

// ============================================================================
// TIMELINE QUESTIONS
// ============================================================================

export const timelineQuestions: TimelineQuestion[] = [
  {
    id: 't1',
    events: ['The End Event', 'Travis Scott Concert', 'Spider-Man Added', 'Building Removed'],
    correctOrder: [0, 1, 2, 3],
    difficulty: 'moderate',
    points: 4
  },
  {
    id: 't2',
    events: ['Kevin the Cube', 'Black Knight Released', 'Tilted Towers Added', 'Meteor Strike'],
    correctOrder: [1, 2, 3, 0],
    difficulty: 'expert',
    points: 5
  },
  {
    id: 't3',
    events: ['Fortnite World Cup', 'Marvel Season', 'Mandalorian Added', 'Chapter 3 Launch'],
    correctOrder: [0, 1, 2, 3],
    difficulty: 'moderate',
    points: 4
  },
]

// ============================================================================
// ERA BATTLE QUESTIONS
// ============================================================================

export const eraBattleQuestions: EraBattleQuestion[] = [
  {
    id: 'eb1',
    question: 'Which season had more licensed collaborations?',
    seasonA: { chapter: 2, season: 4, name: 'Nexus War (Marvel)' },
    seasonB: { chapter: 4, season: 1, name: 'New Beginning' },
    correctAnswer: 'A',
    explanation: 'Chapter 2 Season 4 was entirely Marvel-themed with 7+ Marvel skins',
    points: 3
  },
  {
    id: 'eb2',
    question: 'Which season lasted longer?',
    seasonA: { chapter: 2, season: 1, name: 'New World' },
    seasonB: { chapter: 1, season: 7, name: 'Ice Storm' },
    correctAnswer: 'A',
    explanation: 'Ch2S1 lasted 128 days vs Ch1S7\'s 84 days',
    points: 2
  },
  {
    id: 'eb3',
    question: 'Which season had a more controversial mechanic change?',
    seasonA: { chapter: 1, season: 9, name: 'B.R.U.T.E. Mechs' },
    seasonB: { chapter: 3, season: 2, name: 'No Building' },
    correctAnswer: 'tie',
    explanation: 'Both were extremely polarizing - mechs were hated, no-building split the community 50/50',
    points: 4
  },
]

// ============================================================================
// PERSONALITY QUIZ QUESTIONS
// ============================================================================

export const personalityQuestions: PersonalityQuestion[] = [
  {
    id: 'p1',
    question: 'What\'s your preferred playstyle?',
    options: [
      { text: 'Aggressive pushing', traits: { chapter1: 2, competitive: 3 } },
      { text: 'Strategic positioning', traits: { chapter2: 2, tactical: 3 } },
      { text: 'Creative building', traits: { chapter1: 3, builder: 3 } },
      { text: 'Stealth and patience', traits: { chapter3: 2, casual: 2 } },
    ]
  },
  {
    id: 'p2',
    question: 'Which collaboration excites you most?',
    options: [
      { text: 'Marvel/DC superheroes', traits: { chapter2: 3, collabs: 3 } },
      { text: 'Gaming legends (Kratos, Master Chief)', traits: { chapter4: 3, gaming: 3 } },
      { text: 'Music artists (Travis Scott, Eminem)', traits: { chapter2: 2, music: 3 } },
      { text: 'Original Fortnite skins only', traits: { chapter1: 3, og: 3 } },
    ]
  },
  {
    id: 'p3',
    question: 'How do you feel about building in Fortnite?',
    options: [
      { text: 'It\'s the core of the game!', traits: { chapter1: 3, builder: 3, competitive: 2 } },
      { text: 'I like it but it can be overwhelming', traits: { chapter2: 2, casual: 2 } },
      { text: 'Zero Build is the way', traits: { chapter3: 3, zerobuild: 3 } },
      { text: 'I adapt to whatever mode', traits: { flexible: 3, chapter4: 2 } },
    ]
  },
  {
    id: 'p4',
    question: 'What\'s your favorite type of POI?',
    options: [
      { text: 'Classic locations (Tilted, Pleasant)', traits: { chapter1: 3, og: 2, nostalgia: 3 } },
      { text: 'Themed locations (Agency, Stark Industries)', traits: { chapter2: 3, collabs: 2 } },
      { text: 'Natural biomes (jungle, snow)', traits: { chapter3: 2, explorer: 3 } },
      { text: 'Underground/unique terrain', traits: { chapter5: 3, explorer: 2 } },
    ]
  },
  {
    id: 'p5',
    question: 'What matters most to you in a Battle Pass?',
    options: [
      { text: 'Exclusive original skins', traits: { chapter1: 2, og: 3 } },
      { text: 'Licensed character skins', traits: { chapter2: 3, collabs: 3 } },
      { text: 'Emotes and dances', traits: { casual: 3, fun: 3 } },
      { text: 'Progressive/unlockable styles', traits: { grinder: 3, chapter2: 2 } },
    ]
  },
]

// ============================================================================
// SURVEY QUESTIONS
// ============================================================================

export const surveyQuestions: SurveyQuestion[] = [
  {
    id: 's1',
    type: 'rating',
    question: 'Rate the Marvel Season (Chapter 2 Season 4) Battle Pass',
    category: 'battle-pass'
  },
  {
    id: 's2',
    type: 'agree-disagree',
    question: 'Removing building in Chapter 3 Season 2 was a good decision',
    category: 'mechanics'
  },
  {
    id: 's3',
    type: 'choice',
    question: 'Best live event in Fortnite history?',
    options: ['The End', 'Travis Scott Concert', 'Galactus Event', 'Monster vs Mech', 'The Device'],
    category: 'events'
  },
  {
    id: 's4',
    type: 'ranking',
    question: 'Rank these Chapters from best to worst',
    options: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'],
    category: 'seasons'
  },
  {
    id: 's5',
    type: 'choice',
    question: 'Most iconic Fortnite skin of all time?',
    options: ['Black Knight', 'Renegade Raider', 'Peely', 'Drift', 'Midas', 'Spider-Man'],
    category: 'skins'
  },
  {
    id: 's6',
    type: 'agree-disagree',
    question: 'The B.R.U.T.E. mechs were the worst addition to Fortnite',
    category: 'weapons'
  },
  {
    id: 's7',
    type: 'rating',
    question: 'How would you rate Fortnite\'s collaboration strategy?',
    category: 'collabs'
  },
  {
    id: 's8',
    type: 'choice',
    question: 'Which collaboration franchise fits Fortnite best?',
    options: ['Marvel', 'DC', 'Star Wars', 'Gaming Legends', 'Music Artists'],
    category: 'collabs'
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsByDifficulty(difficulty: QuizQuestion['difficulty']): QuizQuestion[] {
  return quizQuestions.filter(q => q.difficulty === difficulty)
}

export function getQuestionsByCategory(category: QuizQuestion['category']): QuizQuestion[] {
  return quizQuestions.filter(q => q.category === category)
}

export function getQuestionsByChapter(chapter: number): QuizQuestion[] {
  return quizQuestions.filter(q => q.chapter === chapter)
}

export function getRandomQuestions(count: number, filters?: {
  difficulty?: QuizQuestion['difficulty']
  category?: QuizQuestion['category']
  chapter?: number
}): QuizQuestion[] {
  let pool = [...quizQuestions]
  
  if (filters?.difficulty) {
    pool = pool.filter(q => q.difficulty === filters.difficulty)
  }
  if (filters?.category) {
    pool = pool.filter(q => q.category === filters.category)
  }
  if (filters?.chapter) {
    pool = pool.filter(q => q.chapter === filters.chapter)
  }
  
  // Shuffle and take count
  const shuffled = pool.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function calculateRank(percentage: number): string {
  if (percentage >= 90) return 'Fortnite Historian'
  if (percentage >= 75) return 'Expert Player'
  if (percentage >= 60) return 'Veteran Player'
  if (percentage >= 40) return 'Experienced Player'
  return 'Casual Player'
}

export function getPersonalityResult(traits: Record<string, number>): {
  era: string
  description: string
  skins: string[]
} {
  const eraScores = {
    'Chapter 1 OG': (traits.chapter1 || 0) + (traits.og || 0) + (traits.nostalgia || 0),
    'Chapter 2 Collab Era': (traits.chapter2 || 0) + (traits.collabs || 0) + (traits.music || 0),
    'Chapter 3 Evolution': (traits.chapter3 || 0) + (traits.zerobuild || 0) + (traits.flexible || 0),
    'Modern Fortnite': (traits.chapter4 || 0) + (traits.chapter5 || 0) + (traits.gaming || 0),
  }
  
  const topEra = Object.entries(eraScores).sort((a, b) => b[1] - a[1])[0]
  
  const descriptions: Record<string, { desc: string; skins: string[] }> = {
    'Chapter 1 OG': {
      desc: 'You\'re a true OG who values the original Fortnite experience. Building, classic POIs, and earning rare skins through grinding is your jam.',
      skins: ['Black Knight', 'Renegade Raider', 'Omega', 'Drift']
    },
    'Chapter 2 Collab Era': {
      desc: 'You love when Fortnite brings in your favorite characters from other franchises. The Marvel season was peak Fortnite for you.',
      skins: ['Iron Man', 'Mandalorian', 'Travis Scott', 'Deadpool']
    },
    'Chapter 3 Evolution': {
      desc: 'You appreciate how Fortnite evolved and aren\'t afraid of change. Zero Build mode and new mechanics keep the game fresh for you.',
      skins: ['Spider-Man', 'The Foundation', 'Prowler', 'Evie']
    },
    'Modern Fortnite': {
      desc: 'You\'re all about the latest and greatest. Gaming legends, weapon mods, and the newest content is what keeps you playing.',
      skins: ['Geralt', 'Kratos', 'Doom Slayer', 'Peter Griffin']
    },
  }
  
  return {
    era: topEra[0],
    description: descriptions[topEra[0]].desc,
    skins: descriptions[topEra[0]].skins
  }
}
