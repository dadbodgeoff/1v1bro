"""
Notification API endpoints.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user, get_supabase_client
from app.core.responses import success_response
from app.schemas.notification import (
    NotificationListResponse,
    NotificationCountResponse,
    MarkReadRequest,
    MarkReadResponse,
)
from app.services.notification_service import NotificationService


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    unread_only: bool = Query(default=False),
    user=Depends(get_current_user),
    client=Depends(get_supabase_client),
):
    """
    Get notifications for the current user.
    
    - **limit**: Max notifications to return (1-100, default 50)
    - **offset**: Pagination offset
    - **unread_only**: Only return unread notifications
    """
    service = NotificationService(client)
    result = await service.get_notifications(
        user_id=user.id,
        limit=limit,
        offset=offset,
        unread_only=unread_only,
    )
    return result


@router.get("/count", response_model=NotificationCountResponse)
async def get_unread_count(
    user=Depends(get_current_user),
    client=Depends(get_supabase_client),
):
    """Get count of unread notifications."""
    service = NotificationService(client)
    count = await service.get_unread_count(user.id)
    return {"unread_count": count}


@router.post("/read", response_model=MarkReadResponse)
async def mark_as_read(
    request: MarkReadRequest,
    user=Depends(get_current_user),
    client=Depends(get_supabase_client),
):
    """
    Mark specific notifications as read.
    
    - **notification_ids**: List of notification IDs to mark as read
    """
    service = NotificationService(client)
    count = await service.mark_as_read(user.id, request.notification_ids)
    return {"marked_count": count}


@router.post("/read-all", response_model=MarkReadResponse)
async def mark_all_as_read(
    user=Depends(get_current_user),
    client=Depends(get_supabase_client),
):
    """Mark all notifications as read."""
    service = NotificationService(client)
    count = await service.mark_all_as_read(user.id)
    return {"marked_count": count}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user=Depends(get_current_user),
    client=Depends(get_supabase_client),
):
    """Delete a specific notification."""
    service = NotificationService(client)
    deleted = await service.delete_notification(user.id, notification_id)
    if deleted:
        return success_response(message="Notification deleted")
    return success_response(message="Notification not found or already deleted")
