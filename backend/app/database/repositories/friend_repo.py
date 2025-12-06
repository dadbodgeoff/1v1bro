"""
Friend repository.
Handles friendship and game invite CRUD operations.
"""

from typing import Optional
from datetime import datetime, timedelta, timezone

from supabase import Client

from app.database.repositories.base import BaseRepository


class FriendRepository(BaseRepository):
    """Repository for friendships table operations."""

    def __init__(self, client: Client):
        super().__init__(client, "friendships")

    async def get_friends(self, user_id: str) -> list[dict]:
        """Get all accepted friends for a user."""
        result = self.client.rpc("get_friends", {"p_user_id": user_id}).execute()
        return result.data or []

    async def get_pending_requests(self, user_id: str) -> list[dict]:
        """Get pending friend requests received by user."""
        result = self.client.rpc("get_pending_requests", {"p_user_id": user_id}).execute()
        return result.data or []

    async def get_sent_requests(self, user_id: str) -> list[dict]:
        """Get pending friend requests sent by user."""
        result = self.client.rpc("get_sent_requests", {"p_user_id": user_id}).execute()
        return result.data or []

    async def get_relationship(self, user_id: str, other_id: str) -> Optional[dict]:
        """Get relationship status between two users."""
        result = self.client.rpc(
            "get_relationship_status",
            {"p_user_id": user_id, "p_other_id": other_id}
        ).execute()
        if result.data and result.data[0].get("relationship_exists"):
            return result.data[0]
        return None

    async def are_friends(self, user_id: str, other_id: str) -> bool:
        """Check if two users are friends."""
        result = self.client.rpc(
            "are_friends",
            {"p_user_id": user_id, "p_other_id": other_id}
        ).execute()
        return result.data if result.data else False

    async def is_blocked(self, user_id: str, by_user_id: str) -> bool:
        """Check if user is blocked by another user."""
        result = self.client.rpc(
            "is_blocked",
            {"p_user_id": user_id, "p_by_user_id": by_user_id}
        ).execute()
        return result.data if result.data else False

    async def send_request(self, user_id: str, friend_id: str) -> dict:
        """Send a friend request."""
        result = self._table().insert({
            "user_id": user_id,
            "friend_id": friend_id,
            "status": "pending"
        }).execute()
        return result.data[0]

    async def accept_request(self, friendship_id: str, user_id: str) -> Optional[dict]:
        """Accept a friend request (only recipient can accept)."""
        result = (
            self._table()
            .update({"status": "accepted"})
            .eq("id", friendship_id)
            .eq("friend_id", user_id)  # Only recipient can accept
            .eq("status", "pending")
            .execute()
        )
        return result.data[0] if result.data else None

    async def block_user(self, user_id: str, block_id: str) -> dict:
        """Block a user. Creates or updates relationship to blocked."""
        # Check if relationship exists
        existing = await self.get_relationship(user_id, block_id)
        
        if existing and existing.get("friendship_id"):
            # Update existing to blocked
            result = (
                self._table()
                .update({"status": "blocked", "user_id": user_id, "friend_id": block_id})
                .eq("id", existing["friendship_id"])
                .execute()
            )
            return result.data[0]
        else:
            # Create new blocked relationship
            result = self._table().insert({
                "user_id": user_id,
                "friend_id": block_id,
                "status": "blocked"
            }).execute()
            return result.data[0]

    async def remove_friendship(self, friendship_id: str, user_id: str) -> bool:
        """Remove a friendship (either party can remove)."""
        result = (
            self._table()
            .delete()
            .eq("id", friendship_id)
            .or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}")
            .execute()
        )
        return len(result.data) > 0

    async def get_blocked_users(self, user_id: str) -> list[dict]:
        """Get list of users blocked by this user."""
        result = (
            self._table()
            .select("friend_id, created_at")
            .eq("user_id", user_id)
            .eq("status", "blocked")
            .execute()
        )
        return result.data or []


class GameInviteRepository(BaseRepository):
    """Repository for game_invites table operations."""

    INVITE_EXPIRY_SECONDS = 120  # 2 minutes

    def __init__(self, client: Client):
        super().__init__(client, "game_invites")

    async def create_invite(
        self,
        from_user_id: str,
        to_user_id: str,
        lobby_code: str
    ) -> dict:
        """Create a game invite."""
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=self.INVITE_EXPIRY_SECONDS)
        result = self._table().insert({
            "from_user_id": from_user_id,
            "to_user_id": to_user_id,
            "lobby_code": lobby_code,
            "status": "pending",
            "expires_at": expires_at.isoformat()
        }).execute()
        return result.data[0]

    async def get_pending_invites(self, user_id: str) -> list[dict]:
        """Get pending invites for a user (not expired)."""
        now = datetime.now(timezone.utc).isoformat()
        result = (
            self._table()
            .select("*")
            .eq("to_user_id", user_id)
            .eq("status", "pending")
            .gt("expires_at", now)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    async def get_invite_by_id(self, invite_id: str) -> Optional[dict]:
        """Get invite by ID."""
        result = self._table().select("*").eq("id", invite_id).execute()
        return result.data[0] if result.data else None

    async def accept_invite(self, invite_id: str, user_id: str) -> Optional[dict]:
        """Accept a game invite."""
        result = (
            self._table()
            .update({"status": "accepted"})
            .eq("id", invite_id)
            .eq("to_user_id", user_id)
            .eq("status", "pending")
            .execute()
        )
        return result.data[0] if result.data else None

    async def decline_invite(self, invite_id: str, user_id: str) -> Optional[dict]:
        """Decline a game invite."""
        result = (
            self._table()
            .update({"status": "declined"})
            .eq("id", invite_id)
            .eq("to_user_id", user_id)
            .eq("status", "pending")
            .execute()
        )
        return result.data[0] if result.data else None

    async def cancel_invite(self, invite_id: str, user_id: str) -> bool:
        """Cancel a sent invite."""
        result = (
            self._table()
            .delete()
            .eq("id", invite_id)
            .eq("from_user_id", user_id)
            .execute()
        )
        return len(result.data) > 0

    async def expire_old_invites(self) -> int:
        """Expire old pending invites."""
        result = self.client.rpc("expire_old_invites").execute()
        return result.data if result.data else 0
