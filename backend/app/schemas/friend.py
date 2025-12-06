"""
Friend and game invite schemas.
"""

from typing import Optional
from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema, TimestampMixin


# ============================================
# Friend Request/Response Schemas
# ============================================

class FriendRequest(BaseSchema):
    """Request to send a friend request."""
    user_id: str = Field(..., description="User ID to send friend request to")


class FriendResponse(BaseSchema):
    """Response schema for a friend."""
    friendship_id: str = Field(..., description="Friendship UUID")
    user_id: str = Field(..., description="Friend's user ID")
    display_name: Optional[str] = Field(None, description="Friend's display name")
    avatar_url: Optional[str] = Field(None, description="Friend's avatar URL")
    is_online: bool = Field(default=False, description="Whether friend is currently online")
    show_online_status: bool = Field(default=True, description="Whether friend shows online status")
    created_at: Optional[datetime] = Field(None, description="When friendship was created")


class FriendRequestResponse(BaseSchema):
    """Response schema for a pending friend request."""
    friendship_id: str = Field(..., description="Friendship UUID")
    user_id: str = Field(..., description="Requester's user ID")
    display_name: Optional[str] = Field(None, description="Requester's display name")
    avatar_url: Optional[str] = Field(None, description="Requester's avatar URL")
    created_at: Optional[datetime] = Field(None, description="When request was sent")


class FriendsListResponse(BaseSchema):
    """Response containing friends list."""
    friends: list[FriendResponse] = Field(default_factory=list)
    pending_requests: list[FriendRequestResponse] = Field(default_factory=list)
    sent_requests: list[FriendRequestResponse] = Field(default_factory=list)


class RelationshipStatus(BaseSchema):
    """Status of relationship between two users."""
    relationship_exists: bool = Field(default=False)
    status: Optional[str] = Field(None, description="pending, accepted, or blocked")
    is_requester: bool = Field(default=False, description="Whether current user sent the request")
    friendship_id: Optional[str] = Field(None)


# ============================================
# Game Invite Schemas
# ============================================

class GameInviteRequest(BaseSchema):
    """Request to send a game invite."""
    lobby_code: str = Field(..., min_length=6, max_length=6, description="Lobby code to invite to")


class GameInviteResponse(BaseSchema):
    """Response schema for a game invite."""
    id: str = Field(..., description="Invite UUID")
    from_user_id: str = Field(..., description="Sender's user ID")
    from_display_name: Optional[str] = Field(None, description="Sender's display name")
    from_avatar_url: Optional[str] = Field(None, description="Sender's avatar URL")
    lobby_code: str = Field(..., description="Lobby code")
    status: str = Field(..., description="pending, accepted, declined, expired")
    expires_at: datetime = Field(..., description="When invite expires")
    created_at: datetime = Field(..., description="When invite was sent")


class PendingInvitesResponse(BaseSchema):
    """Response containing pending game invites."""
    invites: list[GameInviteResponse] = Field(default_factory=list)


# ============================================
# User Search Schemas
# ============================================

class UserSearchResult(BaseSchema):
    """User search result."""
    id: str = Field(..., description="User UUID")
    display_name: Optional[str] = Field(None, description="Display name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    relationship_status: Optional[str] = Field(None, description="Current relationship status")


class UserSearchResponse(BaseSchema):
    """Response containing user search results."""
    users: list[UserSearchResult] = Field(default_factory=list)
    total: int = Field(default=0)


# ============================================
# Settings Schemas
# ============================================

class OnlineStatusSettings(BaseSchema):
    """Settings for online status visibility."""
    show_online_status: bool = Field(..., description="Whether to show online status to friends")
