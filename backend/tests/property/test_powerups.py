"""Property-based tests for power-up system."""

from hypothesis import given, strategies as st, settings, assume
import pytest

from app.services.powerup_service import PowerUpService, PowerUpType, SPAWN_POINTS


class TestPowerUpService:
    """Tests for PowerUpService."""
    
    @given(st.text(min_size=1, max_size=36, alphabet=st.characters(whitelist_categories=('L', 'N'))))
    @settings(max_examples=50)
    def test_initialize_spawns_correct_count(self, lobby_id: str):
        """Property: Initialize spawns 3-5 power-ups."""
        # Feature: trivia-battle-frontend, Property: Power-up spawn count
        assume(len(lobby_id) > 0)
        service = PowerUpService()
        powerups = service.initialize_for_lobby(lobby_id)
        
        assert 3 <= len(powerups) <= 5
        
        # Cleanup
        service.cleanup_lobby(lobby_id)
    
    @given(st.text(min_size=1, max_size=36, alphabet=st.characters(whitelist_categories=('L', 'N'))))
    @settings(max_examples=50)
    def test_powerups_have_valid_types(self, lobby_id: str):
        """Property: All spawned power-ups have valid types."""
        assume(len(lobby_id) > 0)
        service = PowerUpService()
        powerups = service.initialize_for_lobby(lobby_id)
        
        valid_types = {PowerUpType.SOS, PowerUpType.TIME_STEAL, PowerUpType.SHIELD, PowerUpType.DOUBLE_POINTS}
        for powerup in powerups:
            assert powerup.type in valid_types
        
        service.cleanup_lobby(lobby_id)
    
    @given(st.text(min_size=1, max_size=36, alphabet=st.characters(whitelist_categories=('L', 'N'))))
    @settings(max_examples=50)
    def test_powerups_at_valid_spawn_points(self, lobby_id: str):
        """Property: All power-ups spawn at valid spawn points."""
        assume(len(lobby_id) > 0)
        service = PowerUpService()
        powerups = service.initialize_for_lobby(lobby_id)
        
        valid_positions = {(float(x), float(y)) for x, y in SPAWN_POINTS}
        for powerup in powerups:
            assert (powerup.x, powerup.y) in valid_positions
        
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
    
    @given(st.sampled_from(["A", "B", "C", "D"]))
    @settings(max_examples=20)
    def test_sos_never_eliminates_correct_answer(self, correct: str):
        """Property: SOS never eliminates the correct answer."""
        service = PowerUpService()
        options = ["Option A", "Option B", "Option C", "Option D"]
        
        for _ in range(50):
            eliminated = service.apply_sos(correct, options)
            assert correct not in eliminated
    
    def test_collect_powerup_marks_as_collected(self):
        """Property: Collecting a power-up marks it as collected."""
        service = PowerUpService()
        lobby_id = "test-lobby"
        service.initialize_for_lobby(lobby_id)
        
        powerups = service.get_powerups(lobby_id)
        if powerups:
            powerup_id = powerups[0].id
            result = service.collect_powerup(lobby_id, powerup_id, [])
            
            assert result is not None
            assert result.collected is True
            
            # Should not be in active powerups anymore
            active = service.get_powerups(lobby_id)
            assert all(p.id != powerup_id for p in active)
        
        service.cleanup_lobby(lobby_id)
    
    def test_cannot_collect_same_powerup_twice(self):
        """Property: Cannot collect the same power-up twice."""
        service = PowerUpService()
        lobby_id = "test-lobby"
        service.initialize_for_lobby(lobby_id)
        
        powerups = service.get_powerups(lobby_id)
        if powerups:
            powerup_id = powerups[0].id
            
            # First collection should succeed
            result1 = service.collect_powerup(lobby_id, powerup_id, [])
            assert result1 is not None
            
            # Second collection should fail
            result2 = service.collect_powerup(lobby_id, powerup_id, [])
            assert result2 is None
        
        service.cleanup_lobby(lobby_id)
    
    def test_cleanup_removes_all_powerups(self):
        """Property: Cleanup removes all power-ups for a lobby."""
        service = PowerUpService()
        lobby_id = "test-lobby"
        service.initialize_for_lobby(lobby_id)
        
        assert len(service.get_powerups(lobby_id)) > 0
        
        service.cleanup_lobby(lobby_id)
        
        assert len(service.get_powerups(lobby_id)) == 0
        assert lobby_id not in service.active_powerups
    
    def test_spawn_new_powerup_at_unoccupied_point(self):
        """Property: New power-ups spawn at unoccupied points."""
        service = PowerUpService()
        lobby_id = "test-lobby"
        service.initialize_for_lobby(lobby_id)
        
        initial_positions = {(p.x, p.y) for p in service.get_powerups(lobby_id)}
        
        new_powerup = service.spawn_new_powerup(lobby_id)
        if new_powerup:
            # New powerup should be at a position not in initial set
            # (unless all were collected, which they weren't)
            assert (new_powerup.x, new_powerup.y) not in initial_positions or len(initial_positions) == len(SPAWN_POINTS)
        
        service.cleanup_lobby(lobby_id)
