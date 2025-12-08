"""
Profile API endpoints.
Requirements: 2.1-2.6
"""

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, ProfileServiceDep, AchievementServiceDep
from app.core.responses import APIResponse
from app.schemas.profile import (
    Profile,
    ProfileUpdate,
    PrivacySettings,
    SignedUploadUrl,
    UploadConfirmRequest,
    UploadConfirmResponse,
)
from app.schemas.match_history import MatchHistoryResponse
from app.schemas.achievement import AchievementsResponse, AchievementCheckResponse


router = APIRouter(prefix="/profiles", tags=["Profiles"])


import logging

logger = logging.getLogger(__name__)


@router.get(
    "/me",
    response_model=APIResponse[Profile],
)
async def get_my_profile(
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
):
    """
    Get the current user's profile.
    
    Returns the full profile for the authenticated user.
    If profile doesn't exist yet, returns a default profile structure.
    """
    try:
        profile = await profile_service.get_profile(
            user_id=current_user.id,
            viewer_id=current_user.id,
        )
    except Exception as e:
        # Log the actual error for debugging, but return default profile
        # This handles cases where the profile trigger hasn't run yet
        logger.warning(f"Failed to fetch profile for user {current_user.id}: {e}")
        profile = None
    
    if not profile:
        # Return a minimal default profile instead of 404
        # This handles cases where the profile trigger hasn't run yet
        from app.schemas.profile import Profile, SocialLinks
        default_name = "Player"
        if hasattr(current_user, 'display_name') and current_user.display_name:
            default_name = current_user.display_name
        elif hasattr(current_user, 'email') and current_user.email:
            default_name = current_user.email.split("@")[0]
        
        profile = Profile(
            user_id=current_user.id,
            display_name=default_name,
            avatar_url=None,
            bio=None,
            country=None,
            banner_url=None,
            banner_color="#1a1a2e",
            social_links=SocialLinks(),
            is_public=True,
            accept_friend_requests=True,
            allow_messages=True,
            level=1,
            total_xp=0,
            title="Rookie",
        )
    
    return APIResponse.ok(profile)


@router.put(
    "/me",
    response_model=APIResponse[Profile],
)
async def update_my_profile(
    updates: ProfileUpdate,
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
):
    """
    Update the current user's profile.
    
    Allows updating display_name, bio, country, banner_color, and social_links.
    """
    profile = await profile_service.update_profile(
        user_id=current_user.id,
        updates=updates,
    )
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    
    return APIResponse.ok(profile)


@router.get(
    "/{user_id}",
    response_model=APIResponse[Profile],
)
async def get_profile(
    user_id: str,
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
):
    """
    Get a user's profile by ID.
    
    Returns the profile with privacy filtering applied based on the viewer.
    Private profiles will return limited information.
    """
    profile = await profile_service.get_profile(
        user_id=user_id,
        viewer_id=current_user.id,
    )
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    
    return APIResponse.ok(profile)


@router.put(
    "/me/privacy",
    response_model=APIResponse[Profile],
)
async def update_privacy_settings(
    settings: PrivacySettings,
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
):
    """
    Update profile privacy settings.
    
    Controls profile visibility, friend requests, and messaging permissions.
    """
    profile = await profile_service.update_privacy_settings(
        user_id=current_user.id,
        settings=settings,
    )
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    
    return APIResponse.ok(profile)


# ============================================
# Match History Endpoint
# ============================================

@router.get(
    "/me/matches",
    response_model=APIResponse[MatchHistoryResponse],
)
async def get_my_match_history(
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
    limit: int = Query(default=10, ge=1, le=50, description="Number of matches to return"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
):
    """
    Get the current user's match history.
    
    Returns recent matches with opponent info, outcome, and XP earned.
    Paginated with limit/offset parameters.
    """
    result = await profile_service.get_match_history(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )
    
    return APIResponse.ok(result)


# ============================================
# Achievements Endpoint
# ============================================

@router.get(
    "/me/achievements",
    response_model=APIResponse[AchievementsResponse],
)
async def get_my_achievements(
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
):
    """
    Get the current user's earned achievements.
    
    Returns all achievements the user has earned, sorted by rarity and date.
    """
    result = await profile_service.get_achievements(
        user_id=current_user.id,
    )
    
    return APIResponse.ok(result)


@router.post(
    "/me/achievements/check",
    response_model=APIResponse[AchievementCheckResponse],
)
async def check_achievements(
    current_user: CurrentUser,
    achievement_service: AchievementServiceDep,
):
    """
    Check and award any newly earned achievements.
    
    Compares user's current stats against all achievement criteria
    and awards any achievements that have been newly unlocked.
    
    Returns list of newly awarded achievements.
    """
    newly_awarded = await achievement_service.check_achievements_for_user(
        user_id=current_user.id,
    )
    
    return APIResponse.ok(AchievementCheckResponse(
        newly_awarded=[
            {
                "id": a["id"],
                "name": a["name"],
                "description": a["description"],
                "icon_url": a.get("icon_url"),
                "rarity": a.get("rarity", "common"),
            }
            for a in newly_awarded
        ],
        count=len(newly_awarded),
    ))


# ============================================
# Avatar Upload Endpoints
# ============================================

@router.post(
    "/me/avatar/upload-url",
    response_model=APIResponse[SignedUploadUrl],
)
async def get_avatar_upload_url(
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
    content_type: str = "image/jpeg",
):
    """
    Get a signed URL for avatar upload.
    
    Returns a pre-signed URL that allows direct upload to cloud storage.
    The URL expires in 5 minutes.
    
    Supported content types: image/jpeg, image/png, image/webp
    Maximum file size: 5MB
    """
    if content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Allowed: image/jpeg, image/png, image/webp",
        )
    
    signed_url = await profile_service.get_avatar_upload_url(
        user_id=current_user.id,
        content_type=content_type,
    )
    
    return APIResponse.ok(signed_url)


@router.post(
    "/me/avatar/confirm",
    response_model=APIResponse[UploadConfirmResponse],
)
async def confirm_avatar_upload(
    request: UploadConfirmRequest,
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
):
    """
    Confirm avatar upload and trigger processing.
    
    After uploading to the signed URL, call this endpoint to:
    1. Trigger image resizing (128x128, 256x256, 512x512)
    2. Update the profile with the new avatar URL
    3. Clean up old avatar versions
    """
    result = await profile_service.confirm_avatar_upload(
        user_id=current_user.id,
        storage_path=request.storage_path,
    )
    
    return APIResponse.ok(result)


# ============================================
# Banner Upload Endpoints
# ============================================

@router.post(
    "/me/banner/upload-url",
    response_model=APIResponse[SignedUploadUrl],
)
async def get_banner_upload_url(
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
    content_type: str = "image/jpeg",
):
    """
    Get a signed URL for banner upload.
    
    Returns a pre-signed URL that allows direct upload to cloud storage.
    The URL expires in 5 minutes.
    
    Supported content types: image/jpeg, image/png, image/webp
    Maximum file size: 10MB
    """
    if content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Allowed: image/jpeg, image/png, image/webp",
        )
    
    signed_url = await profile_service.get_banner_upload_url(
        user_id=current_user.id,
        content_type=content_type,
    )
    
    return APIResponse.ok(signed_url)


@router.post(
    "/me/banner/confirm",
    response_model=APIResponse[UploadConfirmResponse],
)
async def confirm_banner_upload(
    request: UploadConfirmRequest,
    current_user: CurrentUser,
    profile_service: ProfileServiceDep,
):
    """
    Confirm banner upload and trigger processing.
    
    After uploading to the signed URL, call this endpoint to:
    1. Trigger image resizing (960x270, 1920x540)
    2. Update the profile with the new banner URL
    3. Clean up old banner versions
    """
    result = await profile_service.confirm_banner_upload(
        user_id=current_user.id,
        storage_path=request.storage_path,
    )
    
    return APIResponse.ok(result)
