"""
Event Publisher for Pub/Sub event delivery.
Requirements: 8.2, 8.6, 8.7, 8.8
"""

import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


# Event Topics
TOPICS = {
    "match_completed": "match-completed",
    "cosmetic_purchased": "cosmetic-purchased",
    "reward_earned": "reward-earned",
    "player_levelup": "player-levelup",
}


@dataclass
class MatchCompletedEvent:
    """Event data for match.completed. Requirements: 8.2"""
    match_id: str
    player1_id: str
    player2_id: str
    winner_id: Optional[str]
    duration_seconds: int
    player1_score: int
    player2_score: int
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


@dataclass
class CosmeticPurchasedEvent:
    """Event data for player.cosmetic_purchased. Requirements: 8.6"""
    user_id: str
    cosmetic_id: str
    cosmetic_name: str
    cosmetic_type: str
    price_coins: int
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


@dataclass
class RewardEarnedEvent:
    """Event data for battlepass.reward_earned. Requirements: 8.7"""
    user_id: str
    season_id: str
    tier: int
    reward_type: str
    reward_value: str
    is_premium: bool
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


@dataclass
class PlayerLevelUpEvent:
    """Event data for player.levelup. Requirements: 8.8"""
    user_id: str
    old_level: int
    new_level: int
    total_xp: int
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


class EventPublisher:
    """
    Pub/Sub event publisher.
    
    In production, this would use Google Cloud Pub/Sub.
    For development/testing, events are logged and stored in memory.
    """
    
    def __init__(self, project_id: Optional[str] = None):
        self.project_id = project_id
        self._published_events: list = []  # For testing
        self._use_pubsub = project_id is not None
        
        if self._use_pubsub:
            try:
                from google.cloud import pubsub_v1
                self._publisher = pubsub_v1.PublisherClient()
            except ImportError:
                logger.warning("google-cloud-pubsub not installed, using mock publisher")
                self._use_pubsub = False
    
    def _get_topic_path(self, topic: str) -> str:
        """Get full topic path for Pub/Sub."""
        if self._use_pubsub:
            return self._publisher.topic_path(self.project_id, topic)
        return f"projects/{self.project_id}/topics/{topic}"
    
    async def publish(self, topic: str, data: Dict[str, Any]) -> str:
        """
        Publish event to topic.
        
        Args:
            topic: Topic name from TOPICS
            data: Event data dict
            
        Returns:
            Message ID
        """
        message_data = json.dumps(data).encode("utf-8")
        message_id = f"msg_{datetime.utcnow().timestamp()}"
        
        if self._use_pubsub:
            try:
                topic_path = self._get_topic_path(topic)
                future = self._publisher.publish(topic_path, message_data)
                message_id = future.result()
                logger.info(f"Published event to {topic}: {message_id}")
            except Exception as e:
                logger.error(f"Failed to publish to {topic}: {e}")
                raise
        else:
            # Development mode - log and store
            logger.info(f"[DEV] Event published to {topic}: {data}")
            self._published_events.append({
                "topic": topic,
                "data": data,
                "message_id": message_id,
                "timestamp": datetime.utcnow().isoformat(),
            })
        
        return message_id
    
    async def publish_match_completed(self, event: MatchCompletedEvent) -> str:
        """
        Publish match.completed event.
        
        Requirements: 8.2 - Publish with match_id, player_ids, winner_id, duration, scores.
        """
        return await self.publish(
            TOPICS["match_completed"],
            asdict(event),
        )
    
    async def publish_cosmetic_purchased(self, event: CosmeticPurchasedEvent) -> str:
        """
        Publish player.cosmetic_purchased event.
        
        Requirements: 8.6
        """
        return await self.publish(
            TOPICS["cosmetic_purchased"],
            asdict(event),
        )
    
    async def publish_reward_earned(self, event: RewardEarnedEvent) -> str:
        """
        Publish battlepass.reward_earned event.
        
        Requirements: 8.7
        """
        return await self.publish(
            TOPICS["reward_earned"],
            asdict(event),
        )
    
    async def publish_player_levelup(self, event: PlayerLevelUpEvent) -> str:
        """
        Publish player.levelup event.
        
        Requirements: 8.8
        """
        return await self.publish(
            TOPICS["player_levelup"],
            asdict(event),
        )
    
    def get_published_events(self) -> list:
        """Get list of published events (for testing)."""
        return self._published_events.copy()
    
    def clear_published_events(self) -> None:
        """Clear published events (for testing)."""
        self._published_events.clear()
