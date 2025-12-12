"""
Notification service.
Handles creating, fetching, and managing user notifications.
"""

from typing import Optional
from datetime import datetime, timezone

from supabase import Client

from app.core.exceptions import NotFoundError
from app.database.supabase_client import get_supabase_service_client
from app.services.base import BaseService
from app.schemas.notification import NotificationType, NotificationCreate
from app.websocket.manager import manager as ws_manager


class NotificationService(BaseService):
    """Service for notification operations."""

    TABLE_NAME = "notifications"

    def __init__(self, client: Client):
        super().__init__(client)
        self.service_client = get_supabase_service_client()

    def _table(self):
        """Get notifications table reference."""
        return self.service_client.table(self.TABLE_NAME)

    async def get_notifications(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False,
    ) -> dict:
        """
        Get notifications for a user.
        
        Returns dict with notifications, unread_count, and total.
        """
        query = self._table().select("*").eq("user_id", user_id)
        
        if unread_only:
            query = query.eq("is_read", False)
        
        # Get total count first
        count_result = (
            self._table()
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        total = count_result.count or 0
        
        # Get unread count
        unread_result = (
            self._table()
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("is_read", False)
            .execute()
        )
        unread_count = unread_result.count or 0
        
        # Get paginated notifications
        result = (
            query
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        
        notifications = [
            {
                "id": n["id"],
                "user_id": n["user_id"],
                "type": n["type"],
                "title": n["title"],
                "message": n["message"],
                "action_url": n.get("action_url"),
                "metadata": n.get("metadata"),
                "is_read": n["is_read"],
                "created_at": n["created_at"],
                "read_at": n.get("read_at"),
            }
            for n in (result.data or [])
        ]
        
        return {
            "notifications": notifications,
            "unread_count": unread_count,
            "total": total,
        }

    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications."""
        result = (
            self._table()
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("is_read", False)
            .execute()
        )
        return result.count or 0

    async def create_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        action_url: Optional[str] = None,
        metadata: Optional[dict] = None,
        send_realtime: bool = True,
    ) -> dict:
        """
        Create a notification for a user.
        
        Optionally sends real-time WebSocket notification.
        """
        now = datetime.now(timezone.utc).isoformat()
        
        data = {
            "user_id": user_id,
            "type": notification_type.value,
            "title": title,
            "message": message,
            "action_url": action_url,
            "metadata": metadata,
            "is_read": False,
            "created_at": now,
        }
        
        result = self._table().insert(data).execute()
        
        if not result.data:
            raise Exception("Failed to create notification")
        
        notification = result.data[0]
        
        # Send real-time notification via WebSocket
        if send_realtime:
            await self._send_realtime_notification(notification)
        
        return notification

    async def mark_as_read(self, user_id: str, notification_ids: list[str]) -> int:
        """
        Mark notifications as read.
        
        Returns count of notifications marked.
        """
        now = datetime.now(timezone.utc).isoformat()
        
        result = (
            self._table()
            .update({"is_read": True, "read_at": now})
            .eq("user_id", user_id)
            .in_("id", notification_ids)
            .eq("is_read", False)  # Only update unread ones
            .execute()
        )
        
        return len(result.data or [])

    async def mark_all_as_read(self, user_id: str) -> int:
        """
        Mark all notifications as read for a user.
        
        Returns count of notifications marked.
        """
        now = datetime.now(timezone.utc).isoformat()
        
        result = (
            self._table()
            .update({"is_read": True, "read_at": now})
            .eq("user_id", user_id)
            .eq("is_read", False)
            .execute()
        )
        
        return len(result.data or [])

    async def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Delete a notification."""
        result = (
            self._table()
            .delete()
            .eq("id", notification_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        return len(result.data or []) > 0

    async def delete_old_notifications(self, user_id: str, days: int = 30) -> int:
        """
        Delete notifications older than specified days.
        
        Returns count of deleted notifications.
        """
        cutoff = datetime.now(timezone.utc)
        cutoff = cutoff.replace(day=cutoff.day - days)
        
        result = (
            self._table()
            .delete()
            .eq("user_id", user_id)
            .lt("created_at", cutoff.isoformat())
            .execute()
        )
        
        return len(result.data or [])

    # ============================================
    # Convenience methods for creating specific notification types
    # ============================================

    async def notify_friend_request(
        self,
        user_id: str,
        from_user_id: str,
        from_display_name: str,
        friendship_id: str,
    ) -> dict:
        """Create a friend request notification."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.FRIEND_REQUEST,
            title="New Friend Request",
            message=f"{from_display_name} wants to be your friend",
            action_url="/friends",
            metadata={
                "from_user_id": from_user_id,
                "friendship_id": friendship_id,
            },
        )

    async def notify_friend_accepted(
        self,
        user_id: str,
        friend_display_name: str,
    ) -> dict:
        """Create a friend accepted notification."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.FRIEND_REQUEST,
            title="Friend Request Accepted",
            message=f"{friend_display_name} accepted your friend request",
            action_url="/friends",
        )

    async def notify_match_invite(
        self,
        user_id: str,
        from_user_id: str,
        from_display_name: str,
        lobby_code: str,
        invite_id: str,
    ) -> dict:
        """Create a match invite notification."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.MATCH_INVITE,
            title="Game Invite",
            message=f"{from_display_name} invited you to play",
            action_url=f"/lobby/{lobby_code}",
            metadata={
                "from_user_id": from_user_id,
                "lobby_code": lobby_code,
                "invite_id": invite_id,
            },
        )

    async def notify_reward(
        self,
        user_id: str,
        title: str,
        message: str,
        reward_type: str,
        reward_amount: Optional[int] = None,
    ) -> dict:
        """Create a reward notification."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.REWARD,
            title=title,
            message=message,
            action_url="/battlepass" if reward_type == "battlepass" else "/inventory",
            metadata={
                "reward_type": reward_type,
                "reward_amount": reward_amount,
            },
        )

    async def notify_system(
        self,
        user_id: str,
        title: str,
        message: str,
        action_url: Optional[str] = None,
    ) -> dict:
        """Create a system notification."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.SYSTEM,
            title=title,
            message=message,
            action_url=action_url,
        )

    async def notify_achievement(
        self,
        user_id: str,
        achievement_id: str,
        achievement_name: str,
        achievement_description: str,
        achievement_rarity: str,
        achievement_icon_url: Optional[str] = None,
        coin_reward: int = 3,
    ) -> dict:
        """
        Create an achievement unlock notification.
        
        Requirements: 3.1, 3.2, 3.3
        
        Sends both a persistent notification and a real-time WebSocket
        notification with full achievement details.
        """
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.REWARD,
            title=f"Achievement Unlocked: {achievement_name}",
            message=f"{achievement_description} (+{coin_reward} coins)",
            action_url="/achievements",
            metadata={
                "achievement_id": achievement_id,
                "achievement_name": achievement_name,
                "achievement_description": achievement_description,
                "achievement_rarity": achievement_rarity,
                "achievement_icon_url": achievement_icon_url,
                "coin_reward": coin_reward,
            },
            send_realtime=True,
        )

    # ============================================
    # Private helpers
    # ============================================

    async def _send_realtime_notification(self, notification: dict) -> None:
        """Send notification via WebSocket."""
        await ws_manager.send_to_user(notification["user_id"], {
            "type": "notification",
            "payload": {
                "id": notification["id"],
                "type": notification["type"],
                "title": notification["title"],
                "message": notification["message"],
                "action_url": notification.get("action_url"),
                "metadata": notification.get("metadata"),
                "created_at": notification["created_at"],
            }
        })
