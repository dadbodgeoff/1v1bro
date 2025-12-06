# Player Stats & Leaderboards - Design Document

## Overview

This document outlines the technical design for the player statistics and leaderboard system. The implementation follows enterprise patterns established in the codebase with clear separation of concerns.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Layer                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Stats Router   │  │ Leaderboard     │  │  Profile        │             │
│  │  /api/v1/stats  │  │ Router          │  │  Router         │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────┘
            │                     │                     │
┌───────────┼─────────────────────┼─────────────────────┼─────────────────────┐
│           ▼                     ▼                     ▼                     │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                      Stats Service                               │       │
│  │  - update_trivia_stats()    - update_combat_stats()             │       │
│  │  - update_streak()          - get_user_stats()                  │       │
│  │  - compute_derived_stats()  - aggregate_game_stats()            │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                              Service Layer                                  │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                   Leaderboard Service                            │       │
│  │  - get_leaderboard()        - get_user_rank()                   │       │
│  │  - get_all_ranks()          - validate_eligibility()            │       │
│  └─────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
            │                     │
┌───────────┼─────────────────────┼───────────────────────────────────────────┐
│           ▼                     ▼                                           │
│  ┌─────────────────┐  ┌─────────────────┐                                  │
│  │ Stats Repository│  │ Leaderboard     │                                  │
│  │                 │  │ Repository      │                                  │
│  └────────┬────────┘  └────────┬────────┘                                  │
│           │                     │              Repository Layer             │
└───────────┼─────────────────────┼───────────────────────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Supabase (PostgreSQL)                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  user_profiles  │  │     games       │  │    lobbies      │             │
│  │  (extended)     │  │  (extended)     │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```


## Project Structure (New Files)

```
backend/app/
├── api/v1/
│   ├── stats.py                    # Stats API endpoints
│   └── leaderboards.py             # Leaderboard API endpoints
│
├── schemas/
│   ├── stats.py                    # Stats Pydantic models
│   └── leaderboard.py              # Leaderboard Pydantic models
│
├── services/
│   ├── stats_service.py            # Stats business logic
│   └── leaderboard_service.py      # Leaderboard business logic
│
├── database/
│   ├── repositories/
│   │   ├── stats_repo.py           # Stats data access
│   │   └── leaderboard_repo.py     # Leaderboard queries
│   │
│   └── migrations/
│       └── 002_player_stats.sql    # Schema migration
│
└── utils/
    └── combat_tracker.py           # In-memory combat event tracking
```

## Data Structures

### Stats Schemas (schemas/stats.py)

```python
class TriviaStats(BaseSchema):
    """Trivia-related statistics."""
    total_questions_answered: int = 0
    total_correct_answers: int = 0
    total_answer_time_ms: int = 0
    fastest_answer_ms: Optional[int] = None
    # Computed
    answer_rate: float = 0.0
    avg_answer_time_ms: float = 0.0

class CombatStats(BaseSchema):
    """Combat-related statistics."""
    total_kills: int = 0
    total_deaths: int = 0
    total_damage_dealt: int = 0
    total_damage_taken: int = 0
    shots_fired: int = 0
    shots_hit: int = 0
    # Computed
    kd_ratio: float = 0.0
    accuracy_pct: float = 0.0

class StreakStats(BaseSchema):
    """Win streak statistics."""
    current_win_streak: int = 0
    best_win_streak: int = 0

class PlayerStats(BaseSchema):
    """Complete player statistics."""
    user_id: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    
    # Core stats (existing)
    games_played: int = 0
    games_won: int = 0
    total_score: int = 0
    win_rate: float = 0.0
    
    # Extended stats
    trivia: TriviaStats
    combat: CombatStats
    streaks: StreakStats
    total_powerups_collected: int = 0

class GameCombatSummary(BaseSchema):
    """Combat stats for a single game."""
    kills: int = 0
    deaths: int = 0
    damage_dealt: int = 0
    damage_taken: int = 0
    shots_fired: int = 0
    shots_hit: int = 0
    powerups_collected: int = 0

class StatsUpdateRequest(BaseSchema):
    """Request to update player stats."""
    trivia_delta: Optional[TriviaStatsDelta] = None
    combat_delta: Optional[CombatStatsDelta] = None
    game_won: Optional[bool] = None
    powerups_collected: int = 0
```

### Leaderboard Schemas (schemas/leaderboard.py)

```python
class LeaderboardCategory(str, Enum):
    """Available leaderboard categories."""
    WINS = "wins"
    WIN_RATE = "win_rate"
    TOTAL_SCORE = "total_score"
    KILLS = "kills"
    KD_RATIO = "kd_ratio"
    ACCURACY = "accuracy"
    FASTEST_THINKER = "fastest_thinker"
    ANSWER_RATE = "answer_rate"
    WIN_STREAK = "win_streak"

class LeaderboardEntry(BaseSchema):
    """Single entry in a leaderboard."""
    rank: int
    user_id: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    stat_value: float
    secondary_stat: Optional[float] = None
    secondary_label: Optional[str] = None

class LeaderboardResponse(BaseSchema):
    """Leaderboard API response."""
    category: LeaderboardCategory
    entries: List[LeaderboardEntry]
    total_eligible: int
    page: int
    page_size: int
    minimum_requirement: Optional[str] = None

class UserRankResponse(BaseSchema):
    """User's rank in a specific category."""
    category: LeaderboardCategory
    rank: Optional[int]  # None if not eligible
    stat_value: float
    eligible: bool
    requirement_met: bool
    requirement: Optional[str] = None
```


## Core Components

### StatsService (services/stats_service.py)

```python
class StatsService(BaseService):
    """Service for player statistics operations."""
    
    def __init__(self, client: Client):
        super().__init__(client)
        self.stats_repo = StatsRepository(client)
    
    async def get_user_stats(self, user_id: str) -> PlayerStats:
        """Get complete stats for a user with computed fields."""
        raw = await self.stats_repo.get_raw_stats(user_id)
        return self._compute_derived_stats(raw)
    
    async def update_game_stats(
        self,
        user_id: str,
        game_won: bool,
        trivia_stats: TriviaStatsDelta,
        combat_stats: GameCombatSummary,
    ) -> PlayerStats:
        """Update all stats after a game ends."""
        # Atomic transaction for all updates
        async with self.stats_repo.transaction():
            await self.stats_repo.increment_trivia_stats(user_id, trivia_stats)
            await self.stats_repo.increment_combat_stats(user_id, combat_stats)
            await self._update_streak(user_id, game_won)
            await self._update_fastest_answer(user_id, trivia_stats.fastest_in_game)
        
        return await self.get_user_stats(user_id)
    
    async def _update_streak(self, user_id: str, won: bool) -> None:
        """Update win streak based on game result."""
        if won:
            await self.stats_repo.increment_streak(user_id)
        else:
            await self.stats_repo.reset_streak(user_id)
    
    def _compute_derived_stats(self, raw: dict) -> PlayerStats:
        """Compute derived statistics from raw values."""
        games_played = raw.get("games_played", 0)
        games_won = raw.get("games_won", 0)
        
        # Win rate
        win_rate = (games_won / games_played * 100) if games_played > 0 else 0.0
        
        # K/D ratio
        kills = raw.get("total_kills", 0)
        deaths = raw.get("total_deaths", 0)
        kd_ratio = kills if deaths == 0 else (kills / deaths)
        
        # Accuracy
        shots_fired = raw.get("shots_fired", 0)
        shots_hit = raw.get("shots_hit", 0)
        accuracy = (shots_hit / shots_fired * 100) if shots_fired > 0 else 0.0
        
        # Answer stats
        correct = raw.get("total_correct_answers", 0)
        total_q = raw.get("total_questions_answered", 0)
        total_time = raw.get("total_answer_time_ms", 0)
        
        answer_rate = (correct / total_q * 100) if total_q > 0 else 0.0
        avg_time = (total_time / correct) if correct > 0 else 0.0
        
        return PlayerStats(
            user_id=raw["id"],
            display_name=raw.get("display_name"),
            avatar_url=raw.get("avatar_url"),
            games_played=games_played,
            games_won=games_won,
            total_score=raw.get("total_score", 0),
            win_rate=round(win_rate, 2),
            trivia=TriviaStats(
                total_questions_answered=total_q,
                total_correct_answers=correct,
                total_answer_time_ms=total_time,
                fastest_answer_ms=raw.get("fastest_answer_ms"),
                answer_rate=round(answer_rate, 2),
                avg_answer_time_ms=round(avg_time, 2),
            ),
            combat=CombatStats(
                total_kills=kills,
                total_deaths=deaths,
                total_damage_dealt=raw.get("total_damage_dealt", 0),
                total_damage_taken=raw.get("total_damage_taken", 0),
                shots_fired=shots_fired,
                shots_hit=shots_hit,
                kd_ratio=round(kd_ratio, 2),
                accuracy_pct=round(accuracy, 2),
            ),
            streaks=StreakStats(
                current_win_streak=raw.get("current_win_streak", 0),
                best_win_streak=raw.get("best_win_streak", 0),
            ),
            total_powerups_collected=raw.get("total_powerups_collected", 0),
        )
```

### LeaderboardService (services/leaderboard_service.py)

```python
class LeaderboardService(BaseService):
    """Service for leaderboard operations."""
    
    # Minimum requirements for eligibility
    REQUIREMENTS = {
        LeaderboardCategory.WIN_RATE: ("games_played", 10),
        LeaderboardCategory.KD_RATIO: ("total_deaths", 10),
        LeaderboardCategory.ACCURACY: ("shots_fired", 100),
        LeaderboardCategory.FASTEST_THINKER: ("total_correct_answers", 50),
        LeaderboardCategory.ANSWER_RATE: ("total_questions_answered", 100),
    }
    
    def __init__(self, client: Client):
        super().__init__(client)
        self.leaderboard_repo = LeaderboardRepository(client)
    
    async def get_leaderboard(
        self,
        category: LeaderboardCategory,
        limit: int = 10,
        offset: int = 0,
    ) -> LeaderboardResponse:
        """Get leaderboard for a category."""
        requirement = self.REQUIREMENTS.get(category)
        
        entries = await self.leaderboard_repo.query_leaderboard(
            category=category,
            limit=limit,
            offset=offset,
            min_requirement=requirement,
        )
        
        total = await self.leaderboard_repo.count_eligible(category, requirement)
        
        return LeaderboardResponse(
            category=category,
            entries=entries,
            total_eligible=total,
            page=offset // limit + 1,
            page_size=limit,
            minimum_requirement=self._format_requirement(requirement),
        )
    
    async def get_user_rank(
        self,
        user_id: str,
        category: LeaderboardCategory,
    ) -> UserRankResponse:
        """Get a user's rank in a specific category."""
        requirement = self.REQUIREMENTS.get(category)
        
        user_stats = await self.leaderboard_repo.get_user_stat(user_id, category)
        eligible = self._check_eligibility(user_stats, requirement)
        
        rank = None
        if eligible:
            rank = await self.leaderboard_repo.get_rank(user_id, category, requirement)
        
        return UserRankResponse(
            category=category,
            rank=rank,
            stat_value=user_stats.get("value", 0),
            eligible=eligible,
            requirement_met=eligible,
            requirement=self._format_requirement(requirement),
        )
```


### CombatTracker (utils/combat_tracker.py)

```python
@dataclass
class CombatEvent:
    """Base combat event."""
    timestamp: int
    player_id: str

@dataclass
class KillEvent(CombatEvent):
    """Player killed another player."""
    victim_id: str
    weapon: str = "projectile"

@dataclass
class DamageEvent(CombatEvent):
    """Player dealt damage."""
    target_id: str
    amount: int
    source: str  # "projectile", "trap", "hazard"

@dataclass
class ShotEvent(CombatEvent):
    """Player fired a shot."""
    hit: bool

class CombatTracker:
    """Tracks combat events during a game session."""
    
    # lobby_id -> player_id -> events
    _sessions: Dict[str, Dict[str, List[CombatEvent]]] = {}
    
    @classmethod
    def initialize(cls, lobby_id: str, player_ids: List[str]) -> None:
        """Initialize tracking for a new game."""
        cls._sessions[lobby_id] = {pid: [] for pid in player_ids}
    
    @classmethod
    def record_kill(cls, lobby_id: str, killer_id: str, victim_id: str) -> None:
        """Record a kill event."""
        if lobby_id not in cls._sessions:
            return
        cls._sessions[lobby_id][killer_id].append(
            KillEvent(timestamp=get_timestamp_ms(), player_id=killer_id, victim_id=victim_id)
        )
    
    @classmethod
    def record_damage(cls, lobby_id: str, dealer_id: str, target_id: str, amount: int, source: str) -> None:
        """Record damage dealt."""
        if lobby_id not in cls._sessions:
            return
        cls._sessions[lobby_id][dealer_id].append(
            DamageEvent(timestamp=get_timestamp_ms(), player_id=dealer_id, target_id=target_id, amount=amount, source=source)
        )
    
    @classmethod
    def record_shot(cls, lobby_id: str, player_id: str, hit: bool) -> None:
        """Record a shot fired."""
        if lobby_id not in cls._sessions:
            return
        cls._sessions[lobby_id][player_id].append(
            ShotEvent(timestamp=get_timestamp_ms(), player_id=player_id, hit=hit)
        )
    
    @classmethod
    def get_summary(cls, lobby_id: str, player_id: str) -> GameCombatSummary:
        """Get combat summary for a player in a game."""
        if lobby_id not in cls._sessions or player_id not in cls._sessions[lobby_id]:
            return GameCombatSummary()
        
        events = cls._sessions[lobby_id][player_id]
        
        kills = sum(1 for e in events if isinstance(e, KillEvent))
        damage_dealt = sum(e.amount for e in events if isinstance(e, DamageEvent))
        shots_fired = sum(1 for e in events if isinstance(e, ShotEvent))
        shots_hit = sum(1 for e in events if isinstance(e, ShotEvent) and e.hit)
        
        # Deaths are counted from other players' kill events
        deaths = 0
        for pid, pevents in cls._sessions[lobby_id].items():
            if pid != player_id:
                deaths += sum(1 for e in pevents if isinstance(e, KillEvent) and e.victim_id == player_id)
        
        # Damage taken from other players
        damage_taken = 0
        for pid, pevents in cls._sessions[lobby_id].items():
            if pid != player_id:
                damage_taken += sum(e.amount for e in pevents if isinstance(e, DamageEvent) and e.target_id == player_id)
        
        return GameCombatSummary(
            kills=kills,
            deaths=deaths,
            damage_dealt=damage_dealt,
            damage_taken=damage_taken,
            shots_fired=shots_fired,
            shots_hit=shots_hit,
        )
    
    @classmethod
    def cleanup(cls, lobby_id: str) -> None:
        """Clean up tracking data for a completed game."""
        cls._sessions.pop(lobby_id, None)
```

## Database Migration

### 002_player_stats.sql

```sql
-- Player Stats Extension Migration
-- Adds comprehensive statistics tracking to user_profiles

-- ============================================
-- Add Trivia Statistics Columns
-- ============================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_questions_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_correct_answers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_answer_time_ms BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS fastest_answer_ms INTEGER;

-- ============================================
-- Add Combat Statistics Columns
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS total_kills INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deaths INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_damage_dealt INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_damage_taken INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shots_fired INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shots_hit INTEGER DEFAULT 0;

-- ============================================
-- Add Streak Statistics Columns
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS current_win_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_win_streak INTEGER DEFAULT 0;

-- ============================================
-- Add Collection Statistics Columns
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS total_powerups_collected INTEGER DEFAULT 0;

-- ============================================
-- Add Combat Stats to Games Table
-- ============================================
ALTER TABLE games
ADD COLUMN IF NOT EXISTS player1_combat_stats JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS player2_combat_stats JSONB DEFAULT '{}';

-- ============================================
-- Leaderboard Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_games_won ON user_profiles(games_won DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_kills ON user_profiles(total_kills DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_best_streak ON user_profiles(best_win_streak DESC);

-- Composite indexes for ratio calculations with minimum requirements
CREATE INDEX IF NOT EXISTS idx_user_profiles_win_rate 
ON user_profiles(games_won DESC, games_played) 
WHERE games_played >= 10;

CREATE INDEX IF NOT EXISTS idx_user_profiles_accuracy 
ON user_profiles(shots_hit DESC, shots_fired) 
WHERE shots_fired >= 100;

CREATE INDEX IF NOT EXISTS idx_user_profiles_kd 
ON user_profiles(total_kills DESC, total_deaths) 
WHERE total_deaths >= 10;

-- ============================================
-- Function: Atomic Stat Increment
-- ============================================
CREATE OR REPLACE FUNCTION increment_player_stats(
    p_user_id UUID,
    p_games_played_delta INTEGER DEFAULT 0,
    p_games_won_delta INTEGER DEFAULT 0,
    p_score_delta INTEGER DEFAULT 0,
    p_questions_delta INTEGER DEFAULT 0,
    p_correct_delta INTEGER DEFAULT 0,
    p_answer_time_delta BIGINT DEFAULT 0,
    p_kills_delta INTEGER DEFAULT 0,
    p_deaths_delta INTEGER DEFAULT 0,
    p_damage_dealt_delta INTEGER DEFAULT 0,
    p_damage_taken_delta INTEGER DEFAULT 0,
    p_shots_fired_delta INTEGER DEFAULT 0,
    p_shots_hit_delta INTEGER DEFAULT 0,
    p_powerups_delta INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles SET
        games_played = games_played + p_games_played_delta,
        games_won = games_won + p_games_won_delta,
        total_score = total_score + p_score_delta,
        total_questions_answered = total_questions_answered + p_questions_delta,
        total_correct_answers = total_correct_answers + p_correct_delta,
        total_answer_time_ms = total_answer_time_ms + p_answer_time_delta,
        total_kills = total_kills + p_kills_delta,
        total_deaths = total_deaths + p_deaths_delta,
        total_damage_dealt = total_damage_dealt + p_damage_dealt_delta,
        total_damage_taken = total_damage_taken + p_damage_taken_delta,
        shots_fired = shots_fired + p_shots_fired_delta,
        shots_hit = shots_hit + p_shots_hit_delta,
        total_powerups_collected = total_powerups_collected + p_powerups_delta,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Update Win Streak
-- ============================================
CREATE OR REPLACE FUNCTION update_win_streak(p_user_id UUID, p_won BOOLEAN)
RETURNS void AS $$
BEGIN
    IF p_won THEN
        UPDATE user_profiles SET
            current_win_streak = current_win_streak + 1,
            best_win_streak = GREATEST(best_win_streak, current_win_streak + 1),
            updated_at = NOW()
        WHERE id = p_user_id;
    ELSE
        UPDATE user_profiles SET
            current_win_streak = 0,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Update Fastest Answer
-- ============================================
CREATE OR REPLACE FUNCTION update_fastest_answer(p_user_id UUID, p_time_ms INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles SET
        fastest_answer_ms = LEAST(COALESCE(fastest_answer_ms, p_time_ms), p_time_ms),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```


## Leaderboard Query Patterns

### Wins Leaderboard (Simple)
```sql
SELECT 
    ROW_NUMBER() OVER (ORDER BY games_won DESC) as rank,
    id as user_id,
    display_name,
    avatar_url,
    games_won as stat_value,
    games_played as secondary_stat
FROM user_profiles
WHERE games_played > 0
ORDER BY games_won DESC
LIMIT $1 OFFSET $2;
```

### Win Rate Leaderboard (Computed with Minimum)
```sql
SELECT 
    ROW_NUMBER() OVER (ORDER BY (games_won::float / games_played) DESC) as rank,
    id as user_id,
    display_name,
    avatar_url,
    ROUND((games_won::float / games_played * 100)::numeric, 2) as stat_value,
    games_played as secondary_stat
FROM user_profiles
WHERE games_played >= 10
ORDER BY (games_won::float / games_played) DESC
LIMIT $1 OFFSET $2;
```

### K/D Ratio Leaderboard
```sql
SELECT 
    ROW_NUMBER() OVER (ORDER BY 
        CASE WHEN total_deaths = 0 THEN total_kills 
             ELSE total_kills::float / total_deaths END DESC
    ) as rank,
    id as user_id,
    display_name,
    avatar_url,
    ROUND(
        CASE WHEN total_deaths = 0 THEN total_kills 
             ELSE total_kills::float / total_deaths END::numeric, 2
    ) as stat_value,
    total_kills as secondary_stat
FROM user_profiles
WHERE total_deaths >= 10
ORDER BY stat_value DESC
LIMIT $1 OFFSET $2;
```

### Fastest Thinker Leaderboard (ASC ordering)
```sql
SELECT 
    ROW_NUMBER() OVER (ORDER BY 
        (total_answer_time_ms::float / total_correct_answers) ASC
    ) as rank,
    id as user_id,
    display_name,
    avatar_url,
    ROUND((total_answer_time_ms::float / total_correct_answers)::numeric, 0) as stat_value,
    total_correct_answers as secondary_stat
FROM user_profiles
WHERE total_correct_answers >= 50
ORDER BY stat_value ASC
LIMIT $1 OFFSET $2;
```

## API Endpoints Design

### GET /api/v1/stats/me
Returns current user's complete statistics.

**Response:**
```json
{
  "user_id": "uuid",
  "display_name": "Player1",
  "games_played": 50,
  "games_won": 30,
  "total_score": 45000,
  "win_rate": 60.0,
  "trivia": {
    "total_questions_answered": 500,
    "total_correct_answers": 400,
    "avg_answer_time_ms": 2500,
    "fastest_answer_ms": 800,
    "answer_rate": 80.0
  },
  "combat": {
    "total_kills": 150,
    "total_deaths": 100,
    "kd_ratio": 1.5,
    "shots_fired": 1000,
    "shots_hit": 650,
    "accuracy_pct": 65.0
  },
  "streaks": {
    "current_win_streak": 3,
    "best_win_streak": 8
  },
  "ranks": {
    "wins": 15,
    "win_rate": 42,
    "kills": 28,
    "accuracy": null
  }
}
```

### GET /api/v1/leaderboards/{category}
Returns paginated leaderboard for a category.

**Query Params:**
- `limit` (int, default 10, max 100)
- `offset` (int, default 0)

**Response:**
```json
{
  "category": "win_rate",
  "entries": [
    {
      "rank": 1,
      "user_id": "uuid",
      "display_name": "TopPlayer",
      "avatar_url": "https://...",
      "stat_value": 85.5,
      "secondary_stat": 100,
      "secondary_label": "games played"
    }
  ],
  "total_eligible": 1250,
  "page": 1,
  "page_size": 10,
  "minimum_requirement": "10+ games played"
}
```

## Integration with GameService

Update `end_game()` in GameService to aggregate stats:

```python
async def end_game(self, lobby_id: str) -> GameResult:
    # ... existing code ...
    
    # Aggregate trivia stats from answers_data
    for player_id, answers in answers_data.items():
        trivia_delta = self._aggregate_trivia_stats(answers)
        combat_summary = CombatTracker.get_summary(lobby_id, player_id)
        
        await self.stats_service.update_game_stats(
            user_id=player_id,
            game_won=(player_id == winner_id),
            trivia_stats=trivia_delta,
            combat_stats=combat_summary,
        )
    
    # Store combat summaries in game record
    game_record = await self.game_repo.create_game(
        # ... existing params ...
        player1_combat_stats=CombatTracker.get_summary(lobby_id, session.player1_id).model_dump(),
        player2_combat_stats=CombatTracker.get_summary(lobby_id, session.player2_id).model_dump(),
    )
    
    # Cleanup combat tracker
    CombatTracker.cleanup(lobby_id)
    
    return result

def _aggregate_trivia_stats(self, answers: List[dict]) -> TriviaStatsDelta:
    """Aggregate trivia stats from game answers."""
    total_questions = len(answers)
    correct_answers = sum(1 for a in answers if a.get("is_correct"))
    correct_time = sum(a.get("time_ms", 0) for a in answers if a.get("is_correct"))
    fastest = min((a.get("time_ms") for a in answers if a.get("is_correct")), default=None)
    
    return TriviaStatsDelta(
        questions_answered=total_questions,
        correct_answers=correct_answers,
        answer_time_ms=correct_time,
        fastest_in_game=fastest,
    )
```

## File Size Targets

| File | Target Lines |
|------|--------------|
| stats_service.py | <250 |
| leaderboard_service.py | <200 |
| stats_repo.py | <200 |
| leaderboard_repo.py | <250 |
| combat_tracker.py | <150 |
| schemas/stats.py | <150 |
| schemas/leaderboard.py | <100 |
| api/v1/stats.py | <100 |
| api/v1/leaderboards.py | <100 |
| 002_player_stats.sql | <150 |
