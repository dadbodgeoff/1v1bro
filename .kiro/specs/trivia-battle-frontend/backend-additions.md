# Backend Additions Required

## Overview

This document specifies all backend changes needed to support the 2D animated frontend experience. These additions must be implemented BEFORE starting frontend development.

---

## 1. New WebSocket Message Types

### Add to `app/schemas/ws_messages.py`

```python
class WSMessageType(str, Enum):
    # Existing types...
    PLAYER_JOINED = "player_joined"
    PLAYER_LEFT = "player_left"
    GAME_START = "game_start"
    QUESTION = "question"
    ROUND_RESULT = "round_result"
    GAME_END = "game_end"
    ERROR = "error"
    READY = "ready"
    ANSWER = "answer"
    START_GAME = "start_game"
    
    # NEW: Position sync
    POSITION_UPDATE = "position_update"
    
    # NEW: Power-up system
    POWERUP_SPAWN = "powerup_spawn"
    POWERUP_COLLECTED = "powerup_collected"
    POWERUP_USE = "powerup_use"
    SOS_USED = "sos_used"
    TIME_STOLEN = "time_stolen"
    SHIELD_ACTIVATED = "shield_activated"
    DOUBLE_POINTS_ACTIVATED = "double_points_activated"


# NEW: Position update payload
class PositionUpdatePayload(BaseModel):
    player_id: str
    x: float
    y: float


# NEW: Power-up payloads
class PowerUpType(str, Enum):
    SOS = "sos"
    TIME_STEAL = "time_steal"
    SHIELD = "shield"
    DOUBLE_POINTS = "double_points"


class PowerUpSpawnPayload(BaseModel):
    id: str
    type: PowerUpType
    x: float
    y: float


class PowerUpCollectedPayload(BaseModel):
    powerup_id: str
    player_id: str
    type: PowerUpType


class PowerUpUsePayload(BaseModel):
    type: PowerUpType


class SosUsedPayload(BaseModel):
    player_id: str
    eliminated_options: List[str]  # e.g., ["A", "C"]


class TimeStolenPayload(BaseModel):
    stealer_id: str
    victim_id: str
    seconds_stolen: int  # Always 5
```

---

## 2. Player State Additions

### Modify `app/services/game_service.py`

```python
@dataclass
class PlayerGameState:
    """State for a single player in a game."""
    player_id: str
    score: int = 0
    correct_count: int = 0
    answers: List[PlayerAnswer] = field(default_factory=list)
    current_answer: Optional[str] = None
    current_time_ms: Optional[int] = None
    is_connected: bool = True
    
    # NEW: Position tracking
    position_x: float = 0.0
    position_y: float = 0.0
    
    # NEW: Power-up inventory (max 3)
    inventory: List[str] = field(default_factory=list)
    
    # NEW: Active effects
    has_shield: bool = False
    has_double_points: bool = False
    time_penalty_ms: int = 0  # Added by opponent's time steal
```

---

## 3. Power-Up Service

### Create `app/services/powerup_service.py`

```python
"""
Power-up service.
Handles power-up spawning, collection, and effects.
"""

import random
import uuid
from typing import List, Optional, Tuple
from dataclasses import dataclass

from app.schemas.ws_messages import PowerUpType


# Map spawn points (x, y coordinates)
SPAWN_POINTS = [
    (200, 200), (600, 200), (1000, 200),
    (200, 400), (600, 400), (1000, 400),
    (200, 600), (600, 600), (1000, 600),
]

# Power-up weights (probability distribution)
POWERUP_WEIGHTS = {
    PowerUpType.SOS: 0.35,
    PowerUpType.TIME_STEAL: 0.30,
    PowerUpType.SHIELD: 0.20,
    PowerUpType.DOUBLE_POINTS: 0.15,
}


@dataclass
class MapPowerUp:
    """A power-up on the map."""
    id: str
    type: PowerUpType
    x: float
    y: float
    collected: bool = False


class PowerUpService:
    """Service for power-up management."""
    
    def __init__(self):
        self.active_powerups: dict[str, List[MapPowerUp]] = {}  # lobby_id -> powerups
    
    def initialize_for_lobby(self, lobby_id: str) -> List[MapPowerUp]:
        """
        Initialize power-ups for a new game.
        Spawns 3-5 power-ups at random spawn points.
        """
        count = random.randint(3, 5)
        spawn_points = random.sample(SPAWN_POINTS, count)
        
        powerups = []
        for x, y in spawn_points:
            powerup = MapPowerUp(
                id=str(uuid.uuid4()),
                type=self._random_type(),
                x=x,
                y=y,
            )
            powerups.append(powerup)
        
        self.active_powerups[lobby_id] = powerups
        return powerups
    
    def _random_type(self) -> PowerUpType:
        """Select a random power-up type based on weights."""
        types = list(POWERUP_WEIGHTS.keys())
        weights = list(POWERUP_WEIGHTS.values())
        return random.choices(types, weights=weights, k=1)[0]
    
    def get_powerups(self, lobby_id: str) -> List[MapPowerUp]:
        """Get all active power-ups for a lobby."""
        return [p for p in self.active_powerups.get(lobby_id, []) if not p.collected]
    
    def collect_powerup(
        self,
        lobby_id: str,
        powerup_id: str,
        player_inventory: List[str],
    ) -> Optional[MapPowerUp]:
        """
        Attempt to collect a power-up.
        Returns the power-up if successful, None if already collected or inventory full.
        """
        if len(player_inventory) >= 3:
            return None  # Inventory full
        
        powerups = self.active_powerups.get(lobby_id, [])
        for powerup in powerups:
            if powerup.id == powerup_id and not powerup.collected:
                powerup.collected = True
                return powerup
        
        return None
    
    def spawn_new_powerup(self, lobby_id: str) -> Optional[MapPowerUp]:
        """
        Spawn a new power-up at a random unoccupied spawn point.
        Called periodically during the game.
        """
        existing = self.active_powerups.get(lobby_id, [])
        occupied = {(p.x, p.y) for p in existing if not p.collected}
        
        available = [sp for sp in SPAWN_POINTS if sp not in occupied]
        if not available:
            return None
        
        x, y = random.choice(available)
        powerup = MapPowerUp(
            id=str(uuid.uuid4()),
            type=self._random_type(),
            x=x,
            y=y,
        )
        
        if lobby_id not in self.active_powerups:
            self.active_powerups[lobby_id] = []
        self.active_powerups[lobby_id].append(powerup)
        
        return powerup
    
    def apply_sos(self, correct_answer: str, options: List[str]) -> List[str]:
        """
        Apply SOS power-up: eliminate 2 wrong answers.
        Returns list of eliminated option letters.
        """
        wrong_options = [
            chr(ord('A') + i) 
            for i, _ in enumerate(options) 
            if chr(ord('A') + i) != correct_answer
        ]
        return random.sample(wrong_options, min(2, len(wrong_options)))
    
    def cleanup_lobby(self, lobby_id: str):
        """Clean up power-ups when game ends."""
        if lobby_id in self.active_powerups:
            del self.active_powerups[lobby_id]


# Singleton instance
powerup_service = PowerUpService()
```

---

## 4. WebSocket Handler Additions

### Modify `app/websocket/handlers.py`

Add these new message handlers:

```python
from app.services.powerup_service import powerup_service, PowerUpType

# Add to existing handler class or functions:

async def handle_position_update(
    manager: ConnectionManager,
    lobby_code: str,
    player_id: str,
    payload: dict,
):
    """Handle player position update and broadcast to opponent."""
    x = payload.get("x", 0)
    y = payload.get("y", 0)
    
    # Update player state
    session = game_service.get_session(lobby_code)
    if session and player_id in session.player_states:
        session.player_states[player_id].position_x = x
        session.player_states[player_id].position_y = y
    
    # Broadcast to other players in lobby
    await manager.broadcast_to_lobby(
        lobby_code,
        {
            "type": "position_update",
            "payload": {
                "player_id": player_id,
                "x": x,
                "y": y,
            }
        },
        exclude_user=player_id,  # Don't send back to sender
    )


async def handle_powerup_collect(
    manager: ConnectionManager,
    lobby_code: str,
    player_id: str,
    payload: dict,
):
    """Handle power-up collection."""
    powerup_id = payload.get("powerup_id")
    
    session = game_service.get_session(lobby_code)
    if not session or player_id not in session.player_states:
        return
    
    player_state = session.player_states[player_id]
    
    # Attempt collection
    powerup = powerup_service.collect_powerup(
        lobby_code,
        powerup_id,
        player_state.inventory,
    )
    
    if powerup:
        # Add to inventory
        player_state.inventory.append(powerup.type.value)
        
        # Broadcast to all players
        await manager.broadcast_to_lobby(
            lobby_code,
            {
                "type": "powerup_collected",
                "payload": {
                    "powerup_id": powerup_id,
                    "player_id": player_id,
                    "type": powerup.type.value,
                }
            }
        )


async def handle_powerup_use(
    manager: ConnectionManager,
    lobby_code: str,
    player_id: str,
    payload: dict,
):
    """Handle power-up usage."""
    powerup_type = payload.get("type")
    
    session = game_service.get_session(lobby_code)
    if not session or player_id not in session.player_states:
        return
    
    player_state = session.player_states[player_id]
    
    # Check if player has this power-up
    if powerup_type not in player_state.inventory:
        return
    
    # Remove from inventory
    player_state.inventory.remove(powerup_type)
    
    # Apply effect based on type
    if powerup_type == PowerUpType.SOS.value:
        await handle_sos_use(manager, lobby_code, player_id, session)
    elif powerup_type == PowerUpType.TIME_STEAL.value:
        await handle_time_steal_use(manager, lobby_code, player_id, session)
    elif powerup_type == PowerUpType.SHIELD.value:
        player_state.has_shield = True
        await manager.broadcast_to_lobby(
            lobby_code,
            {"type": "shield_activated", "payload": {"player_id": player_id}}
        )
    elif powerup_type == PowerUpType.DOUBLE_POINTS.value:
        player_state.has_double_points = True
        await manager.broadcast_to_lobby(
            lobby_code,
            {"type": "double_points_activated", "payload": {"player_id": player_id}}
        )


async def handle_sos_use(manager, lobby_code, player_id, session):
    """Apply SOS power-up effect."""
    if not session.current_question or session.current_question < 1:
        return
    
    question = session.questions[session.current_question - 1]
    eliminated = powerup_service.apply_sos(
        question.correct_answer,
        question.options,
    )
    
    # Send only to the player who used it
    await manager.send_to_user(
        lobby_code,
        player_id,
        {
            "type": "sos_used",
            "payload": {
                "player_id": player_id,
                "eliminated_options": eliminated,
            }
        }
    )


async def handle_time_steal_use(manager, lobby_code, player_id, session):
    """Apply Time Steal power-up effect."""
    # Find opponent
    opponent_id = None
    for pid in session.player_states:
        if pid != player_id:
            opponent_id = pid
            break
    
    if not opponent_id:
        return
    
    # Add time penalty to opponent
    session.player_states[opponent_id].time_penalty_ms += 5000
    
    # Notify both players
    await manager.broadcast_to_lobby(
        lobby_code,
        {
            "type": "time_stolen",
            "payload": {
                "stealer_id": player_id,
                "victim_id": opponent_id,
                "seconds_stolen": 5,
            }
        }
    )
```

---

## 5. Connection Manager Additions

### Modify `app/websocket/manager.py`

Add these methods:

```python
async def broadcast_to_lobby(
    self,
    lobby_code: str,
    message: dict,
    exclude_user: Optional[str] = None,
):
    """Broadcast message to all users in lobby, optionally excluding one."""
    if lobby_code in self.active_connections:
        data = json.dumps(message)
        for connection in self.active_connections[lobby_code]:
            user_id = self.get_user_id(connection)
            if exclude_user and user_id == exclude_user:
                continue
            try:
                await connection.send_text(data)
            except:
                pass


async def send_to_user(
    self,
    lobby_code: str,
    user_id: str,
    message: dict,
):
    """Send message to a specific user in a lobby."""
    if lobby_code in self.active_connections:
        data = json.dumps(message)
        for connection in self.active_connections[lobby_code]:
            if self.get_user_id(connection) == user_id:
                try:
                    await connection.send_text(data)
                except:
                    pass
                break
```

---

## 6. Game Service Modifications

### Modify `app/services/game_service.py`

Add power-up initialization and scoring modifications:

```python
from app.services.powerup_service import powerup_service

class GameService(BaseService):
    # ... existing code ...
    
    def create_session(
        self,
        lobby_id: str,
        player1_id: str,
        player2_id: str,
        game_mode: str = "fortnite",
    ) -> GameSession:
        """Create a new game session."""
        questions = self.question_service.load_questions(game_mode=game_mode)
        
        session = GameSession(
            lobby_id=lobby_id,
            player1_id=player1_id,
            player2_id=player2_id,
            questions=questions,
        )
        
        # Set initial spawn positions
        session.player_states[player1_id].position_x = 200
        session.player_states[player1_id].position_y = 300
        session.player_states[player2_id].position_x = 1000
        session.player_states[player2_id].position_y = 300
        
        self._sessions[lobby_id] = session
        
        # Initialize power-ups for this game
        powerup_service.initialize_for_lobby(lobby_id)
        
        return session
    
    def calculate_score(
        self,
        is_correct: bool,
        time_ms: int,
        has_double_points: bool = False,
        time_penalty_ms: int = 0,
    ) -> int:
        """
        Calculate score for an answer.
        
        Args:
            is_correct: Whether answer was correct
            time_ms: Time taken in milliseconds
            has_double_points: Whether double points power-up is active
            time_penalty_ms: Time penalty from opponent's time steal
        """
        if not is_correct:
            return 0
        
        # Adjust time for penalty
        effective_time = time_ms + time_penalty_ms
        
        # Score decreases with time: 1000 - (time_ms / 30)
        score = settings.MAX_SCORE_PER_QUESTION - (effective_time // settings.SCORE_TIME_DIVISOR)
        score = max(0, min(settings.MAX_SCORE_PER_QUESTION, score))
        
        # Apply double points
        if has_double_points:
            score *= 2
        
        return score
    
    def submit_answer(
        self,
        lobby_id: str,
        player_id: str,
        q_num: int,
        answer: Optional[str],
        time_ms: int,
    ) -> PlayerAnswer:
        """Submit a player's answer with power-up effects."""
        session = self.get_session(lobby_id)
        if not session:
            raise GameStateError("Game session not found")
        
        if player_id not in session.player_states:
            raise GameStateError("Player not in game")
        
        player_state = session.player_states[player_id]
        
        # Get question and check answer
        question = session.questions[q_num - 1]
        is_correct = answer and self.question_service.check_answer(question, answer)
        
        # Apply shield (protects from wrong answer penalty - but we don't have penalties, so skip)
        
        # Calculate score with power-up effects
        score = self.calculate_score(
            is_correct,
            time_ms,
            has_double_points=player_state.has_double_points,
            time_penalty_ms=player_state.time_penalty_ms,
        )
        
        # Reset power-up effects after use
        player_state.has_double_points = False
        player_state.time_penalty_ms = 0
        
        # Record answer
        player_answer = PlayerAnswer(
            q_num=q_num,
            answer=answer,
            time_ms=time_ms,
            is_correct=is_correct,
            score=score,
        )
        
        # Update player state
        player_state.answers.append(player_answer)
        player_state.score += score
        if is_correct:
            player_state.correct_count += 1
        player_state.current_answer = answer
        player_state.current_time_ms = time_ms
        
        return player_answer
    
    async def end_game(self, lobby_id: str) -> GameResult:
        """End game and clean up."""
        result = await super().end_game(lobby_id)
        
        # Clean up power-ups
        powerup_service.cleanup_lobby(lobby_id)
        
        return result
```

---

## 7. Configuration Additions

### Modify `app/core/config.py`

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # NEW: Power-up settings
    POWERUP_SPAWN_INTERVAL_MS: int = 15000  # Spawn new power-up every 15s
    MAX_POWERUPS_PER_PLAYER: int = 3
    TIME_STEAL_SECONDS: int = 5
    
    # NEW: Position sync settings
    POSITION_SYNC_INTERVAL_MS: int = 100
    
    # NEW: Map settings
    MAP_WIDTH: int = 1920
    MAP_HEIGHT: int = 1080
```

---

## 8. Database Schema Additions (Optional)

If you want to persist power-up usage stats:

```sql
-- Add to games table or create new table
ALTER TABLE games ADD COLUMN powerups_used JSONB DEFAULT '{}';

-- Example structure:
-- {
--   "player1_id": {"sos": 1, "time_steal": 2},
--   "player2_id": {"shield": 1}
-- }
```

---

## 9. New Tests Required

### Create `backend/tests/property/test_powerups.py`

```python
"""Property-based tests for power-up system."""

from hypothesis import given, strategies as st, settings
import pytest

from app.services.powerup_service import PowerUpService, PowerUpType


class TestPowerUpService:
    """Tests for PowerUpService."""
    
    @given(st.text(min_size=1, max_size=36))
    @settings(max_examples=50)
    def test_initialize_spawns_correct_count(self, lobby_id: str):
        """Property: Initialize spawns 3-5 power-ups."""
        # Feature: trivia-battle-frontend, Property: Power-up spawn count
        service = PowerUpService()
        powerups = service.initialize_for_lobby(lobby_id)
        
        assert 3 <= len(powerups) <= 5
        
        # Cleanup
        service.cleanup_lobby(lobby_id)
    
    @given(st.lists(st.sampled_from(["sos", "time_steal", "shield"]), max_size=3))
    def test_inventory_max_three(self, inventory: list):
        """Property: Inventory never exceeds 3 items."""
        # Feature: trivia-battle-frontend, Property 7: Power-Up Inventory Limit
        service = PowerUpService()
        lobby_id = "test-lobby"
        service.initialize_for_lobby(lobby_id)
        
        powerups = service.get_powerups(lobby_id)
        if powerups:
            result = service.collect_powerup(
                lobby_id,
                powerups[0].id,
                inventory,
            )
            
            if len(inventory) >= 3:
                assert result is None  # Should reject
            else:
                assert result is not None or powerups[0].collected
        
        service.cleanup_lobby(lobby_id)
    
    def test_sos_eliminates_two_wrong_answers(self):
        """Property: SOS always eliminates exactly 2 wrong answers."""
        # Feature: trivia-battle-frontend, Property: SOS effect
        service = PowerUpService()
        
        options = ["Option A", "Option B", "Option C", "Option D"]
        correct = "B"
        
        for _ in range(100):
            eliminated = service.apply_sos(correct, options)
            
            assert len(eliminated) == 2
            assert correct not in eliminated
            assert all(e in ["A", "C", "D"] for e in eliminated)
```

---

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `schemas/ws_messages.py` | Add | New message types and payloads |
| `services/game_service.py` | Modify | Add position, inventory, power-up effects |
| `services/powerup_service.py` | Create | New service for power-up logic |
| `websocket/handlers.py` | Modify | Add position and power-up handlers |
| `websocket/manager.py` | Modify | Add targeted broadcast methods |
| `core/config.py` | Modify | Add power-up and map settings |
| `tests/property/test_powerups.py` | Create | Property tests for power-ups |

### Estimated Backend Work: 1-2 days

Complete these backend additions before starting frontend Phase 6 (Phaser setup).
