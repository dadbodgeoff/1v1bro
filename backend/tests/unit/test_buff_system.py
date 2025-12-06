"""
Unit tests for the buff system.
Tests BuffManager, QuizRewardDispatcher, and combat integration.
"""

import time
import pytest
from app.game.buffs import BuffManager, BuffType, Buff
from app.game.quiz_rewards import QuizRewardDispatcher, QuizRewardConfig
from app.game.combat import ServerCombatSystem


class TestBuffManager:
    """Tests for BuffManager."""

    def test_init_player(self):
        """Test player initialization."""
        bm = BuffManager()
        bm.init_player("player1")
        
        assert bm.get_active_buffs("player1") == []
        assert bm.get_damage_multiplier("player1") == 1.0
        assert bm.get_speed_multiplier("player1") == 1.0

    def test_apply_buff(self):
        """Test applying a buff."""
        bm = BuffManager()
        bm.init_player("player1")
        
        buff = bm.apply_buff(
            player_id="player1",
            buff_type=BuffType.DAMAGE_BOOST,
            value=0.20,
            duration_s=4.0,
            source="test"
        )
        
        assert buff is not None
        assert buff.buff_type == BuffType.DAMAGE_BOOST
        assert buff.value == 0.20
        assert buff.source == "test"

    def test_damage_multiplier(self):
        """Test damage multiplier calculation."""
        bm = BuffManager()
        bm.init_player("player1")
        
        # No buff
        assert bm.get_damage_multiplier("player1") == 1.0
        
        # With 20% damage boost
        bm.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.20, 4.0, "test")
        assert bm.get_damage_multiplier("player1") == 1.2

    def test_vulnerability_multiplier(self):
        """Test vulnerability multiplier calculation."""
        bm = BuffManager()
        bm.init_player("player1")
        
        # No buff
        assert bm.get_damage_taken_multiplier("player1") == 1.0
        
        # With 15% vulnerability
        bm.apply_buff("player1", BuffType.VULNERABILITY, 0.15, 2.0, "test")
        assert bm.get_damage_taken_multiplier("player1") == 1.15

    def test_speed_multiplier(self):
        """Test speed multiplier calculation."""
        bm = BuffManager()
        bm.init_player("player1")
        
        # No buff
        assert bm.get_speed_multiplier("player1") == 1.0
        
        # With 15% speed boost
        bm.apply_buff("player1", BuffType.SPEED_BOOST, 0.15, 3.0, "test")
        assert bm.get_speed_multiplier("player1") == 1.15

    def test_invulnerable_blocks_damage(self):
        """Test invulnerable buff blocks all damage."""
        bm = BuffManager()
        bm.init_player("player1")
        
        bm.apply_buff("player1", BuffType.INVULNERABLE, 1.0, 2.0, "test")
        assert bm.get_damage_taken_multiplier("player1") == 0.0

    def test_buff_replacement(self):
        """Test that applying same buff type replaces existing."""
        bm = BuffManager()
        bm.init_player("player1")
        
        bm.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.10, 4.0, "first")
        bm.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.30, 4.0, "second")
        
        buffs = bm.get_active_buffs("player1")
        assert len(buffs) == 1
        assert buffs[0].value == 0.30
        assert buffs[0].source == "second"

    def test_buff_expiration(self):
        """Test buff expiration."""
        bm = BuffManager()
        bm.init_player("player1")
        
        # Apply buff that expires immediately
        bm.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.20, 0.0, "test")
        
        # Update should remove expired buff
        expired = bm.update(time.time() + 1)
        
        assert "player1" in expired
        assert bm.get_damage_multiplier("player1") == 1.0

    def test_broadcast_state(self):
        """Test buff state for broadcast."""
        bm = BuffManager()
        bm.init_player("player1")
        bm.init_player("player2")
        
        bm.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.20, 4.0, "quiz_fast")
        bm.apply_buff("player2", BuffType.VULNERABILITY, 0.15, 2.0, "quiz_wrong")
        
        state = bm.get_buff_state_for_broadcast()
        
        assert "player1" in state
        assert "player2" in state
        assert len(state["player1"]) == 1
        assert state["player1"][0]["type"] == "damage_boost"
        assert state["player2"][0]["type"] == "vulnerability"

    def test_clear_player(self):
        """Test clearing player buffs."""
        bm = BuffManager()
        bm.init_player("player1")
        
        bm.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.20, 4.0, "test")
        bm.clear_player("player1")
        
        assert bm.get_active_buffs("player1") == []


class TestQuizRewardDispatcher:
    """Tests for QuizRewardDispatcher."""

    def test_fast_correct_answer(self):
        """Test fast correct answer gives damage boost."""
        bm = BuffManager()
        bm.init_player("player1")
        dispatcher = QuizRewardDispatcher(bm)
        
        result = dispatcher.dispatch_reward(
            player_id="player1",
            is_correct=True,
            time_ms=3000,  # 10% of 30000ms = fast
            question_time_ms=30000
        )
        
        assert result is not None
        buff_type, value, duration = result
        assert buff_type == BuffType.DAMAGE_BOOST
        assert value == 0.20
        assert duration == 4.0

    def test_normal_correct_answer(self):
        """Test normal correct answer gives speed boost."""
        bm = BuffManager()
        bm.init_player("player1")
        dispatcher = QuizRewardDispatcher(bm)
        
        result = dispatcher.dispatch_reward(
            player_id="player1",
            is_correct=True,
            time_ms=15000,  # 50% of 30000ms = normal
            question_time_ms=30000
        )
        
        assert result is not None
        buff_type, value, duration = result
        assert buff_type == BuffType.SPEED_BOOST
        assert value == 0.15
        assert duration == 3.0

    def test_wrong_answer(self):
        """Test wrong answer gives vulnerability."""
        bm = BuffManager()
        bm.init_player("player1")
        dispatcher = QuizRewardDispatcher(bm)
        
        result = dispatcher.dispatch_reward(
            player_id="player1",
            is_correct=False,
            time_ms=30000,
            question_time_ms=30000
        )
        
        assert result is not None
        buff_type, value, duration = result
        assert buff_type == BuffType.VULNERABILITY
        assert value == 0.15
        assert duration == 2.0

    def test_dispatch_for_round(self):
        """Test dispatching rewards for a full round."""
        bm = BuffManager()
        bm.init_player("player1")
        bm.init_player("player2")
        dispatcher = QuizRewardDispatcher(bm)
        
        round_result = {
            "answers": {"player1": "A", "player2": "B"},
            "scores": {"player1": 900, "player2": 0}  # player1 correct, player2 wrong
        }
        
        rewards = dispatcher.dispatch_for_round(round_result, 30000)
        
        assert "player1" in rewards
        assert "player2" in rewards
        assert rewards["player1"]["is_correct"] is True
        assert rewards["player2"]["is_correct"] is False


class TestCombatBuffIntegration:
    """Tests for combat system buff integration."""

    def test_damage_boost_applied(self):
        """Test damage boost affects combat damage."""
        bm = BuffManager()
        bm.init_player("player1")
        bm.init_player("player2")
        
        combat = ServerCombatSystem(buff_manager=bm)
        combat.init_player("player1")
        combat.init_player("player2")
        
        # Apply damage boost to shooter
        bm.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.20, 4.0, "test")
        
        health_before = combat._combat_states["player2"].health
        combat._apply_damage("player2", "player1", 10, time.time())
        health_after = combat._combat_states["player2"].health
        
        # 10 * 1.2 = 12 damage
        assert health_before - health_after == 12

    def test_vulnerability_applied(self):
        """Test vulnerability affects damage taken."""
        bm = BuffManager()
        bm.init_player("player1")
        bm.init_player("player2")
        
        combat = ServerCombatSystem(buff_manager=bm)
        combat.init_player("player1")
        combat.init_player("player2")
        
        # Apply vulnerability to target
        bm.apply_buff("player2", BuffType.VULNERABILITY, 0.15, 2.0, "test")
        
        health_before = combat._combat_states["player2"].health
        combat._apply_damage("player2", "player1", 10, time.time())
        health_after = combat._combat_states["player2"].health
        
        # 10 * 1.15 = 11.5 -> 11 damage
        assert health_before - health_after == 11

    def test_combined_modifiers(self):
        """Test damage boost + vulnerability stack."""
        bm = BuffManager()
        bm.init_player("player1")
        bm.init_player("player2")
        
        combat = ServerCombatSystem(buff_manager=bm)
        combat.init_player("player1")
        combat.init_player("player2")
        
        # Shooter has damage boost, target has vulnerability
        bm.apply_buff("player1", BuffType.DAMAGE_BOOST, 0.20, 4.0, "test")
        bm.apply_buff("player2", BuffType.VULNERABILITY, 0.15, 2.0, "test")
        
        health_before = combat._combat_states["player2"].health
        combat._apply_damage("player2", "player1", 10, time.time())
        health_after = combat._combat_states["player2"].health
        
        # 10 * 1.2 * 1.15 = 13.8 -> 13 damage
        assert health_before - health_after == 13
