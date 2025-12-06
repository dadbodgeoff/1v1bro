"""
Messages API endpoints for direct messaging.
"""

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, MessageServiceDep
from app.core.responses import APIResponse
from app.schemas.message import (
    SendMessageRequest,
    MessageResponse,
    ConversationListResponse,
    ConversationResponse,
    MessageHistoryResponse,
    LastMessage,
)


router = APIRouter(prefix="/messages", tags=["Messages"])


# ============================================
# Conversations
# ============================================

@router.get(
    "/conversations",
    response_model=APIResponse[ConversationListResponse],
)
async def get_conversations(
    current_user: CurrentUser,
    service: MessageServiceDep,
):
    """
    Get all conversations for the current user.
    
    Returns conversations sorted by most recent activity,
    with last message preview and unread count.
    """
    data = await service.get_conversations(current_user.id)

    conversations = []
    for c in data["conversations"]:
        last_msg = None
        if c["last_message"]:
            last_msg = LastMessage(
                id=c["last_message"]["id"],
                content=c["last_message"]["content"],
                sender_id=c["last_message"]["sender_id"],
                created_at=c["last_message"]["created_at"],
            )
        conversations.append(ConversationResponse(
            conversation_id=c["conversation_id"],
            friend_id=c["friend_id"],
            friend_display_name=c["friend_display_name"],
            friend_avatar_url=c["friend_avatar_url"],
            is_online=c["is_online"],
            last_message=last_msg,
            unread_count=c["unread_count"],
            updated_at=c["updated_at"],
        ))

    return APIResponse.ok(ConversationListResponse(
        conversations=conversations,
        total_unread=data["total_unread"],
    ))


# ============================================
# Unread Count (must be before /{friend_id} routes)
# ============================================

@router.get(
    "/unread/count",
    response_model=APIResponse[dict],
)
async def get_unread_count(
    current_user: CurrentUser,
    service: MessageServiceDep,
):
    """Get total unread message count across all conversations."""
    count = await service.get_unread_count(current_user.id)
    return APIResponse.ok({"unread_count": count})


# ============================================
# Messages
# ============================================

@router.get(
    "/{friend_id}",
    response_model=APIResponse[MessageHistoryResponse],
)
async def get_messages(
    friend_id: str,
    current_user: CurrentUser,
    service: MessageServiceDep,
    limit: int = Query(default=50, ge=1, le=100),
    before_id: str | None = Query(default=None),
):
    """
    Get message history with a friend.
    
    Returns messages in chronological order (oldest first).
    Use `before_id` for pagination to load older messages.
    """
    data = await service.get_messages(
        current_user.id,
        friend_id,
        limit,
        before_id,
    )

    messages = [MessageResponse(**m) for m in data["messages"]]

    return APIResponse.ok(MessageHistoryResponse(
        messages=messages,
        has_more=data["has_more"],
        oldest_id=data["oldest_id"],
    ))


@router.post(
    "/{friend_id}",
    response_model=APIResponse[MessageResponse],
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    friend_id: str,
    request: SendMessageRequest,
    current_user: CurrentUser,
    service: MessageServiceDep,
):
    """
    Send a message to a friend.
    
    Message is delivered in real-time via WebSocket if recipient is online.
    """
    message = await service.send_message(
        current_user.id,
        friend_id,
        request.content,
    )

    return APIResponse.ok(MessageResponse(**message))


@router.post(
    "/{friend_id}/read",
    response_model=APIResponse[dict],
)
async def mark_as_read(
    friend_id: str,
    current_user: CurrentUser,
    service: MessageServiceDep,
):
    """
    Mark all messages from a friend as read.
    
    Sends read receipt notification to the friend via WebSocket.
    """
    result = await service.mark_as_read(current_user.id, friend_id)
    return APIResponse.ok(result)
