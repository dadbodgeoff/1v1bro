"""
Server-Side Tick System - Orchestrator.

Coordinates game loop, delegates to specialized modules:
- validation.py: Input validation and anti-cheat
- lag_compensation.py: Position history and hit detection
- config.py: All tunable parameters
- models.py: Data structures
"""

import asyncio
import time
from typing import Dict, Optional, Callable, Awaitable
from collections import deque

from app.core.logging import get_logger
from .config import TICK_CONFIG, MOVEMENT_CONFIG, LAG_COMP_CONFIG
from .models import GameState, PlayerState, PlayerInput, FireInput
from .validation import InputValidator
from .lag_compensation import LagCompensator
from .combat import ServerCombatSystem
from .arena_systems import ServerArenaSystems, HazardType, TrapType, TrapEffect
from .dynamic_spawns import ServerDynamicSpawnManager
from .buffs import BuffManager

logger = get_logger("game.tick_system")


class TickSystem:
    """
    Authoritative server tick system.
    
    Runs at 60Hz, processing inputs and updating game state.
    Delegates validation and lag compensation to specialized classes.
    """
    
    def __init__(self):
        self._games: Dict[str, GameState] = {}
        self._tasks: Dict[str, asyncio.Task] = {}
        self._broadcast_callback: Optional[Callable[[str, dict], Awaitable[None]]] = None
        self._kick_callback: Optional[Callable[[str, str, str], Awaitable[None]]] = None
        
        # Delegates
        self._validator = InputValidator()
        self._lag_comp = LagCompensator()
        
        # Config
        self._tick_config = TICK_CONFIG
        self._movement_config = MOVEMENT_CONFIG
        self._lag_comp_config = LAG_COMP_CONFIG
    
    def set_broadcast_callback(self, callback: Callable[[str, dict], Awaitable[None]]) -> None:
        """Set callback for broadcasting state updates."""
        self._broadcast_callback = callback
    
    def set_kick_callback(self, callback: Callable[[str, str, str], Awaitable[None]]) -> None:
        """Set callback for kicking players."""
        self._kick_callback = callback
    
    def create_game(
        self,
        lobby_id: str,
        player1_id: str,
        player2_id: str,
        spawn1: tuple = (160, 360),
        spawn2: tuple = (1120, 360),
    ) -> GameState:
        """Create a new game."""
        history_size = self._lag_comp_config.history_size(self._tick_config.rate_hz)
        
        game = GameState(lobby_id=lobby_id)
        game.players[player1_id] = PlayerState(
            player_id=player1_id,
            x=spawn1[0],
            y=spawn1[1],
            last_valid_position=spawn1,
            position_history=deque(maxlen=history_size),
        )
        game.players[player2_id] = PlayerState(
            player_id=player2_id,
            x=spawn2[0],
            y=spawn2[1],
            last_valid_position=spawn2,
            position_history=deque(maxlen=history_size),
        )
        
        # Initialize buff manager for quiz rewards
        game.buff_manager = BuffManager()
        game.buff_manager.init_player(player1_id)
        game.buff_manager.init_player(player2_id)
        
        # Initialize combat system for this game (with buff manager)
        game.combat_system = ServerCombatSystem(buff_manager=game.buff_manager)
        game.combat_system.init_player(player1_id)
        game.combat_system.init_player(player2_id)
        
        # Initialize arena systems (hazards, traps, transport)
        game.arena_systems = ServerArenaSystems()
        
        # Initialize dynamic spawn manager
        game.dynamic_spawns = ServerDynamicSpawnManager()
        
        self._games[lobby_id] = game
        logger.info(f"[TICK] Created game {lobby_id} with players: {player1_id}, {player2_id}")
        return game
    
    def start_game(self, lobby_id: str) -> bool:
        """Start the tick loop."""
        game = self._games.get(lobby_id)
        if not game or game.is_running:
            return game.is_running if game else False
        
        game.is_running = True
        game.start_time = time.time()
        self._tasks[lobby_id] = asyncio.create_task(self._tick_loop(lobby_id))
        
        # Schedule immediate initial state broadcast so clients know spawn positions
        asyncio.create_task(self._broadcast_initial_state(game))
        
        logger.info(f"Started tick loop for {lobby_id}")
        return True
    
    async def _broadcast_initial_state(self, game: GameState) -> None:
        """Broadcast initial state immediately so clients see each other at spawn."""
        await asyncio.sleep(0.1)  # Small delay to ensure clients are ready
        await self._broadcast_state(game)
    
    def stop_game(self, lobby_id: str) -> None:
        """Stop the tick loop."""
        game = self._games.get(lobby_id)
        if game:
            game.is_running = False
        
        task = self._tasks.pop(lobby_id, None)
        if task:
            task.cancel()
        
        self._games.pop(lobby_id, None)
        logger.info(f"Stopped tick loop for {lobby_id}")
    
    def queue_input(self, lobby_id: str, player_input: PlayerInput) -> bool:
        """Queue input for next tick."""
        game = self._games.get(lobby_id)
        if not game or not game.is_running:
            logger.warning(f"[TICK] Cannot queue input: game={bool(game)}, running={game.is_running if game else False}")
            return False
        
        player = game.players.get(player_input.player_id)
        if player and player.is_kicked:
            logger.warning(f"[TICK] Player {player_input.player_id} is kicked, ignoring input")
            return False
        
        game.pending_inputs.append(player_input)
        return True
    
    def queue_fire(self, lobby_id: str, fire_input: FireInput) -> bool:
        """Queue a fire input for next tick."""
        game = self._games.get(lobby_id)
        if not game or not game.is_running:
            return False
        
        player = game.players.get(fire_input.player_id)
        if player and player.is_kicked:
            return False
        
        game.pending_fire_inputs.append(fire_input)
        return True
    
    def init_arena_config(self, lobby_id: str, arena_config: dict) -> bool:
        """Initialize arena systems with map configuration."""
        game = self._games.get(lobby_id)
        if not game:
            return False
        
        if game.arena_systems:
            game.arena_systems.initialize_from_config(arena_config)
        
        # Initialize dynamic spawns with exclusion zones
        if game.dynamic_spawns:
            exclusion_zones = []
            # Add teleporters as exclusion zones
            for tp in arena_config.get("teleporters", []):
                exclusion_zones.append({
                    "x": tp["position"]["x"],
                    "y": tp["position"]["y"],
                    "radius": tp["radius"] + 60
                })
            # Add jump pads as exclusion zones
            for jp in arena_config.get("jumpPads", []):
                exclusion_zones.append({
                    "x": jp["position"]["x"],
                    "y": jp["position"]["y"],
                    "radius": jp["radius"] + 60
                })
            # Add spawn points as exclusion zones
            for sp in arena_config.get("spawnPoints", []):
                exclusion_zones.append({
                    "x": sp["position"]["x"],
                    "y": sp["position"]["y"],
                    "radius": 100
                })
            game.dynamic_spawns.initialize(exclusion_zones)
        
        return True
    
    def check_hit(
        self,
        lobby_id: str,
        target_id: str,
        shot_position: tuple,
        client_timestamp: float,
        hitbox_radius: float = 15.0,
    ) -> tuple[bool, str]:
        """Check hit with lag compensation."""
        game = self._games.get(lobby_id)
        if not game:
            return False, "game_not_found"
        
        target = game.players.get(target_id)
        if not target:
            return False, "target_not_found"
        
        return self._lag_comp.check_hit(target, shot_position, client_timestamp, hitbox_radius)
    
    async def _tick_loop(self, lobby_id: str) -> None:
        """Main tick loop at configured rate."""
        game = self._games.get(lobby_id)
        if not game:
            return
        
        tick_duration = self._tick_config.duration_s
        
        try:
            while game.is_running:
                tick_start = time.time()
                await self._process_tick(game)
                
                elapsed = time.time() - tick_start
                sleep_time = tick_duration - elapsed
                
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)
                elif elapsed > tick_duration * 1.5:
                    logger.warning(f"Tick {game.tick_count} took {elapsed*1000:.1f}ms")
                    
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Tick loop error: {e}")
            game.is_running = False
    
    async def _process_tick(self, game: GameState) -> None:
        """Process a single tick."""
        game.tick_count += 1
        current_time = time.time()
        tick_duration = self._tick_config.duration_s
        
        # Decay violations
        for player in game.players.values():
            self._validator.decay_violations(player, game.tick_count)
        
        # Process movement inputs
        inputs = game.pending_inputs.copy()
        game.pending_inputs.clear()
        
        for input_data in inputs:
            player = game.players.get(input_data.player_id)
            if not player:
                logger.warning(f"[TICK] Player {input_data.player_id} not found in game. Known players: {list(game.players.keys())}")
                continue
            
            is_valid, reason = self._validator.validate(game, player, input_data)
            
            if is_valid:
                player.x = input_data.x
                player.y = input_data.y
                player.velocity_x = input_data.direction_x * self._movement_config.max_speed_px_per_sec
                player.velocity_y = input_data.direction_y * self._movement_config.max_speed_px_per_sec
                player.last_input_sequence = input_data.sequence
                player.last_input_tick = game.tick_count
                player.last_valid_position = (input_data.x, input_data.y)
            else:
                print(f"[TICK] Rejected input from {input_data.player_id}: {reason}")
            
            if player.is_kicked and self._kick_callback:
                await self._kick_callback(game.lobby_id, player.player_id, "violations")
        
        # Process fire inputs (combat)
        if game.combat_system:
            fire_inputs = game.pending_fire_inputs.copy()
            game.pending_fire_inputs.clear()
            
            for fire_input in fire_inputs:
                player = game.players.get(fire_input.player_id)
                if player:
                    game.combat_system.process_fire(
                        fire_input.player_id,
                        (player.x, player.y),
                        (fire_input.direction_x, fire_input.direction_y),
                        fire_input.client_timestamp,
                    )
            
            # Get current player positions for combat update
            player_positions = {
                pid: (p.x, p.y)
                for pid, p in game.players.items()
                if not p.is_kicked
            }
            
            # Update combat simulation
            game.combat_system.update(tick_duration, player_positions)
        
        # Update arena systems (hazards, traps, transport)
        if game.arena_systems:
            # Check transport (teleporters, jump pads) and apply position changes
            for player_id, player in game.players.items():
                if player.is_kicked:
                    continue
                pos = (player.x, player.y)
                
                # Check teleport
                dest = game.arena_systems.check_teleport(player_id, pos)
                if dest:
                    player.x, player.y = dest
                    player.last_valid_position = dest
                
                # Check jump pad
                velocity = game.arena_systems.check_jump_pad(player_id, pos)
                if velocity:
                    player.velocity_x, player.velocity_y = velocity
            
            # Update hazards and traps
            game.arena_systems.update(tick_duration, player_positions)
        
        # Update dynamic spawns
        if game.dynamic_spawns and game.arena_systems:
            spawn_result = game.dynamic_spawns.update(current_time)
            
            # Add new hazards
            for hazard_cfg in spawn_result.get("new_hazards", []):
                game.arena_systems.add_hazard(
                    hazard_cfg["id"],
                    HazardType(hazard_cfg["type"]),
                    hazard_cfg["bounds"]["x"],
                    hazard_cfg["bounds"]["y"],
                    hazard_cfg["bounds"]["width"],
                    hazard_cfg["bounds"]["height"],
                    hazard_cfg.get("intensity", 1.0),
                    hazard_cfg.get("despawn_time")
                )
            
            # Add new traps
            for trap_cfg in spawn_result.get("new_traps", []):
                game.arena_systems.add_trap(
                    trap_cfg["id"],
                    TrapType(trap_cfg["type"]),
                    trap_cfg["position"]["x"],
                    trap_cfg["position"]["y"],
                    trap_cfg["radius"],
                    TrapEffect(trap_cfg["effect"]),
                    trap_cfg.get("effectValue", 10),
                    trap_cfg.get("cooldown", 5.0),
                    trap_cfg.get("interval"),
                    trap_cfg.get("chainRadius"),
                    trap_cfg.get("despawn_time")
                )
        
        # Update buffs (expire old ones)
        if game.buff_manager:
            expired_buffs = game.buff_manager.update(current_time)
            # Could broadcast buff expiry events here if needed
        
        # Record history
        for player in game.players.values():
            self._lag_comp.record_position(player, current_time, game.tick_count)
        
        # Broadcast
        if game.tick_count % self._tick_config.broadcast_divisor == 0:
            await self._broadcast_state(game)
    
    async def _broadcast_state(self, game: GameState) -> None:
        """Broadcast state to clients."""
        if not self._broadcast_callback:
            return
        
        players_state = {
            pid: {
                "x": round(p.x, 1),
                "y": round(p.y, 1),
                "vx": round(p.velocity_x, 1),
                "vy": round(p.velocity_y, 1),
                "seq": p.last_input_sequence,
            }
            for pid, p in game.players.items()
            if not p.is_kicked
        }
        
        # Build state payload
        payload = {
            "tick": game.tick_count,
            "timestamp": time.time(),
            "players": players_state,
        }
        
        # Add combat state if available
        if game.combat_system:
            combat_state = game.combat_system.get_combat_state()
            payload["combat"] = combat_state
            
            # Get and broadcast combat events
            events = game.combat_system.get_and_clear_events()
            if events:
                for event in events:
                    event_msg = {
                        "type": f"combat_{event.event_type}",
                        "payload": event.data,
                    }
                    try:
                        await self._broadcast_callback(game.lobby_id, event_msg)
                    except Exception as e:
                        logger.error(f"Combat event broadcast failed: {e}")
        
        # Add arena state if available
        if game.arena_systems:
            arena_state = game.arena_systems.get_arena_state()
            payload["arena"] = arena_state
            
            # Get and broadcast arena events
            arena_events = game.arena_systems.get_and_clear_events()
            if arena_events:
                for event in arena_events:
                    event_msg = {
                        "type": f"arena_{event.event_type}",
                        "payload": event.data,
                    }
                    try:
                        await self._broadcast_callback(game.lobby_id, event_msg)
                    except Exception as e:
                        logger.error(f"Arena event broadcast failed: {e}")
        
        # Add buff state if available
        if game.buff_manager:
            payload["buffs"] = game.buff_manager.get_buff_state_for_broadcast()
        
        state = {
            "type": "state_update",
            "payload": payload,
        }
        
        # Log every 300 ticks (once per 5 seconds at 60Hz tick rate)
        if game.tick_count % 300 == 0:
            print(f"[TICK] State at tick {game.tick_count}: {players_state}")
        
        try:
            await self._broadcast_callback(game.lobby_id, state)
        except Exception as e:
            logger.error(f"Broadcast failed: {e}")


    def get_arena_state(self, lobby_id: str) -> Optional[dict]:
        """Get current arena state for a game."""
        game = self._games.get(lobby_id)
        if not game or not game.arena_systems:
            return None
        return game.arena_systems.get_arena_state()
    
    def get_buff_state(self, lobby_id: str) -> Optional[dict]:
        """Get current buff state for a game."""
        game = self._games.get(lobby_id)
        if not game or not game.buff_manager:
            return None
        return game.buff_manager.get_buff_state_for_broadcast()


# Global instance
tick_system = TickSystem()
