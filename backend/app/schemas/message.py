"""
Message schemas for direct messaging.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    """Request to send a message."""
    content: str = Field(..., min_length=1, max_length=500)


class MessageResponse(BaseModel):
    """A single message."""
    id: str
    conversation_id: str
    sender_id: str
    content: str
    created_at: datetime
    read_at: Optional[datetime] = None


class LastMessage(BaseModel):
    """Last message preview for conversation list."""
    id: str
    content: str
    sender_id: str
    created_at: datetime


class ConversationResponse(BaseModel):
    """A conversation with metadata."""
    conversation_id: str
    friend_id: str
    friend_display_name: Optional[str] = None
    friend_avatar_url: Optional[str] = None
    is_online: bool = False
    last_message: Optional[LastMessage] = None
    unread_count: int = 0
    updated_at: datetime


class ConversationListResponse(BaseModel):
    """List of conversations."""
    conversations: list[ConversationResponse]
    total_unread: int = 0


class MessageHistoryResponse(BaseModel):
    """Paginated message history."""
    messages: list[MessageResponse]
    has_more: bool = False
    oldest_id: Optional[str] = None
