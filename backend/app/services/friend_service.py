"""
Friend service.
Handles friend requests, relationships, and game invites.
"""

from typing import Optional

from supabase import Client

from app.core.exceptions import (
    NotFoundError,
    ValidationError,
    AuthorizationError,
)
from app.database.repositories.friend_repo import FriendRepository, GameInviteRepository
from app.database.repositories.user_repo import UserRepository
from app.database.supabase_client import get_supabase_service_client
from app.services.base import BaseService
from app.services.presence_service import presence_service
from app.websocket.manager import manager as ws_manager


class FriendService(BaseService):
    """Service for friend operations."""

    def __init__(self, client: Client):
        super().__init__(client)
        service_client = get_supabase_service_client()
        self.friend_repo = FriendRepository(service_client)
        self.invite_repo = GameInviteRepository(service_client)
        self.user_repo = UserRepository(service_client)

    async def get_friends_list(self, user_id: str) -> dict:
        """
        Get complete friends list with pending requests.
        
        Returns dict with friends, pending_requests, sent_requests
        """
        friends_data = await self.friend_repo.get_friends(user_id)
        pending_data = await self.friend_repo.get_pending_requests(user_id)
        sent_data = await self.friend_repo.get_sent_requests(user_id)

        # Add online status to friends
        friends = []
        for f in friends_data:
            is_online = presence_service.is_online(f["friend_user_id"])
            friends.append({
                "friendship_id": f["friendship_id"],
                "user_id": f["friend_user_id"],
                "display_name": f["display_name"],
                "avatar_url": f["avatar_url"],
                "is_online": is_online if f.get("show_online_status", True) else False,
                "show_online_status": f.get("show_online_status", True),
                "created_at": f["created_at"],
            })

        pending_requests = [
            {
                "friendship_id": r["friendship_id"],
                "user_id": r["requester_id"],
                "display_name": r["display_name"],
                "avatar_url": r["avatar_url"],
                "created_at": r["created_at"],
            }
            for r in pending_data
        ]

        sent_requests = [
            {
                "friendship_id": r["friendship_id"],
                "user_id": r["recipient_id"],
                "display_name": r["display_name"],
                "avatar_url": r["avatar_url"],
                "created_at": r["created_at"],
            }
            for r in sent_data
        ]

        return {
            "friends": friends,
            "pending_requests": pending_requests,
            "sent_requests": sent_requests,
        }

    async def send_friend_request(self, user_id: str, friend_id: str) -> dict:
        """
        Send a friend request.
        
        Raises:
            ValidationError: If trying to friend self or already friends
            ForbiddenError: If blocked by target user
        """
        if user_id == friend_id:
            raise ValidationError("Cannot send friend request to yourself")

        # Check if target user exists
        target = await self.user_repo.get_by_id(friend_id)
        if not target:
            raise NotFoundError("User", friend_id)

        # Check if blocked
        if await self.friend_repo.is_blocked(user_id, friend_id):
            raise AuthorizationError("Cannot send friend request to this user")

        # Check existing relationship
        existing = await self.friend_repo.get_relationship(user_id, friend_id)
        if existing:
            if existing["status"] == "accepted":
                raise ValidationError("Already friends with this user")
            elif existing["status"] == "pending":
                if existing["is_requester"]:
                    raise ValidationError("Friend request already sent")
                else:
                    # They sent us a request, auto-accept
                    return await self.accept_friend_request(
                        existing["friendship_id"], user_id
                    )
            elif existing["status"] == "blocked":
                raise AuthorizationError("Cannot send friend request to this user")

        # Send request
        friendship = await self.friend_repo.send_request(user_id, friend_id)

        # Send real-time notification to target
        await self._notify_friend_request(user_id, friend_id, friendship["id"])

        return {
            "friendship_id": friendship["id"],
            "status": "pending",
            "message": "Friend request sent",
        }

    async def accept_friend_request(self, friendship_id: str, user_id: str) -> dict:
        """
        Accept a friend request.
        
        Only the recipient can accept.
        """
        result = await self.friend_repo.accept_request(friendship_id, user_id)
        if not result:
            raise NotFoundError("Friend request", friendship_id)

        # Notify the requester
        await self._notify_request_accepted(result["user_id"], user_id)

        return {
            "friendship_id": friendship_id,
            "status": "accepted",
            "message": "Friend request accepted",
        }

    async def decline_friend_request(self, friendship_id: str, user_id: str) -> dict:
        """Decline/remove a friend request."""
        removed = await self.friend_repo.remove_friendship(friendship_id, user_id)
        if not removed:
            raise NotFoundError("Friend request", friendship_id)

        return {"message": "Friend request declined"}

    async def remove_friend(self, friendship_id: str, user_id: str) -> dict:
        """Remove a friend."""
        removed = await self.friend_repo.remove_friendship(friendship_id, user_id)
        if not removed:
            raise NotFoundError("Friendship", friendship_id)

        return {"message": "Friend removed"}

    async def block_user(self, user_id: str, block_id: str) -> dict:
        """
        Block a user.
        
        Blocks all interactions - friend requests, game invites, search visibility.
        """
        if user_id == block_id:
            raise ValidationError("Cannot block yourself")

        target = await self.user_repo.get_by_id(block_id)
        if not target:
            raise NotFoundError("User", block_id)

        await self.friend_repo.block_user(user_id, block_id)

        return {"message": "User blocked"}

    async def unblock_user(self, user_id: str, block_id: str) -> dict:
        """Unblock a user."""
        relationship = await self.friend_repo.get_relationship(user_id, block_id)
        if not relationship or relationship["status"] != "blocked":
            raise NotFoundError("Blocked user", block_id)

        await self.friend_repo.remove_friendship(relationship["friendship_id"], user_id)

        return {"message": "User unblocked"}

    async def get_blocked_users(self, user_id: str) -> list[dict]:
        """Get list of blocked users."""
        blocked = await self.friend_repo.get_blocked_users(user_id)
        result = []
        for b in blocked:
            profile = await self.user_repo.get_by_id(b["friend_id"])
            if profile:
                result.append({
                    "user_id": b["friend_id"],
                    "display_name": profile.get("display_name"),
                    "avatar_url": profile.get("avatar_url"),
                    "blocked_at": b["created_at"],
                })
        return result

    async def search_users(
        self,
        user_id: str,
        query: str,
        limit: int = 10
    ) -> list[dict]:
        """
        Search users by display name.
        
        Excludes blocked users and self.
        """
        if len(query) < 2:
            return []

        # Get blocked users to exclude
        blocked = await self.friend_repo.get_blocked_users(user_id)
        blocked_ids = {b["friend_id"] for b in blocked}

        # Also get users who blocked us
        # This requires checking each potential result, done below

        # Search users
        result = (
            self.user_repo._table()
            .select("id, display_name, avatar_url")
            .ilike("display_name", f"%{query}%")
            .neq("id", user_id)
            .limit(limit + len(blocked_ids))  # Get extra to account for filtering
            .execute()
        )

        users = []
        for u in result.data or []:
            if u["id"] in blocked_ids:
                continue
            # Check if this user blocked us
            if await self.friend_repo.is_blocked(user_id, u["id"]):
                continue

            # Get relationship status
            rel = await self.friend_repo.get_relationship(user_id, u["id"])
            
            users.append({
                "id": u["id"],
                "display_name": u["display_name"],
                "avatar_url": u["avatar_url"],
                "relationship_status": rel["status"] if rel else None,
            })

            if len(users) >= limit:
                break

        return users

    # ============================================
    # Game Invites
    # ============================================

    async def send_game_invite(
        self,
        from_user_id: str,
        to_user_id: str,
        lobby_code: str
    ) -> dict:
        """
        Send a game invite to a friend.
        
        Must be friends to send invite.
        """
        # Verify friendship
        if not await self.friend_repo.are_friends(from_user_id, to_user_id):
            raise AuthorizationError("Can only invite friends to games")

        # Create invite
        invite = await self.invite_repo.create_invite(
            from_user_id, to_user_id, lobby_code
        )

        # Get sender info for notification
        sender = await self.user_repo.get_by_id(from_user_id)

        # Send real-time notification
        await self._notify_game_invite(
            from_user_id,
            to_user_id,
            invite["id"],
            lobby_code,
            sender.get("display_name") if sender else None
        )

        return {
            "invite_id": invite["id"],
            "expires_at": invite["expires_at"],
            "message": "Game invite sent",
        }

    async def get_pending_invites(self, user_id: str) -> list[dict]:
        """Get pending game invites for user."""
        invites = await self.invite_repo.get_pending_invites(user_id)
        result = []
        for inv in invites:
            # Fetch sender info
            sender = await self.user_repo.get_by_id(inv["from_user_id"])
            result.append({
                "id": inv["id"],
                "from_user_id": inv["from_user_id"],
                "from_display_name": sender.get("display_name") if sender else None,
                "from_avatar_url": sender.get("avatar_url") if sender else None,
                "lobby_code": inv["lobby_code"],
                "status": inv["status"],
                "expires_at": inv["expires_at"],
                "created_at": inv["created_at"],
            })
        return result

    async def accept_game_invite(self, invite_id: str, user_id: str) -> dict:
        """Accept a game invite."""
        invite = await self.invite_repo.accept_invite(invite_id, user_id)
        if not invite:
            raise NotFoundError("Game invite", invite_id)

        return {
            "lobby_code": invite["lobby_code"],
            "message": "Invite accepted",
        }

    async def decline_game_invite(self, invite_id: str, user_id: str) -> dict:
        """Decline a game invite."""
        invite = await self.invite_repo.decline_invite(invite_id, user_id)
        if not invite:
            raise NotFoundError("Game invite", invite_id)

        return {"message": "Invite declined"}

    # ============================================
    # Online Status
    # ============================================

    async def update_online_status_setting(
        self,
        user_id: str,
        show_online: bool
    ) -> dict:
        """Update user's online status visibility setting."""
        result = (
            self.user_repo._table()
            .update({"show_online_status": show_online})
            .eq("id", user_id)
            .execute()
        )
        return {"show_online_status": show_online}

    async def notify_friends_online(self, user_id: str) -> None:
        """Notify friends that user came online."""
        profile = await self.user_repo.get_by_id(user_id)
        if not profile or not profile.get("show_online_status", True):
            return

        friends = await self.friend_repo.get_friends(user_id)
        for friend in friends:
            await ws_manager.send_to_user(friend["friend_user_id"], {
                "type": "friend_online",
                "payload": {
                    "user_id": user_id,
                    "display_name": profile.get("display_name"),
                }
            })

    async def notify_friends_offline(self, user_id: str) -> None:
        """Notify friends that user went offline."""
        profile = await self.user_repo.get_by_id(user_id)
        if not profile or not profile.get("show_online_status", True):
            return

        friends = await self.friend_repo.get_friends(user_id)
        for friend in friends:
            await ws_manager.send_to_user(friend["friend_user_id"], {
                "type": "friend_offline",
                "payload": {"user_id": user_id}
            })

    # ============================================
    # Private notification helpers
    # ============================================

    async def _notify_friend_request(
        self,
        from_user_id: str,
        to_user_id: str,
        friendship_id: str
    ) -> None:
        """Send friend request notification."""
        sender = await self.user_repo.get_by_id(from_user_id)
        await ws_manager.send_to_user(to_user_id, {
            "type": "friend_request",
            "payload": {
                "friendship_id": friendship_id,
                "from_user_id": from_user_id,
                "display_name": sender.get("display_name") if sender else None,
                "avatar_url": sender.get("avatar_url") if sender else None,
            }
        })

    async def _notify_request_accepted(
        self,
        requester_id: str,
        accepter_id: str
    ) -> None:
        """Send friend request accepted notification."""
        accepter = await self.user_repo.get_by_id(accepter_id)
        await ws_manager.send_to_user(requester_id, {
            "type": "friend_accepted",
            "payload": {
                "user_id": accepter_id,
                "display_name": accepter.get("display_name") if accepter else None,
            }
        })

    async def _notify_game_invite(
        self,
        from_user_id: str,
        to_user_id: str,
        invite_id: str,
        lobby_code: str,
        from_display_name: Optional[str]
    ) -> None:
        """Send game invite notification."""
        await ws_manager.send_to_user(to_user_id, {
            "type": "game_invite",
            "payload": {
                "invite_id": invite_id,
                "from_user_id": from_user_id,
                "from_display_name": from_display_name,
                "lobby_code": lobby_code,
            }
        })
