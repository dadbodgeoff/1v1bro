"""
Notification schemas.
"""

from typing import Optional, Literal
from datetime import datetime
from enum import Enum

from pydantic import Field

from app.schemas.base import BaseSchema


class NotificationType(str, Enum):
    """Types of notifications."""
    FRIEND_REQUEST = "friend_request"
    MATCH_INVITE = "match_invite"
    REWARD = "reward"
    SYSTEM = "system"


# ============================================
# Notification Schemas
# ============================================

class NotificationBase(BaseSchema):
    """Base notification schema."""
    type: NotificationType = Field(..., description="Notification type")
    title: str = Field(..., max_length=100, description="Notification title")
    message: str = Field(..., max_length=500, description="Notification message")
    action_url: Optional[str] = Field(None, max_length=200, description="URL to navigate to on click")
    metadata: Optional[dict] = Field(None, description="Additional data (e.g., friend_id, lobby_code)")


class NotificationCreate(NotificationBase):
    """Schema for creating a notification."""
    user_id: str = Field(..., description="User to notify")


class NotificationResponse(NotificationBase):
    """Response schema for a notification."""
    id: str = Field(..., description="Notification UUID")
    user_id: str = Field(..., description="User ID")
    is_read: bool = Field(default=False, description="Whether notification has been read")
    created_at: datetime = Field(..., description="When notification was created")
    read_at: Optional[datetime] = Field(None, description="When notification was read")


class NotificationListResponse(BaseSchema):
    """Response containing list of notifications."""
    notifications: list[NotificationResponse] = Field(default_factory=list)
    unread_count: int = Field(default=0, description="Number of unread notifications")
    total: int = Field(default=0, description="Total notifications")


class NotificationCountResponse(BaseSchema):
    """Response containing just the unread count."""
    unread_count: int = Field(default=0)


class MarkReadRequest(BaseSchema):
    """Request to mark notifications as read."""
    notification_ids: list[str] = Field(..., min_length=1, description="IDs to mark as read")


class MarkReadResponse(BaseSchema):
    """Response after marking notifications as read."""
    marked_count: int = Field(..., description="Number of notifications marked as read")


# ============================================
# WebSocket Notification Payload
# ============================================

class NotificationPayload(BaseSchema):
    """Payload for real-time notification via WebSocket."""
    id: str
    type: NotificationType
    title: str
    message: str
    action_url: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: str  # ISO format string for JSON serialization
