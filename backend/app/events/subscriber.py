"""
Event Subscriber for Pub/Sub event handling.
Requirements: 8.9, 8.10
"""

import json
import logging
from typing import Dict, Callable, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 5


class EventSubscriber:
    """
    Pub/Sub event subscriber with handlers.
    
    Requirements: 8.9 - At-least-once delivery with idempotent handlers.
    Requirements: 8.10 - Dead-letter queues for failed processing.
    """
    
    def __init__(
        self,
        project_id: Optional[str] = None,
        handlers: Optional[Dict[str, Callable]] = None,
    ):
        self.project_id = project_id
        self.handlers = handlers or {}
        self._processed_ids: set = set()  # For idempotency tracking
        self._dead_letter: list = []  # Failed messages
        self._running = False
        self._use_pubsub = project_id is not None
        
        if self._use_pubsub:
            try:
                from google.cloud import pubsub_v1
                self._subscriber = pubsub_v1.SubscriberClient()
            except ImportError:
                logger.warning("google-cloud-pubsub not installed, using mock subscriber")
                self._use_pubsub = False
    
    def register_handler(self, topic: str, handler: Callable) -> None:
        """
        Register a handler for a topic.
        
        Args:
            topic: Topic name
            handler: Async function to handle messages
        """
        self.handlers[topic] = handler
        logger.info(f"Registered handler for topic: {topic}")
    
    def _get_subscription_path(self, subscription: str) -> str:
        """Get full subscription path for Pub/Sub."""
        if self._use_pubsub:
            return self._subscriber.subscription_path(self.project_id, subscription)
        return f"projects/{self.project_id}/subscriptions/{subscription}"
    
    async def start(self) -> None:
        """
        Start listening to subscriptions.
        
        In production, this would start Pub/Sub streaming pull.
        """
        self._running = True
        logger.info("Event subscriber started")
        
        if self._use_pubsub:
            # Production: Start streaming pull for each subscription
            for topic in self.handlers.keys():
                subscription = f"{topic}-sub"
                subscription_path = self._get_subscription_path(subscription)
                
                def callback(message):
                    import asyncio
                    asyncio.create_task(self._handle_pubsub_message(topic, message))
                
                self._subscriber.subscribe(subscription_path, callback=callback)
                logger.info(f"Subscribed to {subscription}")
    
    async def stop(self) -> None:
        """Stop the subscriber."""
        self._running = False
        logger.info("Event subscriber stopped")
    
    async def _handle_pubsub_message(self, topic: str, message) -> None:
        """Handle a Pub/Sub message."""
        try:
            data = json.loads(message.data.decode("utf-8"))
            await self.handle_message(topic, data, message.message_id)
            message.ack()
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            message.nack()
    
    async def handle_message(
        self,
        topic: str,
        data: Dict[str, Any],
        message_id: Optional[str] = None,
    ) -> bool:
        """
        Route message to appropriate handler.
        
        Requirements: 8.9 - Idempotent handling (same message twice = same state).
        
        Args:
            topic: Topic the message came from
            data: Message data
            message_id: Unique message ID for idempotency
            
        Returns:
            True if handled successfully, False otherwise
        """
        # Generate message ID if not provided
        if message_id is None:
            message_id = f"{topic}_{data.get('timestamp', datetime.utcnow().isoformat())}"
        
        # Idempotency check - skip if already processed
        if message_id in self._processed_ids:
            logger.info(f"Skipping duplicate message: {message_id}")
            return True
        
        handler = self.handlers.get(topic)
        if not handler:
            logger.warning(f"No handler registered for topic: {topic}")
            return False
        
        # Retry logic
        for attempt in range(MAX_RETRIES):
            try:
                await handler(data)
                self._processed_ids.add(message_id)
                logger.info(f"Successfully handled message {message_id} from {topic}")
                return True
            except Exception as e:
                logger.error(f"Attempt {attempt + 1}/{MAX_RETRIES} failed for {message_id}: {e}")
                if attempt < MAX_RETRIES - 1:
                    import asyncio
                    await asyncio.sleep(RETRY_DELAY_SECONDS)
        
        # All retries failed - send to dead letter queue
        self._add_to_dead_letter(topic, data, message_id)
        return False
    
    def _add_to_dead_letter(
        self,
        topic: str,
        data: Dict[str, Any],
        message_id: str,
    ) -> None:
        """
        Add failed message to dead-letter queue.
        
        Requirements: 8.10 - Dead-letter queues for failed event processing.
        """
        self._dead_letter.append({
            "topic": topic,
            "data": data,
            "message_id": message_id,
            "failed_at": datetime.utcnow().isoformat(),
            "retries": MAX_RETRIES,
        })
        logger.error(f"Message {message_id} sent to dead-letter queue after {MAX_RETRIES} retries")
    
    def get_dead_letter_messages(self) -> list:
        """Get messages in dead-letter queue."""
        return self._dead_letter.copy()
    
    def clear_dead_letter(self) -> None:
        """Clear dead-letter queue."""
        self._dead_letter.clear()
    
    def clear_processed_ids(self) -> None:
        """Clear processed message IDs (for testing)."""
        self._processed_ids.clear()
    
    def is_processed(self, message_id: str) -> bool:
        """Check if a message has been processed."""
        return message_id in self._processed_ids
