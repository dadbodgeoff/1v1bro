"""
Message repository - Database operations for direct messaging.
"""

from typing import Optional
from datetime import datetime

from supabase import Client


class MessageRepository:
    """Repository for message and conversation operations."""

    def __init__(self, client: Client):
        self._client = client

    def _conversations(self):
        return self._client.table("conversations")

    def _messages(self):
        return self._client.table("messages")

    async def get_or_create_conversation(
        self, user1_id: str, user2_id: str
    ) -> dict:
        """Get or create a conversation between two users."""
        # Ensure consistent ordering (smaller UUID first)
        if user1_id < user2_id:
            smaller, larger = user1_id, user2_id
        else:
            smaller, larger = user2_id, user1_id

        # Try to find existing
        result = (
            self._conversations()
            .select("*")
            .eq("user1_id", smaller)
            .eq("user2_id", larger)
            .execute()
        )

        if result.data:
            return result.data[0]

        # Create new
        result = (
            self._conversations()
            .insert({"user1_id": smaller, "user2_id": larger})
            .execute()
        )
        return result.data[0]

    async def get_conversations(self, user_id: str) -> list[dict]:
        """Get all conversations for a user with last message and unread count."""
        # Get conversations where user is participant
        result = (
            self._conversations()
            .select("*")
            .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
            .order("updated_at", desc=True)
            .execute()
        )

        conversations = []
        for conv in result.data or []:
            # Get friend ID
            friend_id = conv["user2_id"] if conv["user1_id"] == user_id else conv["user1_id"]

            # Get last message
            last_msg_result = (
                self._messages()
                .select("id, content, sender_id, created_at")
                .eq("conversation_id", conv["id"])
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            last_message = last_msg_result.data[0] if last_msg_result.data else None

            # Get unread count (messages from friend that are unread)
            unread_result = (
                self._messages()
                .select("id", count="exact")
                .eq("conversation_id", conv["id"])
                .eq("sender_id", friend_id)
                .is_("read_at", "null")
                .execute()
            )
            unread_count = unread_result.count or 0

            conversations.append({
                "conversation_id": conv["id"],
                "friend_id": friend_id,
                "last_message": last_message,
                "unread_count": unread_count,
                "updated_at": conv["updated_at"],
            })

        return conversations

    async def get_messages(
        self,
        conversation_id: str,
        limit: int = 50,
        before_id: Optional[str] = None,
    ) -> list[dict]:
        """Get messages for a conversation, paginated."""
        query = (
            self._messages()
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=True)
            .limit(limit + 1)  # Get one extra to check if there's more
        )

        if before_id:
            # Get the timestamp of the before message
            before_msg = (
                self._messages()
                .select("created_at")
                .eq("id", before_id)
                .single()
                .execute()
            )
            if before_msg.data:
                query = query.lt("created_at", before_msg.data["created_at"])

        result = query.execute()
        return result.data or []

    async def send_message(
        self, conversation_id: str, sender_id: str, content: str
    ) -> dict:
        """Send a message."""
        result = (
            self._messages()
            .insert({
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "content": content,
            })
            .execute()
        )

        # Update conversation timestamp
        self._conversations().update(
            {"updated_at": datetime.utcnow().isoformat()}
        ).eq("id", conversation_id).execute()

        return result.data[0]

    async def mark_as_read(
        self, conversation_id: str, reader_id: str
    ) -> int:
        """Mark all messages from the other user as read."""
        result = (
            self._messages()
            .update({"read_at": datetime.utcnow().isoformat()})
            .eq("conversation_id", conversation_id)
            .neq("sender_id", reader_id)
            .is_("read_at", "null")
            .execute()
        )
        return len(result.data) if result.data else 0

    async def get_total_unread(self, user_id: str) -> int:
        """Get total unread message count across all conversations."""
        # Get all conversations
        convs = (
            self._conversations()
            .select("id")
            .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
            .execute()
        )

        if not convs.data:
            return 0

        conv_ids = [c["id"] for c in convs.data]

        # Count unread messages not sent by user
        total = 0
        for conv_id in conv_ids:
            result = (
                self._messages()
                .select("id", count="exact")
                .eq("conversation_id", conv_id)
                .neq("sender_id", user_id)
                .is_("read_at", "null")
                .execute()
            )
            total += result.count or 0

        return total

    async def conversation_exists(self, conversation_id: str, user_id: str) -> bool:
        """Check if user is part of a conversation."""
        result = (
            self._conversations()
            .select("id")
            .eq("id", conversation_id)
            .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
            .execute()
        )
        return bool(result.data)
