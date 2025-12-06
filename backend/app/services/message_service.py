"""
Message service - Business logic for direct messaging.
"""

from typing import Optional

from supabase import Client

from app.core.exceptions import NotFoundError, AuthorizationError, ValidationError
from app.database.repositories.message_repo import MessageRepository
from app.database.repositories.friend_repo import FriendRepository
from app.database.repositories.user_repo import UserRepository
from app.database.supabase_client import get_supabase_service_client
from app.services.base import BaseService
from app.services.presence_service import presence_service
from app.websocket.manager import manager as ws_manager


class MessageService(BaseService):
    """Service for direct messaging operations."""

    def __init__(self, client: Client):
        super().__init__(client)
        service_client = get_supabase_service_client()
        self.message_repo = MessageRepository(service_client)
        self.friend_repo = FriendRepository(service_client)
        self.user_repo = UserRepository(service_client)

    async def get_conversations(self, user_id: str) -> dict:
        """Get all conversations with friend info and unread counts."""
        conversations = await self.message_repo.get_conversations(user_id)
        total_unread = 0

        enriched = []
        for conv in conversations:
            # Get friend profile
            friend = await self.user_repo.get_by_id(conv["friend_id"])
            is_online = presence_service.is_online(conv["friend_id"])

            enriched.append({
                "conversation_id": conv["conversation_id"],
                "friend_id": conv["friend_id"],
                "friend_display_name": friend.get("display_name") if friend else None,
                "friend_avatar_url": friend.get("avatar_url") if friend else None,
                "is_online": is_online,
                "last_message": conv["last_message"],
                "unread_count": conv["unread_count"],
                "updated_at": conv["updated_at"],
            })
            total_unread += conv["unread_count"]

        return {"conversations": enriched, "total_unread": total_unread}

    async def get_messages(
        self,
        user_id: str,
        friend_id: str,
        limit: int = 50,
        before_id: Optional[str] = None,
    ) -> dict:
        """Get message history with a friend."""
        # Verify friendship
        if not await self.friend_repo.are_friends(user_id, friend_id):
            raise AuthorizationError("Can only message friends")

        # Get or create conversation
        conv = await self.message_repo.get_or_create_conversation(user_id, friend_id)

        # Get messages
        messages = await self.message_repo.get_messages(
            conv["id"], limit, before_id
        )

        # Check if there are more
        has_more = len(messages) > limit
        if has_more:
            messages = messages[:limit]

        # Reverse to chronological order
        messages.reverse()

        return {
            "messages": messages,
            "has_more": has_more,
            "oldest_id": messages[0]["id"] if messages else None,
        }

    async def send_message(
        self,
        sender_id: str,
        recipient_id: str,
        content: str,
    ) -> dict:
        """Send a message to a friend."""
        # Validate content
        content = content.strip()
        if not content:
            raise ValidationError("Message cannot be empty")
        if len(content) > 500:
            raise ValidationError("Message too long (max 500 characters)")

        # Verify friendship
        if not await self.friend_repo.are_friends(sender_id, recipient_id):
            raise AuthorizationError("Can only message friends")

        # Get or create conversation
        conv = await self.message_repo.get_or_create_conversation(
            sender_id, recipient_id
        )

        # Send message
        message = await self.message_repo.send_message(
            conv["id"], sender_id, content
        )

        # Send real-time notification to recipient
        await self._notify_new_message(sender_id, recipient_id, message)

        return message

    async def mark_as_read(self, user_id: str, friend_id: str) -> dict:
        """Mark all messages from friend as read."""
        # Verify friendship
        if not await self.friend_repo.are_friends(user_id, friend_id):
            raise AuthorizationError("Can only message friends")

        # Get conversation
        conv = await self.message_repo.get_or_create_conversation(user_id, friend_id)

        # Mark as read
        count = await self.message_repo.mark_as_read(conv["id"], user_id)

        # Notify sender that messages were read
        if count > 0:
            await self._notify_messages_read(user_id, friend_id, conv["id"])

        return {"marked_count": count}

    async def get_unread_count(self, user_id: str) -> int:
        """Get total unread message count."""
        return await self.message_repo.get_total_unread(user_id)

    # ============================================
    # Private notification helpers
    # ============================================

    async def _notify_new_message(
        self,
        sender_id: str,
        recipient_id: str,
        message: dict,
    ) -> None:
        """Send new message notification via WebSocket."""
        sender = await self.user_repo.get_by_id(sender_id)
        await ws_manager.send_to_user(recipient_id, {
            "type": "dm_message",
            "payload": {
                "message_id": message["id"],
                "conversation_id": message["conversation_id"],
                "sender_id": sender_id,
                "sender_display_name": sender.get("display_name") if sender else None,
                "content": message["content"],
                "created_at": message["created_at"],
            }
        })

    async def _notify_messages_read(
        self,
        reader_id: str,
        sender_id: str,
        conversation_id: str,
    ) -> None:
        """Notify sender that their messages were read."""
        await ws_manager.send_to_user(sender_id, {
            "type": "dm_read",
            "payload": {
                "conversation_id": conversation_id,
                "reader_id": reader_id,
            }
        })
