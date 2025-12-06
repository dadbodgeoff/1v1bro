"""
Unit tests for ReplayService compression/decompression.
"""

import base64
import json
import zlib
from datetime import datetime
from uuid import uuid4

import pytest

from app.telemetry.schemas import DeathReplayCreate


class TestReplayCompression:
    """Test replay data compression and decompression."""

    def test_compression_reduces_size(self):
        """Verify compression significantly reduces data size."""
        # Create sample frame data (similar to real telemetry)
        frames = [
            {
                "tick": i,
                "timestamp": 1700000000000 + i * 16,
                "players": [
                    {
                        "playerId": str(uuid4()),
                        "position": {"x": 100 + i, "y": 200},
                        "velocity": {"x": 5, "y": 0},
                        "health": 100,
                        "shield": 0,
                        "isInvulnerable": False,
                        "aimDirection": {"x": 1, "y": 0},
                        "state": "alive",
                    },
                    {
                        "playerId": str(uuid4()),
                        "position": {"x": 500 - i, "y": 200},
                        "velocity": {"x": -5, "y": 0},
                        "health": 75,
                        "shield": 25,
                        "isInvulnerable": False,
                        "aimDirection": {"x": -1, "y": 0},
                        "state": "alive",
                    },
                ],
                "projectiles": [],
                "events": [],
                "networkStats": {
                    "clientTick": i,
                    "serverTick": i,
                    "rttMs": 30,
                    "jitterMs": 5,
                    "packetLoss": 0,
                },
            }
            for i in range(300)  # 5 seconds at 60fps
        ]

        # Original size
        original_json = json.dumps(frames)
        original_size = len(original_json.encode())

        # Compressed size
        compressed = zlib.compress(original_json.encode(), level=6)
        compressed_b64 = base64.b64encode(compressed).decode()
        compressed_size = len(compressed_b64)

        # Verify compression ratio
        ratio = compressed_size / original_size
        assert ratio < 0.3, f"Compression ratio {ratio:.2%} should be < 30%"

    def test_compression_roundtrip(self):
        """Verify data survives compression/decompression."""
        frames = [
            {
                "tick": 0,
                "timestamp": 1700000000000,
                "players": [{"playerId": "test", "position": {"x": 100, "y": 200}}],
                "projectiles": [],
                "events": [{"type": "fire", "data": {"playerId": "test"}}],
                "networkStats": {"rttMs": 30},
            }
        ]

        # Compress
        frames_json = json.dumps(frames)
        compressed = zlib.compress(frames_json.encode(), level=6)
        compressed_b64 = base64.b64encode(compressed).decode()

        # Decompress
        decoded = base64.b64decode(compressed_b64)
        decompressed = zlib.decompress(decoded).decode()
        result = json.loads(decompressed)

        assert result == frames

    def test_schema_validation(self):
        """Test DeathReplayCreate schema validation."""
        replay = DeathReplayCreate(
            lobby_id=uuid4(),
            victim_id=uuid4(),
            killer_id=uuid4(),
            death_tick=100,
            death_timestamp=datetime.utcnow(),
            frames=[{"tick": 0}],
        )

        assert replay.death_tick == 100
        assert len(replay.frames) == 1

    def test_schema_rejects_negative_tick(self):
        """Test that negative death_tick is rejected."""
        with pytest.raises(ValueError):
            DeathReplayCreate(
                lobby_id=uuid4(),
                victim_id=uuid4(),
                killer_id=uuid4(),
                death_tick=-1,
                death_timestamp=datetime.utcnow(),
                frames=[],
            )
