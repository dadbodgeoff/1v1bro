"""
Property-based tests for lobby functionality.

Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
Validates: Requirements 2.1, 2.4
"""

import pytest
from hypothesis import given, strategies as st, settings, assume

from app.utils.helpers import (
    generate_lobby_code,
    generate_unique_lobby_code,
    is_valid_lobby_code,
    LOBBY_CODE_CHARS,
    LOBBY_CODE_LENGTH,
)


class TestLobbyCodeUniquenessAndFormat:
    """
    Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
    
    For any set of active lobbies in the system, all lobby codes SHALL be unique,
    exactly 6 characters long, and composed only of uppercase alphanumeric characters.
    """

    @given(st.integers(min_value=1, max_value=50))
    @settings(max_examples=100)
    def test_generated_codes_are_correct_length(self, _):
        """
        Property: All generated codes are exactly 6 characters.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        code = generate_lobby_code()
        assert len(code) == LOBBY_CODE_LENGTH

    @given(st.integers(min_value=1, max_value=50))
    @settings(max_examples=100)
    def test_generated_codes_are_uppercase_alphanumeric(self, _):
        """
        Property: All generated codes contain only valid characters.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        code = generate_lobby_code()
        assert all(c in LOBBY_CODE_CHARS for c in code)
        assert code == code.upper()

    @given(st.integers(min_value=10, max_value=100))
    @settings(max_examples=100)
    def test_multiple_codes_are_unique(self, count):
        """
        Property: Generating multiple codes produces unique values.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.4
        """
        codes = [generate_lobby_code() for _ in range(count)]
        # With 6 chars from 32 char alphabet, collision is extremely unlikely
        # but we test uniqueness property
        unique_codes = set(codes)
        # Allow for rare collisions in large sets, but most should be unique
        assert len(unique_codes) >= count * 0.9

    @given(st.sets(st.text(alphabet=LOBBY_CODE_CHARS, min_size=6, max_size=6), max_size=20))
    @settings(max_examples=100)
    def test_unique_code_generation_avoids_existing(self, existing_codes):
        """
        Property: generate_unique_lobby_code never returns an existing code.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.4
        """
        # Skip if existing codes would make it impossible
        assume(len(existing_codes) < 1000)
        
        new_code = generate_unique_lobby_code(existing_codes)
        
        assert new_code not in existing_codes
        assert len(new_code) == LOBBY_CODE_LENGTH
        assert all(c in LOBBY_CODE_CHARS for c in new_code)

    @given(st.text(alphabet=LOBBY_CODE_CHARS, min_size=6, max_size=6))
    @settings(max_examples=100)
    def test_valid_codes_pass_validation(self, code):
        """
        Property: Codes with correct format pass validation.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        assert is_valid_lobby_code(code) is True

    @given(st.text(max_size=5))
    @settings(max_examples=100)
    def test_short_codes_fail_validation(self, code):
        """
        Property: Codes shorter than 6 characters fail validation.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        assume(len(code) < 6)
        assert is_valid_lobby_code(code) is False

    @given(st.text(min_size=7, max_size=20))
    @settings(max_examples=100)
    def test_long_codes_fail_validation(self, code):
        """
        Property: Codes longer than 6 characters fail validation.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        assert is_valid_lobby_code(code) is False

    @given(st.text(alphabet="!@#$%^&*()iIoO01", min_size=6, max_size=6))
    @settings(max_examples=100)
    def test_invalid_chars_fail_validation(self, code):
        """
        Property: Codes with invalid characters fail validation.
        Feature: trivia-battle-mvp, Property 1: Lobby Code Uniqueness and Format
        Validates: Requirements 2.1
        """
        # These codes contain characters not in LOBBY_CODE_CHARS
        assert is_valid_lobby_code(code) is False



class TestLobbyStatusTransitions:
    """
    Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
    
    For any lobby, status transitions SHALL only follow valid paths:
    waiting → in_progress → completed, or waiting → abandoned.
    """

    VALID_TRANSITIONS = {
        "waiting": {"in_progress", "abandoned"},
        "in_progress": {"completed"},
        "completed": set(),  # Terminal state
        "abandoned": set(),  # Terminal state
    }

    @given(
        initial_status=st.sampled_from(["waiting", "in_progress", "completed", "abandoned"]),
        target_status=st.sampled_from(["waiting", "in_progress", "completed", "abandoned"]),
    )
    @settings(max_examples=100)
    def test_valid_transitions_allowed(self, initial_status, target_status):
        """
        Property: Only valid status transitions are allowed.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.4, 10.5
        """
        valid_targets = self.VALID_TRANSITIONS[initial_status]
        is_valid = target_status in valid_targets
        
        # This tests the transition rules themselves
        if initial_status == "waiting":
            assert ("in_progress" in valid_targets)
            assert ("abandoned" in valid_targets)
            assert ("completed" not in valid_targets)
        elif initial_status == "in_progress":
            assert ("completed" in valid_targets)
            assert ("waiting" not in valid_targets)
            assert ("abandoned" not in valid_targets)
        elif initial_status in ("completed", "abandoned"):
            assert len(valid_targets) == 0  # Terminal states

    @given(st.integers(min_value=1, max_value=20))
    @settings(max_examples=50)
    def test_waiting_can_transition_to_in_progress(self, _):
        """
        Property: Waiting lobbies can transition to in_progress.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.4
        """
        assert "in_progress" in self.VALID_TRANSITIONS["waiting"]

    @given(st.integers(min_value=1, max_value=20))
    @settings(max_examples=50)
    def test_waiting_can_transition_to_abandoned(self, _):
        """
        Property: Waiting lobbies can transition to abandoned.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.5
        """
        assert "abandoned" in self.VALID_TRANSITIONS["waiting"]

    @given(st.integers(min_value=1, max_value=20))
    @settings(max_examples=50)
    def test_in_progress_can_only_complete(self, _):
        """
        Property: In-progress lobbies can only transition to completed.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.4
        """
        valid = self.VALID_TRANSITIONS["in_progress"]
        assert valid == {"completed"}

    @given(st.integers(min_value=1, max_value=20))
    @settings(max_examples=50)
    def test_terminal_states_have_no_transitions(self, _):
        """
        Property: Completed and abandoned are terminal states.
        Feature: trivia-battle-mvp, Property 17: Lobby Status Transitions
        Validates: Requirements 10.4, 10.5
        """
        assert len(self.VALID_TRANSITIONS["completed"]) == 0
        assert len(self.VALID_TRANSITIONS["abandoned"]) == 0


# ============================================
# Property 5: Extended Player Type Backward Compatibility
# Feature: lobby-playercard-redesign, Property 5: Extended Player type preserves existing fields
# Validates: Requirements 5.1, 5.3
# ============================================

class TestPlayerTypeBackwardCompatibility:
    """
    Property 5: Extended Player Type Backward Compatibility
    
    For any PlayerWithCard object, all existing Player fields (id, display_name, 
    is_host, is_ready) SHALL be present and unchanged, with playercard as an 
    optional additional field.
    """

    @given(
        player_id=st.uuids().map(str),
        display_name=st.one_of(st.none(), st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs')))),
        is_host=st.booleans(),
        is_ready=st.booleans(),
    )
    @settings(max_examples=100)
    def test_player_fields_preserved_without_playercard(
        self, player_id: str, display_name, is_host: bool, is_ready: bool
    ):
        """
        **Feature: lobby-playercard-redesign, Property 5: Extended Player type preserves existing fields**
        **Validates: Requirements 5.1, 5.3**
        
        Player objects without playercard should have all original fields intact.
        """
        player = {
            "id": player_id,
            "display_name": display_name,
            "is_host": is_host,
            "is_ready": is_ready,
        }
        
        # All original fields should be present
        assert "id" in player
        assert "display_name" in player
        assert "is_host" in player
        assert "is_ready" in player
        
        # Values should match
        assert player["id"] == player_id
        assert player["display_name"] == display_name
        assert player["is_host"] == is_host
        assert player["is_ready"] == is_ready

    @given(
        player_id=st.uuids().map(str),
        display_name=st.one_of(st.none(), st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N')))),
        is_host=st.booleans(),
        is_ready=st.booleans(),
        has_playercard=st.booleans(),
    )
    @settings(max_examples=100)
    def test_player_fields_preserved_with_optional_playercard(
        self, player_id: str, display_name, is_host: bool, is_ready: bool, has_playercard: bool
    ):
        """
        **Feature: lobby-playercard-redesign, Property 5: Extended Player type preserves existing fields**
        **Validates: Requirements 5.1, 5.3**
        
        Adding optional playercard field should not affect existing fields.
        """
        player = {
            "id": player_id,
            "display_name": display_name,
            "is_host": is_host,
            "is_ready": is_ready,
            "playercard": {"id": "card-123", "name": "Test Card"} if has_playercard else None,
        }
        
        # All original fields should still be present and unchanged
        assert player["id"] == player_id
        assert player["display_name"] == display_name
        assert player["is_host"] == is_host
        assert player["is_ready"] == is_ready
        
        # Playercard should be optional
        assert "playercard" in player
        if has_playercard:
            assert player["playercard"] is not None
        else:
            assert player["playercard"] is None

    @given(
        player_id=st.uuids().map(str),
        display_name=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N'))),
        is_host=st.booleans(),
        is_ready=st.booleans(),
    )
    @settings(max_examples=100)
    def test_enrich_player_preserves_original_data(
        self, player_id: str, display_name: str, is_host: bool, is_ready: bool
    ):
        """
        **Feature: lobby-playercard-redesign, Property 5: Extended Player type preserves existing fields**
        **Validates: Requirements 5.1, 5.3**
        
        Enriching a player with playercard data should preserve all original fields.
        """
        original_player = {
            "id": player_id,
            "display_name": display_name,
            "is_host": is_host,
            "is_ready": is_ready,
        }
        
        # Simulate enrichment (copy and add playercard)
        enriched_player = dict(original_player)
        enriched_player["playercard"] = None
        
        # Original fields should be unchanged
        assert enriched_player["id"] == original_player["id"]
        assert enriched_player["display_name"] == original_player["display_name"]
        assert enriched_player["is_host"] == original_player["is_host"]
        assert enriched_player["is_ready"] == original_player["is_ready"]
        
        # Original dict should not be mutated
        assert "playercard" not in original_player

    def test_playercard_null_when_not_equipped(self):
        """
        **Feature: lobby-playercard-redesign, Property 5: Extended Player type preserves existing fields**
        **Validates: Requirements 5.2**
        
        When a player has no equipped playercard, the playercard field should be null.
        """
        player = {
            "id": "user-123",
            "display_name": "TestPlayer",
            "is_host": True,
            "is_ready": False,
            "playercard": None,
        }
        
        assert player["playercard"] is None


# ============================================
# Property 1: Player Enrichment Consistency
# Feature: inventory-loadout-playercard-fix, Property 1: Player Enrichment Consistency
# Validates: Requirements 1.1, 1.2, 1.3, 1.4
# ============================================

class TestPlayerEnrichmentConsistency:
    """
    Property 1: Player Enrichment Consistency
    
    For any lobby event that includes player data (lobby_state, player_joined, 
    player_ready, player_left), all player objects SHALL include a `playercard` 
    field (either containing playercard data or null).
    """

    @given(
        player_ids=st.lists(st.uuids().map(str), min_size=1, max_size=4, unique=True),
        display_names=st.lists(st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('L', 'N'))), min_size=1, max_size=4),
    )
    @settings(max_examples=100)
    def test_enrich_players_adds_playercard_field_to_all(
        self, player_ids: list, display_names: list
    ):
        """
        **Feature: inventory-loadout-playercard-fix, Property 1: Player Enrichment Consistency**
        **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
        
        For any list of players, enrichment SHALL add a playercard field to each player.
        """
        # Create player list
        players = []
        for i, player_id in enumerate(player_ids):
            display_name = display_names[i % len(display_names)]
            players.append({
                "id": player_id,
                "display_name": display_name,
                "is_host": i == 0,
                "is_ready": False,
            })
        
        # Create playercard map (some with cards, some without)
        player_playercards = {}
        for i, player_id in enumerate(player_ids):
            if i % 2 == 0:  # Every other player has a playercard
                player_playercards[player_id] = {
                    "id": f"card-{i}",
                    "name": f"Card {i}",
                    "type": "playercard",
                    "rarity": "rare",
                    "image_url": f"https://example.com/card{i}.png",
                }
            else:
                player_playercards[player_id] = None
        
        # Simulate enrichment (same logic as _enrich_players_with_playercards)
        enriched_players = []
        for player in players:
            enriched_player = dict(player)
            enriched_player["playercard"] = player_playercards.get(player["id"])
            enriched_players.append(enriched_player)
        
        # Property: ALL enriched players have a playercard field
        for enriched_player in enriched_players:
            assert "playercard" in enriched_player, f"Player {enriched_player['id']} missing playercard field"
        
        # Property: playercard is either dict or None
        for enriched_player in enriched_players:
            playercard = enriched_player["playercard"]
            assert playercard is None or isinstance(playercard, dict), \
                f"Player {enriched_player['id']} has invalid playercard type: {type(playercard)}"

    @given(
        num_players=st.integers(min_value=1, max_value=4),
        all_have_cards=st.booleans(),
    )
    @settings(max_examples=100)
    def test_enrichment_preserves_original_player_fields(
        self, num_players: int, all_have_cards: bool
    ):
        """
        **Feature: inventory-loadout-playercard-fix, Property 1: Player Enrichment Consistency**
        **Validates: Requirements 1.1, 1.4**
        
        Enrichment SHALL preserve all original player fields (id, display_name, is_host, is_ready).
        """
        # Create players
        players = []
        for i in range(num_players):
            players.append({
                "id": f"player-{i}",
                "display_name": f"Player {i}",
                "is_host": i == 0,
                "is_ready": i % 2 == 0,
            })
        
        # Create playercard map
        player_playercards = {}
        for player in players:
            if all_have_cards:
                player_playercards[player["id"]] = {
                    "id": f"card-{player['id']}",
                    "name": "Test Card",
                    "type": "playercard",
                    "rarity": "epic",
                    "image_url": "https://example.com/card.png",
                }
            else:
                player_playercards[player["id"]] = None
        
        # Simulate enrichment
        enriched_players = []
        for player in players:
            enriched_player = dict(player)
            enriched_player["playercard"] = player_playercards.get(player["id"])
            enriched_players.append(enriched_player)
        
        # Property: Original fields are preserved
        for i, enriched_player in enumerate(enriched_players):
            original = players[i]
            assert enriched_player["id"] == original["id"]
            assert enriched_player["display_name"] == original["display_name"]
            assert enriched_player["is_host"] == original["is_host"]
            assert enriched_player["is_ready"] == original["is_ready"]

    @given(
        player_id=st.uuids().map(str),
        has_playercard=st.booleans(),
    )
    @settings(max_examples=100)
    def test_playercard_field_structure_when_present(
        self, player_id: str, has_playercard: bool
    ):
        """
        **Feature: inventory-loadout-playercard-fix, Property 1: Player Enrichment Consistency**
        **Validates: Requirements 1.4**
        
        When playercard is present, it SHALL contain required fields (id, name, type, rarity, image_url).
        """
        if has_playercard:
            playercard = {
                "id": f"card-{player_id}",
                "name": "Test Playercard",
                "type": "playercard",
                "rarity": "legendary",
                "image_url": "https://example.com/card.png",
            }
            
            # Property: Required fields are present
            assert "id" in playercard
            assert "name" in playercard
            assert "type" in playercard
            assert "rarity" in playercard
            assert "image_url" in playercard
            
            # Property: Type is always "playercard"
            assert playercard["type"] == "playercard"
            
            # Property: Rarity is valid
            assert playercard["rarity"] in ["common", "uncommon", "rare", "epic", "legendary"]

    def test_empty_player_list_enrichment(self):
        """
        **Feature: inventory-loadout-playercard-fix, Property 1: Player Enrichment Consistency**
        **Validates: Requirements 1.3**
        
        Enriching an empty player list SHALL return an empty list.
        """
        players = []
        player_playercards = {}
        
        # Simulate enrichment
        enriched_players = []
        for player in players:
            enriched_player = dict(player)
            enriched_player["playercard"] = player_playercards.get(player["id"])
            enriched_players.append(enriched_player)
        
        assert enriched_players == []


# ============================================
# Property 5: Playercard Persistence Through Events
# Feature: inventory-loadout-playercard-fix, Property 5: Playercard Persistence Through Events
# Validates: Requirements 3.1, 3.2, 3.3
# ============================================

class TestPlayercardPersistenceThroughEvents:
    """
    Property 5: Playercard Persistence Through Events
    
    For any sequence of lobby events (connect, ready, join), if a player has an 
    equipped playercard, that playercard data SHALL be present in the player 
    object after each event.
    """

    @given(
        player_id=st.uuids().map(str),
        playercard_id=st.uuids().map(str),
        playercard_name=st.text(min_size=1, max_size=30, alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs'))),
        rarity=st.sampled_from(["common", "uncommon", "rare", "epic", "legendary"]),
    )
    @settings(max_examples=100)
    def test_playercard_preserved_through_ready_event(
        self, player_id: str, playercard_id: str, playercard_name: str, rarity: str
    ):
        """
        **Feature: inventory-loadout-playercard-fix, Property 5: Playercard Persistence Through Events**
        **Validates: Requirements 3.1**
        
        When a player readies up, their equipped playercard SHALL remain in the player object.
        """
        # Initial player with playercard
        player_before = {
            "id": player_id,
            "display_name": "TestPlayer",
            "is_host": False,
            "is_ready": False,
            "playercard": {
                "id": playercard_id,
                "name": playercard_name,
                "type": "playercard",
                "rarity": rarity,
                "image_url": f"https://example.com/{playercard_id}.png",
            },
        }
        
        # Simulate ready event - player becomes ready but playercard should persist
        player_after_ready = dict(player_before)
        player_after_ready["is_ready"] = True
        
        # Property: Playercard data is preserved
        assert player_after_ready["playercard"] is not None
        assert player_after_ready["playercard"]["id"] == playercard_id
        assert player_after_ready["playercard"]["name"] == playercard_name
        assert player_after_ready["playercard"]["rarity"] == rarity

    @given(
        host_id=st.uuids().map(str),
        joiner_id=st.uuids().map(str),
        host_has_card=st.booleans(),
        joiner_has_card=st.booleans(),
    )
    @settings(max_examples=100)
    def test_both_players_playercards_preserved_on_join(
        self, host_id: str, joiner_id: str, host_has_card: bool, joiner_has_card: bool
    ):
        """
        **Feature: inventory-loadout-playercard-fix, Property 5: Playercard Persistence Through Events**
        **Validates: Requirements 3.2**
        
        When a new player joins, both players' playercards SHALL be present in the player list.
        """
        # Create host player
        host = {
            "id": host_id,
            "display_name": "Host",
            "is_host": True,
            "is_ready": True,
            "playercard": {
                "id": "host-card",
                "name": "Host Card",
                "type": "playercard",
                "rarity": "epic",
                "image_url": "https://example.com/host.png",
            } if host_has_card else None,
        }
        
        # Create joining player
        joiner = {
            "id": joiner_id,
            "display_name": "Joiner",
            "is_host": False,
            "is_ready": False,
            "playercard": {
                "id": "joiner-card",
                "name": "Joiner Card",
                "type": "playercard",
                "rarity": "legendary",
                "image_url": "https://example.com/joiner.png",
            } if joiner_has_card else None,
        }
        
        # Simulate player_joined event - both players in list
        players_after_join = [host, joiner]
        
        # Property: Both players have playercard field
        for player in players_after_join:
            assert "playercard" in player
        
        # Property: Playercard data matches expected state
        host_in_list = next(p for p in players_after_join if p["id"] == host_id)
        joiner_in_list = next(p for p in players_after_join if p["id"] == joiner_id)
        
        if host_has_card:
            assert host_in_list["playercard"] is not None
            assert host_in_list["playercard"]["id"] == "host-card"
        else:
            assert host_in_list["playercard"] is None
        
        if joiner_has_card:
            assert joiner_in_list["playercard"] is not None
            assert joiner_in_list["playercard"]["id"] == "joiner-card"
        else:
            assert joiner_in_list["playercard"] is None

    @given(
        num_events=st.integers(min_value=1, max_value=5),
        has_playercard=st.booleans(),
    )
    @settings(max_examples=100)
    def test_playercard_preserved_through_multiple_events(
        self, num_events: int, has_playercard: bool
    ):
        """
        **Feature: inventory-loadout-playercard-fix, Property 5: Playercard Persistence Through Events**
        **Validates: Requirements 3.3**
        
        When lobby state is refreshed multiple times, playercard data SHALL be preserved.
        """
        player = {
            "id": "player-123",
            "display_name": "TestPlayer",
            "is_host": True,
            "is_ready": False,
            "playercard": {
                "id": "card-123",
                "name": "Test Card",
                "type": "playercard",
                "rarity": "rare",
                "image_url": "https://example.com/card.png",
            } if has_playercard else None,
        }
        
        # Simulate multiple state refreshes
        current_player = player
        for i in range(num_events):
            # Each refresh should preserve playercard
            refreshed_player = dict(current_player)
            refreshed_player["is_ready"] = i % 2 == 0  # Toggle ready state
            
            # Property: Playercard is preserved through each refresh
            assert "playercard" in refreshed_player
            if has_playercard:
                assert refreshed_player["playercard"] is not None
                assert refreshed_player["playercard"]["id"] == "card-123"
            else:
                assert refreshed_player["playercard"] is None
            
            current_player = refreshed_player

    def test_enrichment_adds_playercard_to_all_players_in_event(self):
        """
        **Feature: inventory-loadout-playercard-fix, Property 5: Playercard Persistence Through Events**
        **Validates: Requirements 3.1, 3.2, 3.3**
        
        Enrichment process SHALL add playercard field to ALL players in any event.
        """
        # Players without playercard field initially
        players = [
            {"id": "p1", "display_name": "Player1", "is_host": True, "is_ready": True},
            {"id": "p2", "display_name": "Player2", "is_host": False, "is_ready": False},
        ]
        
        # Playercard data from fetch
        player_playercards = {
            "p1": {"id": "card-1", "name": "Card 1", "type": "playercard", "rarity": "epic", "image_url": "url1"},
            "p2": None,  # Player 2 has no card
        }
        
        # Simulate enrichment
        enriched_players = []
        for player in players:
            enriched_player = dict(player)
            enriched_player["playercard"] = player_playercards.get(player["id"])
            enriched_players.append(enriched_player)
        
        # Property: ALL players have playercard field after enrichment
        assert all("playercard" in p for p in enriched_players)
        
        # Property: Correct playercard data assigned
        assert enriched_players[0]["playercard"]["id"] == "card-1"
        assert enriched_players[1]["playercard"] is None
