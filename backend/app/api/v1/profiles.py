"""
Profile API endpoints.
Requirements: 2.1-2.6
"""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, ProfileServiceDep
from app.core.responses import APIResponse
from app.schemas.profile import (
    Profile,
    ProfileUpdate,
    PrivacySettings,
    SignedUploadUrl,
    UploadConfirmRequest,
    UploadConfirmResponse,
)


router = APIRouter(prefix="/profiles", tags=["Profiles"])


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
    """
    profile = await profile_service.get_profile(
        user_id=current_user.id,
        viewer_id=current_user.id,
    )
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
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
