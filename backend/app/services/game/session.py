"""
Game session management.
Handles in-memory game state.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field

from app.schemas.game import Question, PlayerAnswer


@dataclass
class PlayerGameState:
    """State for a single player in a game."""
    player_id: str
    score: int = 0
    correct_count: int = 0
    total_time_ms: int = 0
    answers: List[PlayerAnswer] = field(default_factory=list)
    current_answer: Optional[str] = None
    current_time_ms: Optional[int] = None
    is_connected: bool = True
    
    # Position tracking
    position_x: float = 0.0
    position_y: float = 0.0
    
    # Power-up inventory (max 3)
    inventory: List[str] = field(default_factory=list)
    
    # Active effects
    has_shield: bool = False
    has_double_points: bool = False
    time_penalty_ms: int = 0
    
    # Combat scoring
    kill_count: int = 0
    kill_score: int = 0  # Points earned from kills (separate from quiz score)


@dataclass
class GameSession:
    """Active game session state (in-memory)."""
    lobby_id: str
    player1_id: str
    player2_id: str
    questions: List[Question]
    current_question: int = 0
    question_start_time: int = 0
    player_states: Dict[str, PlayerGameState] = field(default_factory=dict)
    status: str = "waiting"
    
    def __post_init__(self):
        if not self.player_states:
            self.player_states = {
                self.player1_id: PlayerGameState(player_id=self.player1_id),
                self.player2_id: PlayerGameState(player_id=self.player2_id),
            }


class SessionManager:
    """Manages in-memory game sessions."""
    
    _sessions: Dict[str, GameSession] = {}
    
    @classmethod
    def create(
        cls,
        lobby_id: str,
        player1_id: str,
        player2_id: str,
        questions: List[Question],
    ) -> GameSession:
        """Create a new game session."""
        session = GameSession(
            lobby_id=lobby_id,
            player1_id=player1_id,
            player2_id=player2_id,
            questions=questions,
        )
        
        # Set initial spawn positions
        session.player_states[player1_id].position_x = 200.0
        session.player_states[player1_id].position_y = 300.0
        session.player_states[player2_id].position_x = 1000.0
        session.player_states[player2_id].position_y = 300.0
        
        cls._sessions[lobby_id] = session
        return session
    
    @classmethod
    def get(cls, lobby_id: str) -> Optional[GameSession]:
        """Get session by lobby ID."""
        return cls._sessions.get(lobby_id)
    
    @classmethod
    def remove(cls, lobby_id: str) -> None:
        """Remove session."""
        cls._sessions.pop(lobby_id, None)
    
    @classmethod
    def exists(cls, lobby_id: str) -> bool:
        """Check if session exists."""
        return lobby_id in cls._sessions
    
    @classmethod
    def record_kill(cls, lobby_id: str, killer_id: str, points_per_kill: int = 50) -> Optional[int]:
        """
        Record a kill and add points to the killer's score.
        
        Args:
            lobby_id: The lobby/game ID
            killer_id: The player who got the kill
            points_per_kill: Points to award per kill (default 50)
            
        Returns:
            New total score if successful, None if session/player not found
        """
        session = cls._sessions.get(lobby_id)
        if not session:
            return None
        
        player_state = session.player_states.get(killer_id)
        if not player_state:
            return None
        
        player_state.kill_count += 1
        player_state.kill_score += points_per_kill
        player_state.score += points_per_kill
        
        return player_state.score
