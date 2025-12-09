# Design Document

## Overview

The Match Auto-End and Recap System enhances the post-match experience by automatically terminating matches after question 15 and displaying a comprehensive recap screen. This design extends the existing `GameService`, `QuizHandler`, and `Results` page to collect, persist, and display detailed match statistics including XP breakdown, tier progress, question accuracy, and combat performance.

The system follows a server-authoritative model where all statistics are calculated and validated on the backend before being sent to clients via WebSocket. The recap data is persisted as JSONB in the `games` table for match history viewing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend Services                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ QuizHandler  │───▶│ GameService  │───▶│ BattlePassService    │  │
│  │              │    │              │    │                      │  │
│  │ Q15 Answer   │    │ end_game()   │    │ award_match_xp()     │  │
│  │ Detection    │    │ Build Recap  │    │ Get Tier Progress    │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                   │                      │                │
│         │                   ▼                      │                │
│         │           ┌──────────────┐               │                │
│         │           │CombatTracker │               │                │
│         │           │              │               │                │
│         │           │ Get K/D,     │               │                │
│         │           │ Streaks,     │               │                │
│         │           │ Shot Stats   │               │                │
│         │           └──────────────┘               │                │
│         │                   │                      │                │
│         ▼                   ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    RecapBuilder                              │   │
│  │                                                              │   │
│  │  - Aggregate question stats from session                     │   │
│  │  - Aggregate combat stats from CombatTracker                 │   │
│  │  - Include XP breakdown from BattlePassService               │   │
│  │  - Build RecapPayload for both players                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Database (games table)                    │   │
│  │                                                              │   │
│  │  recap_data: JSONB column storing full RecapPayload          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼ WebSocket (game_end event)
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │useQuizEvents │───▶│ gameStore    │───▶│ Results Page         │  │
│  │              │    │              │    │                      │  │
│  │ game_end     │    │ setRecap()   │    │ RecapDisplay         │  │
│  │ handler      │    │              │    │ XPBreakdown          │  │
│  └──────────────┘    └──────────────┘    │ TierProgress         │  │
│                                          │ QuestionStats        │  │
│                                          │ CombatStats          │  │
│                                          │ OpponentComparison   │  │
│                                          └──────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. RecapBuilder (New)

Location: `backend/app/services/recap_builder.py`

```python
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class XPBreakdown:
    total: int
    base_xp: int
    kill_bonus: int
    streak_bonus: int
    duration_bonus: int

@dataclass
class TierProgress:
    previous_tier: int
    new_tier: int
    tier_advanced: bool
    current_xp: int
    xp_to_next_tier: int
    new_claimable_rewards: List[int]

@dataclass
class QuestionStats:
    correct_count: int
    total_questions: int
    accuracy_percent: float
    avg_answer_time_ms: int
    fastest_answer_ms: int

@dataclass
class CombatStats:
    kills: int
    deaths: int
    kd_ratio: float
    max_streak: int
    shots_fired: int
    shots_hit: int
    shot_accuracy: float

@dataclass
class OpponentData:
    id: str
    display_name: str
    avatar_url: Optional[str]
    final_score: int
    accuracy_percent: float
    kd_ratio: float

@dataclass
class RecapPayload:
    winner_id: Optional[str]
    is_tie: bool
    won_by_time: bool
    xp_breakdown: XPBreakdown
    tier_progress: TierProgress
    question_stats: QuestionStats
    combat_stats: CombatStats
    opponent: OpponentData

class RecapBuilder:
    """Builds comprehensive recap payloads from match data."""
    
    def build_recap(
        self,
        player_id: str,
        session: GameSession,
        xp_result: XPAwardResult,
        combat_tracker_stats: Dict,
        opponent_id: str,
        opponent_name: str,
        opponent_avatar: Optional[str],
    ) -> RecapPayload:
        """Build complete recap for a single player."""
        pass
    
    def calculate_question_stats(
        self,
        session: GameSession,
        player_id: str,
    ) -> QuestionStats:
        """Calculate question accuracy and timing stats."""
        pass
    
    def calculate_combat_stats(
        self,
        combat_data: Dict,
    ) -> CombatStats:
        """Calculate K/D ratio and combat metrics."""
        pass
```

#### 2. GameService Enhancement

Location: `backend/app/services/game/game_service.py`

```python
async def end_game(self, lobby_id: str) -> GameResult:
    """
    End game and persist results with full recap data.
    
    Enhanced to:
    1. Calculate question stats from session
    2. Get combat stats from CombatTracker
    3. Build RecapPayload for both players
    4. Persist recap_data to games table
    5. Include recap in GameResult for WebSocket broadcast
    """
    # ... existing code ...
    
    # NEW: Build recap for both players
    recap_builder = RecapBuilder()
    
    player1_recap = recap_builder.build_recap(
        player_id=player1_id,
        session=session,
        xp_result=xp_results.get(player1_id),
        combat_tracker_stats=combat_stats.get(player1_id, {}),
        opponent_id=player2_id,
        opponent_name=player2_name,
        opponent_avatar=player2_avatar,
    )
    
    player2_recap = recap_builder.build_recap(
        player_id=player2_id,
        session=session,
        xp_result=xp_results.get(player2_id),
        combat_tracker_stats=combat_stats.get(player2_id, {}),
        opponent_id=player1_id,
        opponent_name=player1_name,
        opponent_avatar=player1_avatar,
    )
    
    # Persist recap data
    await self.persistence.save_recap_data(
        game_id=result.game_id,
        player1_recap=player1_recap,
        player2_recap=player2_recap,
    )
    
    # Attach recaps to result for WebSocket broadcast
    result.recaps = {
        player1_id: player1_recap,
        player2_id: player2_recap,
    }
    
    return result
```

#### 3. QuizHandler Enhancement

Location: `backend/app/websocket/handlers/quiz.py`

```python
async def process_round_end(self, lobby_code: str, lobby_id: str) -> None:
    """Process end of round with final question detection."""
    # ... existing code ...
    
    # NEW: Add is_final_question flag
    is_final = session.current_question == len(session.questions)
    
    await self.manager.broadcast_to_lobby(
        lobby_code,
        build_round_result(
            q_num=result["q_num"],
            correct_answer=result["correct_answer"],
            scores=result["scores"],
            answers=result["answers"],
            total_scores=result["total_scores"],
            rewards=rewards,
            is_final_question=is_final,  # NEW
        )
    )
```

#### 4. WebSocket Events Enhancement

Location: `backend/app/websocket/events.py`

```python
def build_game_end(
    winner_id: Optional[str],
    final_scores: Dict[str, int],
    is_tie: bool = False,
    total_times: Optional[Dict[str, int]] = None,
    won_by_time: bool = False,
    recaps: Optional[Dict[str, Dict]] = None,  # NEW
) -> Dict:
    """Build game_end message with full recap data."""
    return build_message(WSEventType.GAME_END, {
        "winner_id": winner_id,
        "final_scores": final_scores,
        "is_tie": is_tie,
        "total_times": total_times or {},
        "won_by_time": won_by_time,
        "recaps": recaps or {},  # NEW: Per-player recap payloads
    })
```

### Frontend Components

#### 1. Enhanced Results Page

Location: `frontend/src/pages/Results.tsx`

```typescript
export function Results() {
  const { recap } = useGameStore()
  
  if (!recap) {
    return <LoadingSpinner />
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      {/* Winner Announcement */}
      <WinnerAnnouncement 
        winnerId={recap.winner_id}
        isTie={recap.is_tie}
        wonByTime={recap.won_by_time}
      />
      
      {/* Score Comparison */}
      <ScoreComparison 
        localScore={recap.question_stats.correct_count}
        opponentScore={recap.opponent.final_score}
        localName={localPlayerName}
        opponentName={recap.opponent.display_name}
      />
      
      {/* XP Breakdown */}
      <XPBreakdownCard xp={recap.xp_breakdown} />
      
      {/* Tier Progress */}
      <TierProgressCard progress={recap.tier_progress} />
      
      {/* Question Stats */}
      <QuestionStatsCard stats={recap.question_stats} />
      
      {/* Combat Stats */}
      <CombatStatsCard stats={recap.combat_stats} />
      
      {/* Navigation */}
      <NavigationButtons />
    </div>
  )
}
```

#### 2. XPBreakdownCard Component

Location: `frontend/src/components/recap/XPBreakdownCard.tsx`

```typescript
interface XPBreakdownCardProps {
  xp: {
    total: number
    base_xp: number
    kill_bonus: number
    streak_bonus: number
    duration_bonus: number
  }
}

export function XPBreakdownCard({ xp }: XPBreakdownCardProps) {
  const [displayTotal, setDisplayTotal] = useState(0)
  
  // Animate XP counter
  useEffect(() => {
    const duration = 1500 // 1.5 seconds
    const steps = 60
    const increment = xp.total / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= xp.total) {
        setDisplayTotal(xp.total)
        clearInterval(timer)
      } else {
        setDisplayTotal(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [xp.total])
  
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">XP Earned</h3>
      
      <div className="text-4xl font-bold text-yellow-400 mb-4">
        +{displayTotal} XP
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Base XP</span>
          <span className="text-white">+{xp.base_xp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Kill Bonus</span>
          <span className="text-white">+{xp.kill_bonus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Streak Bonus</span>
          <span className="text-white">+{xp.streak_bonus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Duration Bonus</span>
          <span className="text-white">+{xp.duration_bonus}</span>
        </div>
      </div>
    </div>
  )
}
```

#### 3. TierProgressCard Component

Location: `frontend/src/components/recap/TierProgressCard.tsx`

```typescript
interface TierProgressCardProps {
  progress: {
    previous_tier: number
    new_tier: number
    tier_advanced: boolean
    current_xp: number
    xp_to_next_tier: number
    new_claimable_rewards: number[]
  }
}

export function TierProgressCard({ progress }: TierProgressCardProps) {
  const progressPercent = (progress.current_xp / progress.xp_to_next_tier) * 100
  
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Tier Progress</h3>
      
      {progress.tier_advanced && (
        <div className="mb-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/50">
          <span className="text-yellow-400 font-bold">
            🎉 Tier Up! {progress.previous_tier} → {progress.new_tier}
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-4 mb-4">
        <div className="text-3xl font-bold text-indigo-400">
          Tier {progress.new_tier}
        </div>
      </div>
      
      <div className="mb-2">
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      
      <div className="text-sm text-slate-400">
        {progress.current_xp} / {progress.xp_to_next_tier} XP to next tier
      </div>
      
      {progress.new_claimable_rewards.length > 0 && (
        <div className="mt-4 text-sm text-green-400">
          {progress.new_claimable_rewards.length} new rewards to claim!
        </div>
      )}
    </div>
  )
}
```

#### 4. QuestionStatsCard Component

Location: `frontend/src/components/recap/QuestionStatsCard.tsx`

```typescript
interface QuestionStatsCardProps {
  stats: {
    correct_count: number
    total_questions: number
    accuracy_percent: number
    avg_answer_time_ms: number
    fastest_answer_ms: number
  }
}

export function QuestionStatsCard({ stats }: QuestionStatsCardProps) {
  const isPerfect = stats.correct_count === stats.total_questions
  
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Trivia Performance</h3>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="text-3xl font-bold text-green-400">
          {stats.correct_count}/{stats.total_questions}
        </div>
        {isPerfect && (
          <span className="px-3 py-1 bg-yellow-500 text-black font-bold rounded-full text-sm">
            PERFECT!
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-400">Accuracy</span>
          <div className="text-white font-medium">
            {stats.accuracy_percent.toFixed(1)}%
          </div>
        </div>
        <div>
          <span className="text-slate-400">Avg Time</span>
          <div className="text-white font-medium">
            {(stats.avg_answer_time_ms / 1000).toFixed(1)}s
          </div>
        </div>
        <div>
          <span className="text-slate-400">Fastest</span>
          <div className="text-white font-medium">
            {(stats.fastest_answer_ms / 1000).toFixed(1)}s
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 5. CombatStatsCard Component

Location: `frontend/src/components/recap/CombatStatsCard.tsx`

```typescript
interface CombatStatsCardProps {
  stats: {
    kills: number
    deaths: number
    kd_ratio: number
    max_streak: number
    shots_fired: number
    shots_hit: number
    shot_accuracy: number
  }
}

export function CombatStatsCard({ stats }: CombatStatsCardProps) {
  const kdDisplay = stats.deaths === 0 ? '∞' : stats.kd_ratio.toFixed(2)
  
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Combat Performance</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-slate-400 text-sm">K/D Ratio</span>
          <div className="text-2xl font-bold text-red-400">{kdDisplay}</div>
        </div>
        <div>
          <span className="text-slate-400 text-sm">Kills / Deaths</span>
          <div className="text-xl font-medium text-white">
            {stats.kills} / {stats.deaths}
          </div>
        </div>
        {stats.max_streak >= 3 && (
          <div>
            <span className="text-slate-400 text-sm">Best Streak</span>
            <div className="text-xl font-medium text-orange-400">
              🔥 {stats.max_streak}
            </div>
          </div>
        )}
        <div>
          <span className="text-slate-400 text-sm">Shot Accuracy</span>
          <div className="text-xl font-medium text-white">
            {stats.shot_accuracy.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}
```

## Data Models

### RecapPayload Schema (Python)

```python
from pydantic import BaseModel
from typing import Optional, List

class XPBreakdown(BaseModel):
    total: int
    base_xp: int
    kill_bonus: int
    streak_bonus: int
    duration_bonus: int

class TierProgress(BaseModel):
    previous_tier: int
    new_tier: int
    tier_advanced: bool
    current_xp: int
    xp_to_next_tier: int
    new_claimable_rewards: List[int]

class QuestionStats(BaseModel):
    correct_count: int
    total_questions: int
    accuracy_percent: float
    avg_answer_time_ms: int
    fastest_answer_ms: int

class CombatStats(BaseModel):
    kills: int
    deaths: int
    kd_ratio: float
    max_streak: int
    shots_fired: int
    shots_hit: int
    shot_accuracy: float

class OpponentData(BaseModel):
    id: str
    display_name: str
    avatar_url: Optional[str]
    final_score: int
    accuracy_percent: float
    kd_ratio: float

class RecapPayload(BaseModel):
    winner_id: Optional[str]
    is_tie: bool
    won_by_time: bool
    xp_breakdown: XPBreakdown
    tier_progress: TierProgress
    question_stats: QuestionStats
    combat_stats: CombatStats
    opponent: OpponentData
```

### Database Schema

```sql
-- Add recap_data column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS recap_data JSONB;

-- Index for efficient match history queries with recap data
CREATE INDEX IF NOT EXISTS idx_games_recap_data ON games USING GIN (recap_data);

-- Comment for documentation
COMMENT ON COLUMN games.recap_data IS 'JSONB containing per-player RecapPayload for match history';
```

### TypeScript Types

```typescript
// frontend/src/types/recap.ts

export interface XPBreakdown {
  total: number
  base_xp: number
  kill_bonus: number
  streak_bonus: number
  duration_bonus: number
}

export interface TierProgress {
  previous_tier: number
  new_tier: number
  tier_advanced: boolean
  current_xp: number
  xp_to_next_tier: number
  new_claimable_rewards: number[]
}

export interface QuestionStats {
  correct_count: number
  total_questions: number
  accuracy_percent: number
  avg_answer_time_ms: number
  fastest_answer_ms: number
}

export interface CombatStats {
  kills: number
  deaths: number
  kd_ratio: number
  max_streak: number
  shots_fired: number
  shots_hit: number
  shot_accuracy: number
}

export interface OpponentData {
  id: string
  display_name: string
  avatar_url: string | null
  final_score: number
  accuracy_percent: number
  kd_ratio: number
}

export interface RecapPayload {
  winner_id: string | null
  is_tie: boolean
  won_by_time: boolean
  xp_breakdown: XPBreakdown
  tier_progress: TierProgress
  question_stats: QuestionStats
  combat_stats: CombatStats
  opponent: OpponentData
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the acceptance criteria analysis, the following correctness properties must be verified through property-based testing:

### Property 1: Recap Serialization Round-Trip

*For any* valid RecapPayload object, serializing to JSON then deserializing SHALL produce an equivalent RecapPayload object with all fields preserved.

**Validates: Requirements 7.1, 7.2, 7.4**

### Property 2: XP Breakdown Sum Consistency

*For any* XPBreakdown object, the `total` field SHALL equal the sum of `base_xp + kill_bonus + streak_bonus + duration_bonus`.

**Validates: Requirements 2.2, 2.5**

### Property 3: Question Accuracy Calculation

*For any* QuestionStats object with `total_questions > 0`, the `accuracy_percent` field SHALL equal `(correct_count / total_questions) * 100`.

**Validates: Requirements 4.2, 4.5**

### Property 4: K/D Ratio Calculation

*For any* CombatStats object with `deaths > 0`, the `kd_ratio` field SHALL equal `kills / deaths`.

**Validates: Requirements 5.2, 5.5**

### Property 5: Shot Accuracy Calculation

*For any* CombatStats object with `shots_fired > 0`, the `shot_accuracy` field SHALL equal `(shots_hit / shots_fired) * 100`.

**Validates: Requirements 5.4, 5.5**

### Property 6: RecapPayload Completeness

*For any* game_end event payload, the `recaps` field SHALL contain a valid RecapPayload for each player with all required nested objects: `xp_breakdown`, `tier_progress`, `question_stats`, `combat_stats`, and `opponent`.

**Validates: Requirements 2.5, 3.5, 4.5, 5.5, 6.6**

### Property 7: Final Question Flag

*For any* round_result event for question 15, the payload SHALL include `is_final_question: true`.

**Validates: Requirements 1.5**

### Property 8: Game End Trigger After Q15

*For any* game session where both players have submitted answers for question 15, the game end sequence SHALL be triggered (session status becomes "completed").

**Validates: Requirements 1.1**

## Error Handling

### Backend Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| CombatTracker stats unavailable | Return default stats (0 kills, 0 deaths, etc.) |
| BattlePassService XP award fails | Log error, continue with recap using cached XP data |
| Database persistence fails | Retry once, then log error and continue with WebSocket broadcast |
| Player disconnects during recap build | Build recap with available data, mark opponent as disconnected |
| Invalid session state | Return error response, do not broadcast game_end |

### Frontend Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Recap data missing from game_end | Show basic results (win/loss, scores only) |
| XP breakdown incomplete | Show total XP only, hide breakdown |
| Tier progress missing | Hide tier progress section |
| Navigation fails | Show error toast, provide manual navigation options |
| WebSocket disconnects before recap | Fetch recap from API on Results page mount |

### Graceful Degradation

The recap system is designed to degrade gracefully:

1. **Full Recap**: All data available - show complete recap UI
2. **Partial Recap**: Some sections missing - show available sections, hide missing
3. **Minimal Recap**: Only basic game result - show win/loss and scores (current behavior)
4. **No Recap**: WebSocket failed - fetch from match history API

## Testing Strategy

### Property-Based Testing

The system uses **Hypothesis** (Python) for property-based testing on the backend. Each property test runs a minimum of 100 iterations with randomly generated inputs.

#### Test File: `backend/tests/property/test_recap_system.py`

```python
from hypothesis import given, strategies as st, settings
from app.services.recap_builder import RecapBuilder, RecapPayload, XPBreakdown, QuestionStats, CombatStats

# Property 1: Recap Serialization Round-Trip
@given(st.builds(RecapPayload, ...))
@settings(max_examples=100)
def test_recap_serialization_round_trip(recap: RecapPayload):
    """
    **Feature: match-auto-end-recap, Property 1: Recap Serialization Round-Trip**
    For any valid RecapPayload, serialize then deserialize produces equivalent object.
    """
    json_str = recap.model_dump_json()
    restored = RecapPayload.model_validate_json(json_str)
    assert recap == restored

# Property 2: XP Breakdown Sum Consistency
@given(st.builds(XPBreakdown, ...))
@settings(max_examples=100)
def test_xp_breakdown_sum_consistency(xp: XPBreakdown):
    """
    **Feature: match-auto-end-recap, Property 2: XP Breakdown Sum Consistency**
    Total XP equals sum of all components.
    """
    expected_total = xp.base_xp + xp.kill_bonus + xp.streak_bonus + xp.duration_bonus
    assert xp.total == expected_total

# Property 3: Question Accuracy Calculation
@given(st.integers(min_value=0, max_value=15), st.integers(min_value=1, max_value=15))
@settings(max_examples=100)
def test_question_accuracy_calculation(correct: int, total: int):
    """
    **Feature: match-auto-end-recap, Property 3: Question Accuracy Calculation**
    Accuracy percent equals (correct / total) * 100.
    """
    correct = min(correct, total)  # Can't have more correct than total
    stats = QuestionStats(
        correct_count=correct,
        total_questions=total,
        accuracy_percent=(correct / total) * 100,
        avg_answer_time_ms=5000,
        fastest_answer_ms=2000,
    )
    expected = (correct / total) * 100
    assert abs(stats.accuracy_percent - expected) < 0.01

# Property 4: K/D Ratio Calculation
@given(st.integers(min_value=0, max_value=50), st.integers(min_value=1, max_value=50))
@settings(max_examples=100)
def test_kd_ratio_calculation(kills: int, deaths: int):
    """
    **Feature: match-auto-end-recap, Property 4: K/D Ratio Calculation**
    K/D ratio equals kills / deaths when deaths > 0.
    """
    stats = CombatStats(
        kills=kills,
        deaths=deaths,
        kd_ratio=kills / deaths,
        max_streak=0,
        shots_fired=100,
        shots_hit=50,
        shot_accuracy=50.0,
    )
    expected = kills / deaths
    assert abs(stats.kd_ratio - expected) < 0.01

# Property 5: Shot Accuracy Calculation
@given(st.integers(min_value=0, max_value=100), st.integers(min_value=1, max_value=100))
@settings(max_examples=100)
def test_shot_accuracy_calculation(hits: int, fired: int):
    """
    **Feature: match-auto-end-recap, Property 5: Shot Accuracy Calculation**
    Shot accuracy equals (hits / fired) * 100 when fired > 0.
    """
    hits = min(hits, fired)  # Can't hit more than fired
    stats = CombatStats(
        kills=0,
        deaths=0,
        kd_ratio=0.0,
        max_streak=0,
        shots_fired=fired,
        shots_hit=hits,
        shot_accuracy=(hits / fired) * 100,
    )
    expected = (hits / fired) * 100
    assert abs(stats.shot_accuracy - expected) < 0.01
```

### Unit Tests

Unit tests cover specific examples and edge cases:

1. **RecapBuilder.build_recap()** - Verify recap is built correctly from session data
2. **RecapBuilder.calculate_question_stats()** - Test with 0 correct, all correct, partial correct
3. **RecapBuilder.calculate_combat_stats()** - Test with 0 deaths (infinity K/D), 0 shots fired
4. **GameService.end_game()** - Verify recap is included in result
5. **build_game_end()** - Verify recaps field is included in payload

### Integration Tests

1. **Full Match Flow**: Complete 15 questions → verify game_end with recap
2. **Recap Persistence**: End game → verify recap_data in database
3. **Match History API**: End game → fetch history → verify recap_data returned
4. **WebSocket Broadcast**: End game → verify both players receive recap

### Frontend Tests

1. **Results Page Rendering**: Mock recap data → verify all sections render
2. **XP Animation**: Verify counter animates from 0 to total
3. **Tier Up Celebration**: Mock tier_advanced=true → verify animation triggers
4. **Navigation**: Click buttons → verify correct navigation and state reset

---

*Document Version: 1.0*
*Created: December 2024*
