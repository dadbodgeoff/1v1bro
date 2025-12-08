"""
Event-driven architecture components.
Requirements: 8.1

This module provides Pub/Sub event publishing and subscribing
for loose coupling between services.
"""

from app.events.publisher import EventPublisher
from app.events.subscriber import EventSubscriber

__all__ = ["EventPublisher", "EventSubscriber"]
