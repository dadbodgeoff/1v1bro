"""
Friend API endpoints.
"""

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, FriendServiceDep
from app.core.responses import APIResponse
from app.services.presence_service import presence_service
from app.schemas.friend import (
    FriendRequest,
    FriendsListResponse,
    FriendResponse,
    FriendRequestResponse,
    GameInviteRequest,
    GameInviteResponse,
    PendingInvitesResponse,
    UserSearchResponse,
    UserSearchResult,
    OnlineStatusSettings,
)


router = APIRouter(prefix="/friends", tags=["Friends"])


# ============================================
# Friends List
# ============================================

@router.get(
    "",
    response_model=APIResponse[FriendsListResponse],
)
async def get_friends_list(
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """
    Get current user's friends list.
    
    Includes accepted friends, pending requests received, and sent requests.
    """
    data = await friend_service.get_friends_list(current_user.id)
    
    return APIResponse.ok(
        FriendsListResponse(
            friends=[FriendResponse(**f) for f in data["friends"]],
            pending_requests=[FriendRequestResponse(**r) for r in data["pending_requests"]],
            sent_requests=[FriendRequestResponse(**r) for r in data["sent_requests"]],
        )
    )


# ============================================
# Friend Requests
# ============================================

@router.post(
    "/request",
    response_model=APIResponse[dict],
    status_code=status.HTTP_201_CREATED,
)
async def send_friend_request(
    request: FriendRequest,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """
    Send a friend request to another user.
    
    If the target user has already sent you a request, this will auto-accept.
    """
    result = await friend_service.send_friend_request(
        current_user.id,
        request.user_id
    )
    return APIResponse.ok(result)


@router.post(
    "/{friendship_id}/accept",
    response_model=APIResponse[dict],
)
async def accept_friend_request(
    friendship_id: str,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """Accept a pending friend request."""
    result = await friend_service.accept_friend_request(friendship_id, current_user.id)
    return APIResponse.ok(result)


@router.post(
    "/{friendship_id}/decline",
    response_model=APIResponse[dict],
)
async def decline_friend_request(
    friendship_id: str,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """Decline a pending friend request."""
    result = await friend_service.decline_friend_request(friendship_id, current_user.id)
    return APIResponse.ok(result)


# ============================================
# Friend Management
# ============================================

@router.delete(
    "/{friendship_id}",
    response_model=APIResponse[dict],
)
async def remove_friend(
    friendship_id: str,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """Remove a friend."""
    result = await friend_service.remove_friend(friendship_id, current_user.id)
    return APIResponse.ok(result)


# ============================================
# Blocking
# ============================================

@router.post(
    "/block/{user_id}",
    response_model=APIResponse[dict],
)
async def block_user(
    user_id: str,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """
    Block a user.
    
    Blocks all interactions including friend requests, game invites, and search.
    """
    result = await friend_service.block_user(current_user.id, user_id)
    return APIResponse.ok(result)


@router.delete(
    "/block/{user_id}",
    response_model=APIResponse[dict],
)
async def unblock_user(
    user_id: str,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """Unblock a user."""
    result = await friend_service.unblock_user(current_user.id, user_id)
    return APIResponse.ok(result)


@router.get(
    "/blocked",
    response_model=APIResponse[list[dict]],
)
async def get_blocked_users(
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """Get list of blocked users."""
    result = await friend_service.get_blocked_users(current_user.id)
    return APIResponse.ok(result)


# ============================================
# Game Invites
# ============================================

@router.post(
    "/{friend_id}/invite",
    response_model=APIResponse[dict],
    status_code=status.HTTP_201_CREATED,
)
async def send_game_invite(
    friend_id: str,
    request: GameInviteRequest,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """
    Send a game invite to a friend.
    
    Invite expires after 120 seconds.
    """
    result = await friend_service.send_game_invite(
        current_user.id,
        friend_id,
        request.lobby_code
    )
    return APIResponse.ok(result)


@router.get(
    "/invites",
    response_model=APIResponse[PendingInvitesResponse],
)
async def get_pending_invites(
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """Get pending game invites."""
    invites = await friend_service.get_pending_invites(current_user.id)
    return APIResponse.ok(
        PendingInvitesResponse(
            invites=[GameInviteResponse(**inv) for inv in invites]
        )
    )


@router.post(
    "/invites/{invite_id}/accept",
    response_model=APIResponse[dict],
)
async def accept_game_invite(
    invite_id: str,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """Accept a game invite and get the lobby code."""
    result = await friend_service.accept_game_invite(invite_id, current_user.id)
    return APIResponse.ok(result)


@router.post(
    "/invites/{invite_id}/decline",
    response_model=APIResponse[dict],
)
async def decline_game_invite(
    invite_id: str,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """Decline a game invite."""
    result = await friend_service.decline_game_invite(invite_id, current_user.id)
    return APIResponse.ok(result)


# ============================================
# User Search
# ============================================

@router.get(
    "/search",
    response_model=APIResponse[UserSearchResponse],
)
async def search_users(
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
    q: str = Query(..., min_length=2, max_length=50, description="Search query"),
    limit: int = Query(default=10, ge=1, le=50),
):
    """
    Search users by display name.
    
    Excludes blocked users and users who have blocked you.
    """
    users = await friend_service.search_users(current_user.id, q, limit)
    return APIResponse.ok(
        UserSearchResponse(
            users=[UserSearchResult(**u) for u in users],
            total=len(users)
        )
    )


# ============================================
# Settings
# ============================================

@router.put(
    "/settings/online-status",
    response_model=APIResponse[dict],
)
async def update_online_status_setting(
    settings: OnlineStatusSettings,
    current_user: CurrentUser,
    friend_service: FriendServiceDep,
):
    """Update online status visibility setting."""
    result = await friend_service.update_online_status_setting(
        current_user.id,
        settings.show_online_status
    )
    return APIResponse.ok(result)


# ============================================
# Presence / Heartbeat
# ============================================

@router.post(
    "/heartbeat",
    response_model=APIResponse[dict],
)
async def heartbeat(
    current_user: CurrentUser,
):
    """
    Send a heartbeat to maintain online presence.
    
    Call this every 30 seconds while the app is open to show as online.
    Users without WebSocket connections can use this to appear online.
    """
    presence_service.heartbeat(current_user.id)
    return APIResponse.ok({"status": "ok"})
