"""
Settings API endpoints.
Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentUser, SupabaseServiceClient
from app.services.settings_service import SettingsService
from app.core.responses import APIResponse
from app.schemas.settings import (
    NotificationPreferences,
    NotificationPreferencesUpdate,
    AudioSettings,
    AudioSettingsUpdate,
    VideoSettings,
    VideoSettingsUpdate,
    AccessibilitySettings,
    AccessibilitySettingsUpdate,
    Keybinds,
    KeybindsUpdate,
    UserSettingsResponse,
    PrivacySettingsExtended,
    PrivacySettingsExtendedUpdate,
)

router = APIRouter(prefix="/settings", tags=["settings"])


def get_settings_service(client: SupabaseServiceClient) -> SettingsService:
    """Get settings service instance."""
    return SettingsService(client)


SettingsServiceDep = Annotated[SettingsService, Depends(get_settings_service)]


@router.get(
    "/me",
    response_model=APIResponse[UserSettingsResponse],
)
async def get_all_settings(
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Get all user settings.
    
    Returns notification preferences, audio, video, accessibility, and keybind settings.
    """
    settings = await settings_service.get_all_settings(current_user.id)
    return APIResponse.ok(settings)


@router.put(
    "/notifications",
    response_model=APIResponse[NotificationPreferences],
)
async def update_notification_settings(
    updates: NotificationPreferencesUpdate,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Update notification preferences.
    
    Controls email, push, friend activity, match updates, and marketing notifications.
    """
    result = await settings_service.update_notifications(current_user.id, updates)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification settings",
        )
    return APIResponse.ok(result)


@router.put(
    "/audio",
    response_model=APIResponse[AudioSettings],
)
async def update_audio_settings(
    updates: AudioSettingsUpdate,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Update audio settings.
    
    Controls master, music, SFX, and voice volume levels (0-100).
    """
    result = await settings_service.update_audio(current_user.id, updates)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update audio settings",
        )
    return APIResponse.ok(result)


@router.put(
    "/video",
    response_model=APIResponse[VideoSettings],
)
async def update_video_settings(
    updates: VideoSettingsUpdate,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Update video settings.
    
    Controls quality preset, FPS limit, and FPS counter visibility.
    """
    result = await settings_service.update_video(current_user.id, updates)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update video settings",
        )
    return APIResponse.ok(result)


@router.put(
    "/accessibility",
    response_model=APIResponse[AccessibilitySettings],
)
async def update_accessibility_settings(
    updates: AccessibilitySettingsUpdate,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Update accessibility settings.
    
    Controls reduced motion, colorblind mode, font scale, and high contrast.
    """
    result = await settings_service.update_accessibility(current_user.id, updates)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update accessibility settings",
        )
    return APIResponse.ok(result)


@router.put(
    "/keybinds",
    response_model=APIResponse[Keybinds],
)
async def update_keybinds(
    updates: KeybindsUpdate,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Update keybind settings.
    
    Controls keyboard shortcuts for game actions.
    """
    result = await settings_service.update_keybinds(current_user.id, updates)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update keybinds",
        )
    
    # Check for conflicts and warn
    conflicts = result.has_conflicts()
    if conflicts:
        return APIResponse.ok(
            result,
            message=f"Keybinds updated with conflicts: {conflicts}",
        )
    
    return APIResponse.ok(result)


@router.post(
    "/keybinds/reset",
    response_model=APIResponse[Keybinds],
)
async def reset_keybinds(
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Reset keybinds to default values.
    """
    result = await settings_service.reset_keybinds(current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset keybinds",
        )
    return APIResponse.ok(result)


@router.put(
    "/privacy",
    response_model=APIResponse[PrivacySettingsExtended],
)
async def update_privacy_settings_extended(
    updates: PrivacySettingsExtendedUpdate,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Update extended privacy settings.
    
    Controls profile visibility, friend requests, messages, online status, and match history visibility.
    """
    result = await settings_service.update_privacy_extended(current_user.id, updates)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update privacy settings",
        )
    return APIResponse.ok(result)


# ============================================
# Account Management Endpoints
# Requirements: 9.2, 9.3, 9.4
# ============================================

from app.schemas.settings import (
    DeleteAccountRequest,
    DataExportResponse,
)


@router.post(
    "/account/export",
    response_model=APIResponse[DataExportResponse],
)
async def request_data_export(
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Request a data export for the current user.
    
    Triggers an async job to compile all user data into a downloadable format.
    User will be notified via email when export is ready.
    """
    result = await settings_service.request_data_export(current_user.id)
    return APIResponse.ok(result)


@router.delete(
    "/account",
    response_model=APIResponse[dict],
)
async def delete_account(
    request: DeleteAccountRequest,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep,
):
    """
    Schedule account deletion for the current user.
    
    Requires password verification and typing 'DELETE' to confirm.
    Account will be soft-deleted and permanently removed after 30 days.
    """
    result = await settings_service.schedule_account_deletion(
        current_user.id, 
        request.password,
        request.confirmation
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to schedule account deletion. Please verify your password.",
        )
    return APIResponse.ok({
        "status": "scheduled",
        "message": "Account scheduled for deletion. You have 30 days to cancel.",
    })
